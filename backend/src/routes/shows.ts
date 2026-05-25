import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/database';
import { AuthRequest, requireRole } from '../middleware/auth';
import type { Show, RehearsalSlot, ShowChangeLog } from '../types';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, type, startDate, endDate } = req.query;

    let shows = [...db.shows];

    if (status) {
      shows = shows.filter((s) => s.status === status);
    }
    if (type) {
      shows = shows.filter((s) => s.type === type);
    }
    if (startDate) {
      shows = shows.filter((s) => new Date(s.startTime) >= new Date(startDate as string));
    }
    if (endDate) {
      shows = shows.filter((s) => new Date(s.startTime) <= new Date(endDate as string));
    }

    const showsWithOrders = shows.map((show) => {
      const orders = db.groupOrders.filter((o) => o.showId === show.id);
      const totalSold = orders.reduce((sum, o) => sum + o.ticketCount, 0);
      const refundRequests = db.refundRequests.filter((r) => r.showId === show.id);
      return {
        ...show,
        orders: orders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          organization: o.organization,
          ticketCount: o.ticketCount,
          status: o.status,
        })),
        totalSold,
        remainingSeats: show.totalSeats - totalSold,
        refundRequestCount: refundRequests.length,
      };
    });

    res.json(showsWithOrders);
  } catch (error) {
    console.error('Get shows error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const show = db.shows.find((s) => s.id === req.params.id);
    if (!show) {
      return res.status(404).json({ message: '场次不存在' });
    }

    const orders = db.groupOrders.filter((o) => o.showId === show.id);
    const refundRequests = db.refundRequests.filter((r) => r.showId === show.id);

    res.json({
      ...show,
      orders,
      refundRequests,
    });
  } catch (error) {
    console.error('Get show error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', requireRole('THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { name, type, startTime, endTime, venue, totalSeats } = req.body;

    if (!name || !type || !startTime || !endTime || !venue || !totalSeats) {
      return res.status(400).json({ message: '缺少必填字段' });
    }

    const newShow: Show = {
      id: uuidv4(),
      name,
      type,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      venue,
      totalSeats,
      status: 'DRAFT',
      rehearsalSchedule: [],
      createdBy: req.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      changeLog: [],
    };

    db.shows.push(newShow);

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '创建场次',
      'Show',
      newShow.id,
      `创建了场次：${name}`
    );

    res.status(201).json(newShow);
  } catch (error) {
    console.error('Create show error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', requireRole('THEATER_MANAGER', 'BACKEND_COORDINATOR'), async (req: AuthRequest, res) => {
  try {
    const showIndex = db.shows.findIndex((s) => s.id === req.params.id);
    if (showIndex === -1) {
      return res.status(404).json({ message: '场次不存在' });
    }

    const show = db.shows[showIndex];
    const { name, type, startTime, endTime, venue, totalSeats, status, reason } = req.body;

    const changeLog: ShowChangeLog[] = [];
    const now = new Date().toISOString();

    const checkAndLogChange = (field: string, oldValue: any, newValue: any) => {
      if (oldValue !== newValue && newValue !== undefined) {
        changeLog.push({
          id: uuidv4(),
          changedBy: req.user!.id,
          changedAt: now,
          field,
          oldValue: String(oldValue),
          newValue: String(newValue),
          reason,
        });
      }
    };

    checkAndLogChange('name', show.name, name);
    checkAndLogChange('type', show.type, type);
    checkAndLogChange('startTime', show.startTime, startTime ? new Date(startTime).toISOString() : undefined);
    checkAndLogChange('endTime', show.endTime, endTime ? new Date(endTime).toISOString() : undefined);
    checkAndLogChange('venue', show.venue, venue);
    checkAndLogChange('totalSeats', show.totalSeats, totalSeats);
    checkAndLogChange('status', show.status, status);

    const updatedShow: Show = {
      ...show,
      name: name || show.name,
      type: type || show.type,
      startTime: startTime ? new Date(startTime).toISOString() : show.startTime,
      endTime: endTime ? new Date(endTime).toISOString() : show.endTime,
      venue: venue || show.venue,
      totalSeats: totalSeats || show.totalSeats,
      status: status || show.status,
      updatedAt: now,
      version: show.version + 1,
      changeLog: [...show.changeLog, ...changeLog],
    };

    db.shows[showIndex] = updatedShow;

    if (startTime || endTime || status === 'CANCELLED') {
      const affectedOrders = db.groupOrders.filter((o) => o.showId === show.id);
      affectedOrders.forEach((order) => {
        order.status = 'MODIFIED';
        order.changeLog.push({
          id: uuidv4(),
          changedBy: req.user!.id,
          changedAt: now,
          action: '场次变更通知',
          description: `演出${startTime || endTime ? '时间' : ''}${status === 'CANCELLED' ? '取消' : '变更'}，请及时联系客户确认`,
        });
        order.updatedAt = now;
      });
    }

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '更新场次',
      'Show',
      show.id,
      `更新了场次：${show.name}，变更字段：${changeLog.map((c) => c.field).join(', ')}`
    );

    res.json(updatedShow);
  } catch (error) {
    console.error('Update show error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/rehearsal', requireRole('BACKEND_COORDINATOR', 'THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const show = db.shows.find((s) => s.id === req.params.id);
    if (!show) {
      return res.status(404).json({ message: '场次不存在' });
    }

    const { date, startTime, endTime, type } = req.body;

    const newSlot: RehearsalSlot = {
      id: uuidv4(),
      date,
      startTime,
      endTime,
      type,
    };

    show.rehearsalSchedule = show.rehearsalSchedule || [];
    show.rehearsalSchedule.push(newSlot);
    show.updatedAt = new Date().toISOString();

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '添加排练',
      'Show',
      show.id,
      `为《${show.name}》添加了${type}排练安排`
    );

    res.json(show);
  } catch (error) {
    console.error('Add rehearsal error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:showId/rehearsal/:slotId/confirm', requireRole('BACKEND_COORDINATOR'), async (req: AuthRequest, res) => {
  try {
    const show = db.shows.find((s) => s.id === req.params.showId);
    if (!show) {
      return res.status(404).json({ message: '场次不存在' });
    }

    const slot = show.rehearsalSchedule?.find((r) => r.id === req.params.slotId);
    if (!slot) {
      return res.status(404).json({ message: '排练时段不存在' });
    }

    slot.confirmedBy = req.user!.id;
    slot.confirmedAt = new Date().toISOString();
    show.updatedAt = new Date().toISOString();

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '确认排练',
      'Show',
      show.id,
      `确认了《${show.name}》的排练安排`
    );

    res.json(show);
  } catch (error) {
    console.error('Confirm rehearsal error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
