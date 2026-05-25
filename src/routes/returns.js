const express = require('express');
const { Op } = require('sequelize');
const { Return, SampleShipment, Book, Channel, User, ActivityLog } = require('../models');
const { authenticateToken, requireRole, ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const createActivityLog = async (entityType, entityId, action, oldStatus, newStatus, description, userId) => {
  await ActivityLog.create({
    entityType,
    entityId,
    action,
    oldStatus,
    newStatus,
    description,
    createdBy: userId
  });
};

router.get('/', async (req, res) => {
  try {
    const { status, shipmentId, caliberType, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (shipmentId) where.shipmentId = shipmentId;
    if (caliberType) where.caliberType = caliberType;

    const { count, rows } = await Return.findAndCountAll({
      where,
      include: [
        {
          model: SampleShipment,
          include: [
            { model: Book, attributes: ['id', 'title'] },
            { model: Channel, attributes: ['id', 'name'] }
          ]
        },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        { model: User, as: 'reconciler', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize)
    });

    res.json({
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      data: rows
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: '获取退货列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id, {
      include: [
        {
          model: SampleShipment,
          include: [Book, Channel]
        },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        { model: User, as: 'reconciler', attributes: ['id', 'name'] }
      ]
    });

    if (!returnRecord) {
      return res.status(404).json({ error: '退货记录不存在' });
    }

    res.json(returnRecord);
  } catch (error) {
    console.error('Get return detail error:', error);
    res.status(500).json({ error: '获取退货详情失败' });
  }
});

router.post('/', requireRole([ROLES.CHANNEL_MANAGER]), async (req, res) => {
  try {
    const { shipmentId, requestDate, returnReason, returnReasonDetail, requestedQuantity } = req.body;

    const shipment = await SampleShipment.findByPk(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: '寄送记录不存在' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Return.count({
      where: { returnNo: { [Op.like]: `RT${dateStr}%` } }
    });
    const returnNo = `RT${dateStr}${String(count + 1).padStart(3, '0')}`;

    const returnRecord = await Return.create({
      returnNo,
      shipmentId,
      requestDate: requestDate || new Date(),
      returnReason,
      returnReasonDetail,
      requestedQuantity,
      status: 'pending',
      caliberType: 'original',
      createdBy: req.user.id
    });

    await createActivityLog('return', returnRecord.id, 'create', null, 'pending', '创建退货申请', req.user.id);

    res.status(201).json(returnRecord);
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: '创建退货申请失败' });
  }
});

router.put('/:id/approve', requireRole([ROLES.DISTRIBUTION_SPECIALIST, ROLES.FINANCE]), async (req, res) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ error: '退货记录不存在' });
    }

    const oldStatus = returnRecord.status;
    const { approvedQuantity, caliberType, caliberNotes } = req.body;

    await returnRecord.update({
      approvedQuantity,
      caliberType: caliberType || 'channel',
      caliberNotes,
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await createActivityLog('return', returnRecord.id, 'approve', oldStatus, 'approved', `退货申请已批准，同意退回${approvedQuantity}本`, req.user.id);

    res.json(returnRecord);
  } catch (error) {
    console.error('Approve return error:', error);
    res.status(500).json({ error: '审批退货失败' });
  }
});

router.put('/:id/reject', requireRole([ROLES.DISTRIBUTION_SPECIALIST, ROLES.FINANCE]), async (req, res) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ error: '退货记录不存在' });
    }

    const oldStatus = returnRecord.status;

    await returnRecord.update({
      status: 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await createActivityLog('return', returnRecord.id, 'reject', oldStatus, 'rejected', '退货申请已拒绝', req.user.id);

    res.json(returnRecord);
  } catch (error) {
    console.error('Reject return error:', error);
    res.status(500).json({ error: '拒绝退货失败' });
  }
});

router.put('/:id/receive', requireRole([ROLES.DISTRIBUTION_SPECIALIST]), async (req, res) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ error: '退货记录不存在' });
    }

    const oldStatus = returnRecord.status;
    const { receivedQuantity, receivedDate } = req.body;

    await returnRecord.update({
      receivedQuantity,
      receivedDate: receivedDate || new Date(),
      status: 'received'
    });

    await createActivityLog('return', returnRecord.id, 'receive', oldStatus, 'received', `已收到退货${receivedQuantity}本`, req.user.id);

    res.json(returnRecord);
  } catch (error) {
    console.error('Receive return error:', error);
    res.status(500).json({ error: '确认收货失败' });
  }
});

router.put('/:id/reconcile', requireRole([ROLES.FINANCE]), async (req, res) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ error: '退货记录不存在' });
    }

    const oldStatus = returnRecord.status;

    await returnRecord.update({
      status: 'reconciled',
      reconciledBy: req.user.id,
      reconciledAt: new Date()
    });

    await createActivityLog('return', returnRecord.id, 'reconcile', oldStatus, 'reconciled', '退货已财务对账', req.user.id);

    res.json(returnRecord);
  } catch (error) {
    console.error('Reconcile return error:', error);
    res.status(500).json({ error: '对账失败' });
  }
});

router.put('/:id/update-caliber', requireRole([ROLES.DISTRIBUTION_SPECIALIST, ROLES.FINANCE]), async (req, res) => {
  try {
    const returnRecord = await Return.findByPk(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ error: '退货记录不存在' });
    }

    if (returnRecord.status === 'rejected') {
      return res.status(400).json({ error: '已拒绝的退货记录无法更新口径' });
    }

    if (returnRecord.status === 'reconciled') {
      return res.status(400).json({ error: '已对账的退货记录无法更新口径' });
    }

    const { approvedQuantity, caliberType, caliberNotes } = req.body;

    if (!approvedQuantity || !caliberType || !caliberNotes) {
      return res.status(400).json({ error: '批准数量、口径类型和口径说明为必填项' });
    }

    const oldCaliber = returnRecord.caliberType;
    const oldApprovedQty = returnRecord.approvedQuantity;

    const updateData = {
      approvedQuantity,
      caliberType,
      caliberNotes
    };

    if (returnRecord.status === 'pending') {
      updateData.status = 'approved';
      updateData.approvedBy = req.user.id;
      updateData.approvedAt = new Date();
    }

    await returnRecord.update(updateData);

    const description = `口径更新: ${oldCaliber || '原始口径'}(${oldApprovedQty || 0}本) → ${caliberType}(${approvedQuantity}本), 说明: ${caliberNotes}`;
    
    await createActivityLog('return', returnRecord.id, 'update_caliber', returnRecord.status, returnRecord.status, description, req.user.id);

    res.json(returnRecord);
  } catch (error) {
    console.error('Update caliber error:', error);
    res.status(500).json({ error: '更新口径失败' });
  }
});

module.exports = router;
