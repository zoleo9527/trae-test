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
  
  if (!paymentNodes[index].remarks) {
    paymentNodes[index].remarks = [];
  }
  paymentNodes[index].remarks.unshift({
    id: `remark-${Date.now()}`,
    author: req.user.name,
    content: '【系统】启动了办理流程',
    time: new Date().toISOString(),
    isSystem: true,
  });
  
  res.json(paymentNodes[index]);
});

router.put('/:id/progress', authenticateToken, requireRole([roles.STATION_MANAGER, roles.ADMIN_STAFF]), (req, res) => {
  const index = paymentNodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  
  if (paymentNodes[index].status !== 'processing') {
    return res.status(400).json({ error: '只能更新办理中节点的进度' });
  }
  
  const { currentStep, nextStep } = req.body;
  const changes = [];
  
  if (currentStep && paymentNodes[index].currentStep !== currentStep) {
    paymentNodes[index].currentStep = currentStep;
    changes.push(`当前步骤更新为「${currentStep}」`);
  }
  if (nextStep !== undefined && paymentNodes[index].nextStep !== nextStep) {
    paymentNodes[index].nextStep = nextStep;
    changes.push(nextStep ? `下一步更新为「${nextStep}」` : '清除了下一步说明');
  }
  
  if (changes.length > 0) {
    if (!paymentNodes[index].remarks) {
      paymentNodes[index].remarks = [];
    }
    paymentNodes[index].remarks.unshift({
      id: `remark-${Date.now()}`,
      author: req.user.name,
      content: `【系统】${changes.join('，')}`,
      time: new Date().toISOString(),
      isSystem: true,
    });
  }
  
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
  
  if (!paymentNodes[index].remarks) {
    paymentNodes[index].remarks = [];
  }
  
  paymentNodes[index].remarks.unshift({
    id: `remark-${Date.now()}`,
    author: req.user.name,
    content: `【系统】标记节点为已完成，发票号：${req.body.invoiceNo}`,
    time: new Date().toISOString(),
    isSystem: true,
  });
  
  if (req.body.remark) {
    paymentNodes[index].remarks.unshift({
      id: `remark-${Date.now() + 1}`,
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

router.post('/:id/evidences', authenticateToken, requireRole([roles.STATION_MANAGER, roles.ADMIN_STAFF]), (req, res) => {
  const index = paymentNodes.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  
  if (paymentNodes[index].status === 'completed') {
    return res.status(400).json({ error: '已完成节点不能补充凭证' });
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
  
  if (!paymentNodes[index].remarks) {
    paymentNodes[index].remarks = [];
  }
  paymentNodes[index].remarks.unshift({
    id: `remark-${Date.now()}`,
    author: req.user.name,
    content: `【系统】补充了凭证材料「${req.body.name}」`,
    time: new Date().toISOString(),
    isSystem: true,
  });
  
  res.json(paymentNodes[index]);
});

router.get('/:id', authenticateToken, (req, res) => {
  const node = paymentNodes.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ error: '回款节点不存在' });
  }
  res.json(node);
});

module.exports = router;
