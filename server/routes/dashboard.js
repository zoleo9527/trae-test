const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { gridDocs, paymentNodes, workOrders, powerData, spareParts } = require('../data/database');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const pendingDocs = gridDocs.filter(d => d.status === 'pending').length;
  const rejectedDocs = gridDocs.filter(d => d.status === 'rejected').length;
  const supplementDocs = gridDocs.filter(d => d.status === 'supplement').length;

  const completedPayments = paymentNodes.filter(n => n.status === 'completed').length;
  const processingPayments = paymentNodes.filter(n => n.status === 'processing').length;
  const totalPaymentAmount = paymentNodes.reduce((sum, n) => sum + n.amount, 0);
  const paidAmount = paymentNodes.reduce((sum, n) => sum + n.paidAmount, 0);

  const pendingWorkOrders = workOrders.filter(w => w.status === 'pending').length;
  const inProgressWorkOrders = workOrders.filter(w => w.status === 'in_progress').length;
  const todayDowntime = workOrders
    .filter(w => w.status === 'in_progress')
    .reduce((sum, w) => sum + (w.downtimeMinutes || 0), 0);
  const todayPowerLoss = workOrders
    .filter(w => w.status === 'in_progress')
    .reduce((sum, w) => sum + (w.powerLoss || 0), 0);

  const lowStockParts = spareParts.filter(p => p.stock <= p.minStock).length;

  res.json({
    gridDocs: {
      total: gridDocs.length,
      pending: pendingDocs,
      rejected: rejectedDocs,
      supplement: supplementDocs,
    },
    payment: {
      totalNodes: paymentNodes.length,
      completed: completedPayments,
      processing: processingPayments,
      totalAmount: totalPaymentAmount,
      paidAmount: paidAmount,
      paymentRate: totalPaymentAmount > 0 ? Math.round((paidAmount / totalPaymentAmount) * 10000) / 100 : 0,
    },
    workOrders: {
      total: workOrders.length,
      pending: pendingWorkOrders,
      inProgress: inProgressWorkOrders,
      todayDowntime,
      todayPowerLoss,
    },
    power: powerData.today,
    spareParts: {
      total: spareParts.length,
      lowStock: lowStockParts,
    },
  });
});

router.get('/activities', authenticateToken, (req, res) => {
  const activities = [];

  workOrders.slice(0, 5).forEach(wo => {
    activities.push({
      type: 'workorder',
      title: wo.title,
      content: `${wo.statusName} - ${wo.assignee || '待分配'}`,
      time: wo.createTime,
      priority: wo.priority,
    });
  });

  gridDocs.slice(0, 3).forEach(doc => {
    activities.push({
      type: 'griddoc',
      title: doc.title,
      content: `${doc.statusName} - ${doc.submitter}`,
      time: doc.submitTime,
    });
  });

  paymentNodes.filter(n => n.status === 'processing').forEach(node => {
    activities.push({
      type: 'payment',
      title: node.name,
      content: node.currentStep || node.statusName,
      time: node.planDate,
    });
  });

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));

  res.json(activities.slice(0, 10));
});

module.exports = router;
