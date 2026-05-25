const express = require('express');
const { Op } = require('sequelize');
const { SampleShipment, Book, Channel, User, ActivityLog, Feedback, Return } = require('../models');
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
    const { status, channelId, bookId, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (channelId) where.channelId = channelId;
    if (bookId) where.bookId = bookId;
    if (startDate && endDate) {
      where.shipmentDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await SampleShipment.findAndCountAll({
      where,
      include: [
        { model: Book, attributes: ['id', 'title', 'isbn'] },
        { model: Channel, attributes: ['id', 'name', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'confirmer', attributes: ['id', 'name'] }
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
    console.error('Get shipments error:', error);
    res.status(500).json({ error: '获取寄送列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shipment = await SampleShipment.findByPk(req.params.id, {
      include: [
        { model: Book },
        { model: Channel },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'confirmer', attributes: ['id', 'name'] },
        { model: Feedback },
        { model: Return }
      ]
    });

    if (!shipment) {
      return res.status(404).json({ error: '寄送记录不存在' });
    }

    const logs = await ActivityLog.findAll({
      where: { entityType: 'shipment', entityId: req.params.id },
      include: [{ model: User, as: 'operator', attributes: ['id', 'name'] }],
      order: [['timestamp', 'ASC']]
    });

    res.json({ ...shipment.toJSON(), activityLogs: logs });
  } catch (error) {
    console.error('Get shipment detail error:', error);
    res.status(500).json({ error: '获取寄送详情失败' });
  }
});

router.post('/', requireRole([ROLES.DISTRIBUTION_SPECIALIST]), async (req, res) => {
  try {
    const { bookId, channelId, quantity, unitPrice, notes } = req.body;

    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ error: '图书不存在' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await SampleShipment.count({
      where: { shipmentNo: { [Op.like]: `SS${dateStr}%` } }
    });
    const shipmentNo = `SS${dateStr}${String(count + 1).padStart(3, '0')}`;

    const shipment = await SampleShipment.create({
      shipmentNo,
      bookId,
      channelId,
      quantity,
      unitPrice,
      totalAmount: quantity * unitPrice,
      status: 'pending',
      createdBy: req.user.id,
      notes
    });

    await createActivityLog('shipment', shipment.id, 'create', null, 'pending', '创建样书寄送单', req.user.id);

    res.status(201).json(shipment);
  } catch (error) {
    console.error('Create shipment error:', error);
    res.status(500).json({ error: '创建寄送单失败' });
  }
});

router.put('/:id/ship', requireRole([ROLES.DISTRIBUTION_SPECIALIST]), async (req, res) => {
  try {
    const shipment = await SampleShipment.findByPk(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: '寄送记录不存在' });
    }

    const oldStatus = shipment.status;
    const { expressCompany, trackingNo, shipmentDate } = req.body;

    await shipment.update({
      expressCompany,
      trackingNo,
      shipmentDate: shipmentDate || new Date(),
      status: 'shipped'
    });

    await createActivityLog(
      'shipment',
      shipment.id,
      'ship',
      oldStatus,
      'shipped',
      `已发货，${expressCompany} ${trackingNo}`,
      req.user.id
    );

    res.json(shipment);
  } catch (error) {
    console.error('Ship shipment error:', error);
    res.status(500).json({ error: '发货操作失败' });
  }
});

router.put('/:id/confirm', requireRole([ROLES.CHANNEL_MANAGER]), async (req, res) => {
  try {
    const shipment = await SampleShipment.findByPk(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: '寄送记录不存在' });
    }

    const oldStatus = shipment.status;

    await shipment.update({
      status: 'confirmed',
      confirmedBy: req.user.id,
      confirmedAt: new Date()
    });

    await createActivityLog(
      'shipment',
      shipment.id,
      'confirm',
      oldStatus,
      'confirmed',
      '渠道经理确认回执',
      req.user.id
    );

    res.json(shipment);
  } catch (error) {
    console.error('Confirm shipment error:', error);
    res.status(500).json({ error: '确认回执失败' });
  }
});

router.put('/:id/mark-lost', requireRole([ROLES.DISTRIBUTION_SPECIALIST]), async (req, res) => {
  try {
    const shipment = await SampleShipment.findByPk(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: '寄送记录不存在' });
    }

    const oldStatus = shipment.status;

    await shipment.update({
      status: 'receipt_lost'
    });

    await createActivityLog(
      'shipment',
      shipment.id,
      'mark_lost',
      oldStatus,
      'receipt_lost',
      '标记回执丢失，需跟进处理',
      req.user.id
    );

    res.json(shipment);
  } catch (error) {
    console.error('Mark lost error:', error);
    res.status(500).json({ error: '标记丢失失败' });
  }
});

router.get('/:id/timeline', async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      where: { entityType: 'shipment', entityId: req.params.id },
      include: [{ model: User, as: 'operator', attributes: ['id', 'name', 'role'] }],
      order: [['timestamp', 'ASC']]
    });

    res.json(logs);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: '获取时间线失败' });
  }
});

module.exports = router;
