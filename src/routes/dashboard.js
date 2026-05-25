const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { SampleShipment, Feedback, Return, Reconciliation, Book, Channel, ActivityLog, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateWhere = {};
    if (startDate && endDate) {
      dateWhere.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const shipmentStats = await SampleShipment.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('totalAmount')), 'totalAmount']
      ],
      where: dateWhere
    });

    const statusBreakdown = await SampleShipment.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      where: dateWhere,
      group: ['status']
    });

    const feedbackStats = await Feedback.findOne({
      attributes: [[fn('COUNT', col('id')), 'total']],
      where: dateWhere
    });

    const returnStats = await Return.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'total'],
        [fn('SUM', col('approvedQuantity')), 'totalQuantity']
      ],
      where: { ...dateWhere, status: { [Op.ne]: 'rejected' } }
    });

    const receiptLostCount = await SampleShipment.count({
      where: { ...dateWhere, status: 'receipt_lost' }
    });

    const pendingApprovals = {
      returns: await Return.count({ where: { status: 'pending' } }),
      feedbacks: await Feedback.count({ where: { status: 'submitted' } }),
      reconciliations: await Reconciliation.count({ where: { status: 'pending_approval' } })
    };

    res.json({
      shipments: {
        total: shipmentStats.get('total') || 0,
        totalQuantity: shipmentStats.get('totalQuantity') || 0,
        totalAmount: shipmentStats.get('totalAmount') || 0,
        statusBreakdown
      },
      feedbacks: { total: feedbackStats.get('total') || 0 },
      returns: {
        total: returnStats.get('total') || 0,
        totalQuantity: returnStats.get('totalQuantity') || 0
      },
      issues: {
        receiptLost: receiptLostCount
      },
      pendingApprovals
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/channel-stats', async (req, res) => {
  try {
    const { period } = req.query;

    let dateWhere = {};
    if (period) {
      const [year, month] = period.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateWhere = { shipmentDate: { [Op.between]: [startDate, endDate] } };
    }

    const results = await SampleShipment.findAll({
      attributes: [
        'channelId',
        [fn('COUNT', col('SampleShipment.id')), 'shipmentCount'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('totalAmount')), 'totalAmount']
      ],
      include: [{ model: Channel, attributes: ['id', 'name', 'type'] }],
      where: dateWhere,
      group: ['channelId', 'Channel.id'],
      order: [[fn('SUM', col('totalAmount')), 'DESC']]
    });

    const channelStats = results.map(item => ({
      channelId: item.channelId,
      shipmentCount: item.dataValues.shipmentCount,
      totalQuantity: item.dataValues.totalQuantity,
      totalAmount: item.dataValues.totalAmount,
      Channel: item.Channel
    }));

    res.json(channelStats);
  } catch (error) {
    console.error('Get channel stats error:', error);
    res.status(500).json({ error: '获取渠道统计失败' });
  }
});

router.get('/book-stats', async (req, res) => {
  try {
    const results = await SampleShipment.findAll({
      attributes: [
        'bookId',
        [fn('COUNT', col('SampleShipment.id')), 'shipmentCount'],
        [fn('SUM', col('quantity')), 'totalQuantity'],
        [fn('SUM', col('totalAmount')), 'totalAmount']
      ],
      include: [{ model: Book, attributes: ['id', 'title', 'category'] }],
      group: ['bookId', 'Book.id'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: 10
    });

    const bookStats = results.map(item => ({
      bookId: item.bookId,
      shipmentCount: item.dataValues.shipmentCount,
      totalQuantity: item.dataValues.totalQuantity,
      totalAmount: item.dataValues.totalAmount,
      Book: item.Book
    }));

    res.json(bookStats);
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({ error: '获取图书统计失败' });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const logs = await ActivityLog.findAll({
      include: [
        { model: User, as: 'operator', attributes: ['id', 'name', 'role'] }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: '获取时间线失败' });
  }
});

router.get('/issues', async (req, res) => {
  try {
    const receiptLost = await SampleShipment.findAll({
      where: { status: 'receipt_lost' },
      include: [Book, Channel],
      order: [['updatedAt', 'DESC']]
    });

    const caliberDisputes = await Return.findAll({
      where: { caliberType: { [Op.ne]: 'original' } },
      include: [
        { model: SampleShipment, include: [Book, Channel] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    const pendingReturns = await Return.findAll({
      where: { status: 'pending' },
      include: [
        { model: SampleShipment, include: [Book, Channel] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json({
      receiptLost,
      caliberDisputes,
      pendingReturns
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: '获取问题列表失败' });
  }
});

router.get('/drill-down/:entityType/:id', async (req, res) => {
  try {
    const { entityType, id } = req.params;

    let data = null;
    let relatedData = {};

    switch (entityType) {
      case 'shipment':
        data = await SampleShipment.findByPk(id, {
          include: [Book, Channel, Feedback, Return]
        });
        relatedData.logs = await ActivityLog.findAll({
          where: { entityType: 'shipment', entityId: id },
          include: [{ model: User, as: 'operator', attributes: ['name', 'role'] }],
          order: [['timestamp', 'ASC']]
        });
        break;
      case 'return':
        data = await Return.findByPk(id, {
          include: [
            { model: SampleShipment, include: [Book, Channel] }
          ]
        });
        break;
    }

    if (!data) {
      return res.status(404).json({ error: '记录不存在' });
    }

    res.json({ data, relatedData });
  } catch (error) {
    console.error('Drill down error:', error);
    res.status(500).json({ error: '下钻查询失败' });
  }
});

module.exports = router;
