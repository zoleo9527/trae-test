const express = require('express');
const { Op } = require('sequelize');
const { Feedback, SampleShipment, Book, Channel, User, ActivityLog } = require('../models');
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
    const { status, shipmentId, page = 1, pageSize = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (shipmentId) where.shipmentId = shipmentId;

    const { count, rows } = await Feedback.findAndCountAll({
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
        { model: User, as: 'reviewer', attributes: ['id', 'name'] }
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
    console.error('Get feedbacks error:', error);
    res.status(500).json({ error: '获取反馈列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id, {
      include: [
        {
          model: SampleShipment,
          include: [Book, Channel]
        },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'reviewer', attributes: ['id', 'name'] }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ error: '反馈记录不存在' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback detail error:', error);
    res.status(500).json({ error: '获取反馈详情失败' });
  }
});

router.post('/', requireRole([ROLES.CHANNEL_MANAGER]), async (req, res) => {
  try {
    const { shipmentId, feedbackDate, receivedQuantity, damagedQuantity, channelFeedback, salesExpectation, displayLocation, marketingSupport, followUpDate } = req.body;

    const shipment = await SampleShipment.findByPk(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: '寄送记录不存在' });
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Feedback.count({
      where: { feedbackNo: { [Op.like]: `FB${dateStr}%` } }
    });
    const feedbackNo = `FB${dateStr}${String(count + 1).padStart(3, '0')}`;

    const feedback = await Feedback.create({
      feedbackNo,
      shipmentId,
      feedbackDate: feedbackDate || new Date(),
      receivedQuantity,
      damagedQuantity,
      channelFeedback,
      salesExpectation,
      displayLocation,
      marketingSupport,
      followUpDate,
      status: 'draft',
      createdBy: req.user.id
    });

    await createActivityLog('feedback', feedback.id, 'create', null, 'draft', '创建渠道反馈单', req.user.id);

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: '创建反馈失败' });
  }
});

router.put('/:id/submit', requireRole([ROLES.CHANNEL_MANAGER]), async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈记录不存在' });
    }

    const oldStatus = feedback.status;

    await feedback.update({
      status: 'submitted'
    });

    await createActivityLog('feedback', feedback.id, 'submit', oldStatus, 'submitted', '提交渠道反馈', req.user.id);

    res.json(feedback);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: '提交反馈失败' });
  }
});

router.put('/:id/review', requireRole([ROLES.DISTRIBUTION_SPECIALIST]), async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈记录不存在' });
    }

    const oldStatus = feedback.status;
    const { reviewNotes } = req.body;

    await feedback.update({
      status: 'reviewed',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      reviewNotes
    });

    await createActivityLog('feedback', feedback.id, 'review', oldStatus, 'reviewed', '已审核渠道反馈', req.user.id);

    res.json(feedback);
  } catch (error) {
    console.error('Review feedback error:', error);
    res.status(500).json({ error: '审核反馈失败' });
  }
});

router.put('/:id/escalate', requireRole([ROLES.DISTRIBUTION_SPECIALIST]), async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);
    if (!feedback) {
      return res.status(404).json({ error: '反馈记录不存在' });
    }

    const oldStatus = feedback.status;

    await feedback.update({
      status: 'escalated',
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });

    await createActivityLog('feedback', feedback.id, 'escalate', oldStatus, 'escalated', '反馈已升级处理', req.user.id);

    res.json(feedback);
  } catch (error) {
    console.error('Escalate feedback error:', error);
    res.status(500).json({ error: '升级反馈失败' });
  }
});

module.exports = router;
