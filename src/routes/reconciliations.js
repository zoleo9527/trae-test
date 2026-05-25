const express = require('express');
const { Op } = require('sequelize');
const { Reconciliation, ReconciliationItem, SampleShipment, Book, Channel, User, ActivityLog } = require('../models');
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
    const { status, channelId, period, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (channelId) where.channelId = channelId;
    if (period) where.period = period;

    const { count, rows } = await Reconciliation.findAndCountAll({
      where,
      include: [
        { model: Channel, attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] }
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
    console.error('Get reconciliations error:', error);
    res.status(500).json({ error: '获取对账列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reconciliation = await Reconciliation.findByPk(req.params.id, {
      include: [
        Channel,
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        {
          model: ReconciliationItem,
          include: [
            { model: Book, attributes: ['id', 'title', 'isbn'] },
            { model: SampleShipment, attributes: ['id', 'shipmentNo'] }
          ]
        }
      ]
    });

    if (!reconciliation) {
      return res.status(404).json({ error: '对账记录不存在' });
    }

    res.json(reconciliation);
  } catch (error) {
    console.error('Get reconciliation detail error:', error);
    res.status(500).json({ error: '获取对账详情失败' });
  }
});

router.post('/generate', requireRole([ROLES.FINANCE]), async (req, res) => {
  try {
    const { channelId, period } = req.body;

    const channel = await Channel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({ error: '渠道不存在' });
    }

    const [year, month] = period.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const shipments = await SampleShipment.findAll({
      where: {
        channelId,
        shipmentDate: { [Op.between]: [startDate, endDate] }
      },
      include: [Book]
    });

    let totalShipped = 0, totalShippedAmount = 0;
    let totalConfirmed = 0, totalConfirmedAmount = 0;
    let totalReturned = 0, totalReturnedAmount = 0;

    const items = [];

    for (const shipment of shipments) {
      const shippedQty = shipment.quantity;
      const shippedAmt = shipment.totalAmount;
      const confirmedQty = shipment.status === 'confirmed' ? shippedQty : 0;
      const confirmedAmt = shipment.status === 'confirmed' ? shippedAmt : 0;

      totalShipped += shippedQty;
      totalShippedAmount += parseFloat(shippedAmt);
      totalConfirmed += confirmedQty;
      totalConfirmedAmount += parseFloat(confirmedAmt);

      items.push({
        shipmentId: shipment.id,
        bookId: shipment.bookId,
        shippedQuantity: shippedQty,
        shippedAmount: shippedAmt,
        confirmedQuantity: confirmedQty,
        confirmedAmount: confirmedAmt,
        returnedQuantity: 0,
        returnedAmount: 0,
        difference: shippedQty - confirmedQty,
        differenceAmount: shippedAmt - confirmedAmt,
        status: confirmedQty === shippedQty ? 'matched' : 'discrepancy'
      });
    }

    const reconNo = `RC${period}-${channel.name.slice(0, 2).toUpperCase()}`;

    const reconciliation = await Reconciliation.create({
      reconNo,
      period,
      channelId,
      totalShipped,
      totalShippedAmount,
      totalConfirmed,
      totalConfirmedAmount,
      totalReturned,
      totalReturnedAmount,
      balanceQuantity: totalConfirmed - totalReturned,
      balanceAmount: totalConfirmedAmount - totalReturnedAmount,
      status: 'draft',
      createdBy: req.user.id
    });

    for (const item of items) {
      item.reconciliationId = reconciliation.id;
    }
    await ReconciliationItem.bulkCreate(items);

    await createActivityLog('reconciliation', reconciliation.id, 'generate', null, 'draft', '生成对账单', req.user.id);

    res.status(201).json(reconciliation);
  } catch (error) {
    console.error('Generate reconciliation error:', error);
    res.status(500).json({ error: '生成对账单失败' });
  }
});

router.put('/:id/submit', requireRole([ROLES.FINANCE]), async (req, res) => {
  try {
    const reconciliation = await Reconciliation.findByPk(req.params.id);
    if (!reconciliation) {
      return res.status(404).json({ error: '对账记录不存在' });
    }

    const oldStatus = reconciliation.status;

    await reconciliation.update({
      status: 'pending_approval'
    });

    await createActivityLog('reconciliation', reconciliation.id, 'submit', oldStatus, 'pending_approval', '提交对账单审批', req.user.id);

    res.json(reconciliation);
  } catch (error) {
    console.error('Submit reconciliation error:', error);
    res.status(500).json({ error: '提交对账失败' });
  }
});

router.put('/:id/approve', requireRole([ROLES.FINANCE]), async (req, res) => {
  try {
    const reconciliation = await Reconciliation.findByPk(req.params.id);
    if (!reconciliation) {
      return res.status(404).json({ error: '对账记录不存在' });
    }

    const oldStatus = reconciliation.status;

    await reconciliation.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await createActivityLog('reconciliation', reconciliation.id, 'approve', oldStatus, 'approved', '对账单已批准', req.user.id);

    res.json(reconciliation);
  } catch (error) {
    console.error('Approve reconciliation error:', error);
    res.status(500).json({ error: '审批对账失败' });
  }
});

router.put('/:id/finalize', requireRole([ROLES.FINANCE]), async (req, res) => {
  try {
    const reconciliation = await Reconciliation.findByPk(req.params.id);
    if (!reconciliation) {
      return res.status(404).json({ error: '对账记录不存在' });
    }

    const oldStatus = reconciliation.status;

    await reconciliation.update({
      status: 'finalized'
    });

    await createActivityLog('reconciliation', reconciliation.id, 'finalize', oldStatus, 'finalized', '对账单已最终确认', req.user.id);

    res.json(reconciliation);
  } catch (error) {
    console.error('Finalize reconciliation error:', error);
    res.status(500).json({ error: '确认对账失败' });
  }
});

module.exports = router;
