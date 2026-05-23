const express = require('express');
const { authenticateToken, requireRole, roles } = require('../middleware/auth');
const { workOrders, users } = require('../data/database');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, type, priority, assigneeId, keyword } = req.query;
  let filtered = [...workOrders];

  if (status) {
    const statuses = status.split(',');
    filtered = filtered.filter(wo => statuses.includes(wo.status));
  }
  if (type) {
    filtered = filtered.filter(wo => wo.type === type);
  }
  if (priority) {
    filtered = filtered.filter(wo => wo.priority === priority);
  }
  if (assigneeId) {
    filtered = filtered.filter(wo => wo.assigneeId == assigneeId);
  }
  if (keyword) {
    filtered = filtered.filter(wo => 
      wo.title.includes(keyword) || wo.location.includes(keyword)
    );
  }

  res.json(filtered);
});

router.get('/stats/summary', authenticateToken, (req, res) => {
  const pending = workOrders.filter(w => w.status === 'pending').length;
  const inProgress = workOrders.filter(w => w.status === 'in_progress').length;
  const completed = workOrders.filter(w => w.status === 'completed' || w.status === 'closed').length;
  const totalDowntime = workOrders.reduce((sum, w) => sum + (w.downtimeMinutes || 0), 0);
  const totalPowerLoss = workOrders.reduce((sum, w) => sum + (w.powerLoss || 0), 0);

  res.json({
    total: workOrders.length,
    pending,
    inProgress,
    completed,
    totalDowntime,
    totalPowerLoss,
  });
});

router.post('/', authenticateToken, (req, res) => {
  const newWo = {
    id: `WO${String(workOrders.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending',
    statusName: '待分配',
    creator: req.user.name,
    creatorId: req.user.id,
    createTime: new Date().toISOString(),
    remarks: [],
    evidences: [],
    spareParts: [],
    history: [
      {
        status: 'pending',
        statusName: '待分配',
        time: new Date().toISOString(),
        operator: req.user.name,
      },
    ],
  };
  workOrders.unshift(newWo);
  res.status(201).json(newWo);
});

router.put('/:id/assign', authenticateToken, requireRole([roles.STATION_MANAGER]), (req, res) => {
  const index = workOrders.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const assignee = users.find(u => u.id == req.body.assigneeId);
  if (!assignee) {
    return res.status(400).json({ error: '处理人不存在' });
  }

  workOrders[index].status = 'in_progress';
  workOrders[index].statusName = '处理中';
  workOrders[index].assignee = assignee.name;
  workOrders[index].assigneeId = assignee.id;
  workOrders[index].assignTime = new Date().toISOString();

  workOrders[index].history.push({
    status: 'in_progress',
    statusName: '处理中',
    time: new Date().toISOString(),
    operator: req.user.name,
  });

  res.json(workOrders[index]);
});

router.put('/:id/status', authenticateToken, (req, res) => {
  const index = workOrders.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const { status, statusName } = req.body;
  
  if (status === 'completed' && req.user.role !== roles.ENGINEER) {
    return res.status(403).json({ error: '只有工程师可以标记工单完成' });
  }

  if (status === 'closed' && req.user.role !== roles.STATION_MANAGER) {
    return res.status(403).json({ error: '只有站长可以关闭工单' });
  }

  workOrders[index].status = status;
  workOrders[index].statusName = statusName;

  if (status === 'completed') {
    workOrders[index].completeTime = new Date().toISOString();
  }
  if (status === 'closed') {
    workOrders[index].closeNote = req.body.closeNote;
  }

  workOrders[index].history.push({
    status,
    statusName,
    time: new Date().toISOString(),
    operator: req.user.name,
  });

  res.json(workOrders[index]);
});

router.post('/:id/remarks', authenticateToken, (req, res) => {
  const index = workOrders.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const newRemark = {
    id: workOrders[index].remarks.length + 1,
    content: req.body.content,
    author: req.user.name,
    time: new Date().toISOString(),
  };

  workOrders[index].remarks.push(newRemark);
  res.json(newRemark);
});

router.post('/:id/evidences', authenticateToken, (req, res) => {
  const index = workOrders.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const newEvidence = {
    name: req.body.name,
    uploadTime: new Date().toISOString(),
    uploader: req.user.name,
  };

  workOrders[index].evidences.push(newEvidence);
  res.json(newEvidence);
});

router.post('/:id/spare-parts', authenticateToken, (req, res) => {
  const index = workOrders.findIndex(w => w.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const newPart = {
    ...req.body,
    status: 'requested',
    requestTime: new Date().toISOString(),
  };

  workOrders[index].spareParts.push(newPart);
  res.json(newPart);
});

router.get('/:id', authenticateToken, (req, res) => {
  const wo = workOrders.find(w => w.id === req.params.id);
  if (!wo) {
    return res.status(404).json({ error: '工单不存在' });
  }
  res.json(wo);
});

module.exports = router;
