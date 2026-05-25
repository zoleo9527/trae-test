import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/database';
import { AuthRequest, requireRole } from '../middleware/auth';
import type { GroupOrder, OrderChangeLog, Settlement, PaymentRecord } from '../types';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { showId, status, organization } = req.query;

    let orders = [...db.groupOrders];

    if (showId) {
      orders = orders.filter((o) => o.showId === showId);
    }
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }
    if (organization) {
      orders = orders.filter((o) =>
        o.organization.includes(organization as string)
      );
    }

    const ordersWithShow = orders.map((order) => {
      const show = db.shows.find((s) => s.id === order.showId);
      const refundRequests = db.refundRequests.filter(
        (r) => r.orderId === order.id
      );
      return {
        ...order,
        showName: show?.name,
        showTime: show?.startTime,
        showStatus: show?.status,
        refundRequests,
      };
    });

    res.json(ordersWithShow);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const order = db.groupOrders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ message: '团单不存在' });
    }

    const show = db.shows.find((s) => s.id === order.showId);
    const refundRequests = db.refundRequests.filter(
      (r) => r.orderId === order.id
    );

    res.json({
      ...order,
      show,
      refundRequests,
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', requireRole('TICKET_SUPERVISOR', 'THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const {
      showId,
      organization,
      contactName,
      contactPhone,
      ticketCount,
      unitPrice,
      specialRequirements,
    } = req.body;

    if (!showId || !organization || !contactName || !contactPhone || !ticketCount || !unitPrice) {
      return res.status(400).json({ message: '缺少必填字段' });
    }

    const show = db.shows.find((s) => s.id === showId);
    if (!show) {
      return res.status(404).json({ message: '场次不存在' });
    }

    const orderNo = `GD${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(db.groupOrders.length + 1).padStart(3, '0')}`;
    const totalAmount = ticketCount * unitPrice;

    const newOrder: GroupOrder = {
      id: uuidv4(),
      orderNo,
      showId,
      organization,
      contactName,
      contactPhone,
      ticketCount,
      unitPrice,
      totalAmount,
      status: 'PENDING',
      specialRequirements,
      createdBy: req.user!.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      changeLog: [],
      settlement: {
        id: uuidv4(),
        orderId: '',
        totalAmount,
        paidAmount: 0,
        refundAmount: 0,
        netAmount: totalAmount,
        status: 'UNPAID',
        paymentRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
    newOrder.settlement!.orderId = newOrder.id;

    db.groupOrders.push(newOrder);

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '创建团单',
      'GroupOrder',
      newOrder.id,
      `创建了${organization}团单，${ticketCount}张票，金额${totalAmount}元`
    );

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/confirm', requireRole('TICKET_SUPERVISOR', 'THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const order = db.groupOrders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ message: '团单不存在' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: '当前状态不支持确认操作' });
    }

    order.status = 'CONFIRMED';
    order.confirmedBy = req.user!.id;
    order.confirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    order.changeLog.push({
      id: uuidv4(),
      changedBy: req.user!.id,
      changedAt: new Date().toISOString(),
      action: '确认',
      description: '票务主管确认订单',
    });
    order.version += 1;

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '确认团单',
      'GroupOrder',
      order.id,
      `确认了${order.organization}团单`
    );

    res.json(order);
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/payment', requireRole('TICKET_SUPERVISOR', 'THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const order = db.groupOrders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ message: '团单不存在' });
    }

    const { amount, paymentMethod, remark } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ message: '缺少必填字段' });
    }

    if (!order.settlement) {
      order.settlement = {
        id: uuidv4(),
        orderId: order.id,
        totalAmount: order.totalAmount,
        paidAmount: 0,
        refundAmount: 0,
        netAmount: order.totalAmount,
        status: 'UNPAID',
        paymentRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const paymentRecord: PaymentRecord = {
      id: uuidv4(),
      amount,
      paymentMethod,
      paidAt: new Date().toISOString(),
      recordedBy: req.user!.id,
      remark,
    };

    order.settlement.paymentRecords.push(paymentRecord);
    order.settlement.paidAmount += amount;
    order.settlement.updatedAt = new Date().toISOString();

    if (order.settlement.paidAmount >= order.settlement.totalAmount - order.settlement.refundAmount) {
      order.settlement.status = 'SETTLED';
      order.status = 'PAID';
    } else if (order.settlement.paidAmount > 0) {
      order.settlement.status = 'PARTIAL';
    }

    order.settlement.netAmount = order.settlement.totalAmount - order.settlement.refundAmount;

    order.changeLog.push({
      id: uuidv4(),
      changedBy: req.user!.id,
      changedAt: new Date().toISOString(),
      action: '收款',
      description: `收到款项${amount}元，${paymentMethod}${remark ? `，${remark}` : ''}`,
    });
    order.updatedAt = new Date().toISOString();
    order.version += 1;

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '登记收款',
      'GroupOrder',
      order.id,
      `登记${order.organization}团单收款${amount}元`
    );

    res.json(order);
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/batch-confirm', requireRole('TICKET_SUPERVISOR', 'THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: '请选择要确认的团单' });
    }

    const results: { success: boolean; orderId: string; message?: string }[] = [];

    for (const orderId of orderIds) {
      const order = db.groupOrders.find((o) => o.id === orderId);
      if (!order) {
        results.push({ success: false, orderId, message: '团单不存在' });
        continue;
      }
      if (order.status !== 'PENDING') {
        results.push({ success: false, orderId, message: '当前状态不支持确认操作' });
        continue;
      }

      order.status = 'CONFIRMED';
      order.confirmedBy = req.user!.id;
      order.confirmedAt = new Date().toISOString();
      order.updatedAt = new Date().toISOString();
      order.changeLog.push({
        id: uuidv4(),
        changedBy: req.user!.id,
        changedAt: new Date().toISOString(),
        action: '批量确认',
        description: '票务主管批量确认订单',
      });
      order.version += 1;

      results.push({ success: true, orderId });
    }

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '批量确认团单',
      'GroupOrder',
      'batch',
      `批量确认了${results.filter((r) => r.success).length}个团单`
    );

    res.json({
      total: orderIds.length,
      successCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch confirm error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
