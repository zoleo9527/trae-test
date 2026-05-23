const express = require('express');
const { authenticateToken, requireRole, roles } = require('../middleware/auth');
const { paymentNodes } = require('../data/database');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status } = req.query;
  let filtered = [...paymentNodes];

  if (status) {
    filtered = filtered.filter(node => node.status === status);
  }

  res.json(filtered);
});

router.get('/summary', authenticateToken, (req, res) => {
  const total = paymentNodes.reduce((sum, n) => sum + n.amount, 0);
  const paid = paymentNodes.reduce((sum, n) => sum + n.paidAmount, 0);
  const completed = paymentNodes.filter(n => n.status === 'completed').length;

  res.json({
    totalAmount: total,
    paidAmount: paid,
    pendingAmount: total - paid,
    paymentRate: total > 0 ? Math.round((paid / total) * 10000) / 100 : 0,
    totalNodes: paymentNodes.length,
    completedNodes: completed,
    progressRate: Math.round((completed / paymentNodes.length) * 10000) / 100,
  });
});

router.post('/:id/process', authenticateToken, requireRole([roles.STATION_MANAGER, roles.ADMIN_STAFF]), (req, res) => {
  const index = paymentNodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  
  paymentNodes[index].status = 'processing';
  paymentNodes[index].statusName = '办理中';
  paymentNodes[index].currentStep = req.body.currentStep || '启动办理';
  
  res.json(paymentNodes[index]);
});

router.post('/:id/complete', authenticateToken, requireRole([roles.STATION_MANAGER, roles.ADMIN_STAFF]), (req, res) => {
  const index = paymentNodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  
  paymentNodes[index].status = 'completed';
  paymentNodes[index].statusName = '已完成';
  paymentNodes[index].actualDate = new Date().toISOString().split('T')[0];
  paymentNodes[index].paidAmount = paymentNodes[index].amount;
  paymentNodes[index].invoiceNo = req.body.invoiceNo;
  
  if (req.body.remark) {
    paymentNodes[index].remarks.push({
      id: paymentNodes[index].remarks.length + 1,
      content: req.body.remark,
      author: req.user.name,
      time: new Date().toISOString(),
    });
  }
  
  res.json(paymentNodes[index]);
});

router.post('/:id/remarks', authenticateToken, (req, res) => {
  const index = paymentNodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  
  const newRemark = {
    id: paymentNodes[index].remarks.length + 1,
    content: req.body.content,
    author: req.user.name,
    time: new Date().toISOString(),
  };
  
  paymentNodes[index].remarks.push(newRemark);
  res.json(newRemark);
});

router.post('/:id/evidences', authenticateToken, (req, res) => {
  const index = paymentNodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  
  if (!paymentNodes[index].evidences) {
    paymentNodes[index].evidences = [];
  }
  
  const newEvidence = {
    name: req.body.name,
    uploadTime: new Date().toISOString(),
    uploader: req.user.name,
  };
  
  paymentNodes[index].evidences.push(newEvidence);
  res.json(newEvidence);
});

router.get('/:id', authenticateToken, (req, res) => {
  const node = paymentNodes.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  res.json(node);
});

module.exports = router;
