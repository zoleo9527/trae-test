import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/database';
import { AuthRequest, requireRole } from '../middleware/auth';
import type { RefundRequest } from '../types';

const router = Router();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, showId, type } = req.query;

    let requests = [...db.refundRequests];

    if (status) {
      requests = requests.filter((r) => r.status === status);
    }
    if (showId) {
      requests = requests.filter((r) => r.showId === showId);
    }
    if (type) {
      requests = requests.filter((r) => r.type === type);
    }

    const requestsWithDetail = requests.map((request) => {
      const show = db.shows.find((s) => s.id === request.showId);
      const order = db.groupOrders.find((o) => o.id === request.orderId);
      const newShow = request.newShowId
        ? db.shows.find((s) => s.id === request.newShowId)
        : null;
      return {
        ...request,
        showName: show?.name,
        showTime: show?.startTime,
        organization: order?.organization,
        orderNo: order?.orderNo,
        newShowName: newShow?.name,
        newShowTime: newShow?.startTime,
      };
    });

    res.json(requestsWithDetail);
  } catch (error) {
    console.error('Get refund requests error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const request = db.refundRequests.find((r) => r.id === req.params.id);
    if (!request) {
      return res.status(404).json({ message: '退改申请不存在' });
    }

    const show = db.shows.find((s) => s.id === request.showId);
    const order = db.groupOrders.find((o) => o.id === request.orderId);
    const newShow = request.newShowId
      ? db.shows.find((s) => s.id === request.newShowId)
      : null;

    res.json({
      ...request,
      show,
      order,
      newShow,
    });
  } catch (error) {
    console.error('Get refund request error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      orderId,
      type,
      reason,
      refundTicketCount,
      applicantName,
      applicantPhone,
      newShowId,
    } = req.body;

    if (!orderId || !type || !reason || !refundTicketCount || !applicantName || !applicantPhone) {
      return res.status(400).json({ message: '缺少必填字段' });
    }

    const order = db.groupOrders.find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ message: '团单不存在' });
    }

    const refundAmount = refundTicketCount * order.unitPrice;

    const requestNo = `TK${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(db.refundRequests.length + 1).padStart(3, '0')}`;

    const newRequest: RefundRequest = {
      id: uuidv4(),
      requestNo,
      orderId,
      showId: order.showId,
      type,
      reason,
      originalTicketCount: order.ticketCount,
      refundTicketCount,
      refundAmount,
      newShowId,
      status: 'PENDING',
      applicantName,
      applicantPhone,
      createdAt: new Date().toISOString(),
    };

    db.refundRequests.push(newRequest);

    db.addOperationLog(
      req.user?.id || 'system',
      req.user?.name || '系统',
      '提交退改申请',
      'RefundRequest',
      newRequest.id,
      `提交了${order.organization}的退改申请，${refundTicketCount}张票`
    );

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create refund request error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/ticket-approve', requireRole('TICKET_SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const request = db.refundRequests.find((r) => r.id === req.params.id);
    if (!request) {
      return res.status(404).json({ message: '退改申请不存在' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: '当前状态不支持票务审批' });
    }

    const { approvalNote } = req.body;

    request.status = 'APPROVED_TICKET';
    request.ticketApprovedBy = req.user!.id;
    request.ticketApprovedAt = new Date().toISOString();
    request.ticketApprovalNote = approvalNote;

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '票务审批通过',
      'RefundRequest',
      request.id,
      `票务主管审批通过${request.requestNo}退改申请`
    );

    res.json(request);
  } catch (error) {
    console.error('Ticket approve error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/manager-approve', requireRole('THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const request = db.refundRequests.find((r) => r.id === req.params.id);
    if (!request) {
      return res.status(404).json({ message: '退改申请不存在' });
    }

    if (request.status !== 'APPROVED_TICKET') {
      return res.status(400).json({ message: '请先完成票务审批' });
    }

    const { approvalNote } = req.body;

    request.status = 'APPROVED_MANAGER';
    request.managerApprovedBy = req.user!.id;
    request.managerApprovedAt = new Date().toISOString();
    request.managerApprovalNote = approvalNote;

    const order = db.groupOrders.find((o) => o.id === request.orderId);
    if (order && order.settlement) {
      order.settlement.refundAmount += request.refundAmount;
      order.settlement.netAmount = order.settlement.totalAmount - order.settlement.refundAmount;
      order.settlement.updatedAt = new Date().toISOString();

      if (request.type === 'FULL') {
        order.status = 'CANCELLED';
      } else if (request.type === 'PARTIAL') {
        order.ticketCount -= request.refundTicketCount;
        order.totalAmount = order.ticketCount * order.unitPrice;
      } else if (request.type === 'DATE_CHANGE' && request.newShowId) {
        order.showId = request.newShowId;
        order.status = 'MODIFIED';
      }

      order.changeLog.push({
        id: uuidv4(),
        changedBy: req.user!.id,
        changedAt: new Date().toISOString(),
        action: '退改审批通过',
        description: `退改申请${request.requestNo}已通过，${request.refundTicketCount}张票，退款${request.refundAmount}元`,
      });
      order.updatedAt = new Date().toISOString();
      order.version += 1;
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date().toISOString();

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '经理审批通过',
      'RefundRequest',
      request.id,
      `剧院经理审批通过${request.requestNo}退改申请，已完成退款处理`
    );

    res.json(request);
  } catch (error) {
    console.error('Manager approve error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/reject', requireRole('TICKET_SUPERVISOR', 'THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const request = db.refundRequests.find((r) => r.id === req.params.id);
    if (!request) {
      return res.status(404).json({ message: '退改申请不存在' });
    }

    if (request.status === 'COMPLETED' || request.status === 'REJECTED') {
      return res.status(400).json({ message: '当前状态不支持驳回' });
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: '请填写驳回原因' });
    }

    request.status = 'REJECTED';
    request.rejectedBy = req.user!.id;
    request.rejectedAt = new Date().toISOString();
    request.rejectionReason = rejectionReason;

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '驳回退改申请',
      'RefundRequest',
      request.id,
      `驳回了${request.requestNo}退改申请，原因：${rejectionReason}`
    );

    res.json(request);
  } catch (error) {
    console.error('Reject refund error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/batch-approve/ticket', requireRole('TICKET_SUPERVISOR'), async (req: AuthRequest, res) => {
  try {
    const { requestIds, approvalNote } = req.body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ message: '请选择要审批的申请' });
    }

    const results: { success: boolean; requestId: string; message?: string }[] = [];

    for (const requestId of requestIds) {
      const request = db.refundRequests.find((r) => r.id === requestId);
      if (!request) {
        results.push({ success: false, requestId, message: '申请不存在' });
        continue;
      }
      if (request.status !== 'PENDING') {
        results.push({ success: false, requestId, message: '状态不支持审批' });
        continue;
      }

      request.status = 'APPROVED_TICKET';
      request.ticketApprovedBy = req.user!.id;
      request.ticketApprovedAt = new Date().toISOString();
      request.ticketApprovalNote = approvalNote;

      results.push({ success: true, requestId });
    }

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '批量票务审批',
      'RefundRequest',
      'batch',
      `批量审批了${results.filter((r) => r.success).length}个退改申请`
    );

    res.json({
      total: requestIds.length,
      successCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch ticket approve error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/batch-approve/manager', requireRole('THEATER_MANAGER'), async (req: AuthRequest, res) => {
  try {
    const { requestIds, approvalNote } = req.body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ message: '请选择要审批的申请' });
    }

    const results: { success: boolean; requestId: string; message?: string }[] = [];

    for (const requestId of requestIds) {
      const request = db.refundRequests.find((r) => r.id === requestId);
      if (!request) {
        results.push({ success: false, requestId, message: '申请不存在' });
        continue;
      }
      if (request.status !== 'APPROVED_TICKET') {
        results.push({ success: false, requestId, message: '请先完成票务审批' });
        continue;
      }

      request.status = 'APPROVED_MANAGER';
      request.managerApprovedBy = req.user!.id;
      request.managerApprovedAt = new Date().toISOString();
      request.managerApprovalNote = approvalNote;

      const order = db.groupOrders.find((o) => o.id === request.orderId);
      if (order && order.settlement) {
        order.settlement.refundAmount += request.refundAmount;
        order.settlement.netAmount = order.settlement.totalAmount - order.settlement.refundAmount;
        order.settlement.updatedAt = new Date().toISOString();

        if (request.type === 'FULL') {
          order.status = 'CANCELLED';
        } else if (request.type === 'PARTIAL') {
          order.ticketCount -= request.refundTicketCount;
          order.totalAmount = order.ticketCount * order.unitPrice;
        } else if (request.type === 'DATE_CHANGE' && request.newShowId) {
          order.showId = request.newShowId;
          order.status = 'MODIFIED';
        }

        order.changeLog.push({
          id: uuidv4(),
          changedBy: req.user!.id,
          changedAt: new Date().toISOString(),
          action: '退改审批通过',
          description: `退改申请${request.requestNo}已通过`,
        });
        order.updatedAt = new Date().toISOString();
        order.version += 1;
      }

      request.status = 'COMPLETED';
      request.completedAt = new Date().toISOString();

      results.push({ success: true, requestId });
    }

    db.addOperationLog(
      req.user!.id,
      req.user!.name,
      '批量经理审批',
      'RefundRequest',
      'batch',
      `批量审批了${results.filter((r) => r.success).length}个退改申请`
    );

    res.json({
      total: requestIds.length,
      successCount: results.filter((r) => r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch manager approve error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
