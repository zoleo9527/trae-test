const express = require('express');
const { authenticateToken, requireRole, roles } = require('../middleware/auth');
const { gridDocs } = require('../data/database');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, type, keyword } = req.query;
  let filtered = [...gridDocs];

  if (status) {
    filtered = filtered.filter(doc => doc.status === status);
  }
  if (type) {
    filtered = filtered.filter(doc => doc.type === type);
  }
  if (keyword) {
    filtered = filtered.filter(doc => 
      doc.title.includes(keyword) || doc.submitter.includes(keyword)
    );
  }

  res.json(filtered);
});

router.get('/:id', authenticateToken, (req, res) => {
  const doc = gridDocs.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '资料不存在' });
  }
  res.json(doc);
});

router.post('/', authenticateToken, requireRole([roles.STATION_MANAGER, roles.ADMIN_STAFF]), (req, res) => {
  const newDoc = {
    id: `GD${String(gridDocs.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: 'pending',
    statusName: '待审核',
    submitTime: new Date().toISOString(),
    remarks: [],
  };
  gridDocs.unshift(newDoc);
  res.status(201).json(newDoc);
});

router.put('/:id/approve', authenticateToken, requireRole([roles.STATION_MANAGER]), (req, res) => {
  const index = gridDocs.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '资料不存在' });
  }
  gridDocs[index].status = 'approved';
  gridDocs[index].statusName = '已通过';
  gridDocs[index].reviewer = req.user.name;
  gridDocs[index].reviewerId = req.user.id;
  gridDocs[index].reviewTime = new Date().toISOString();
  
  if (req.body.remark) {
    gridDocs[index].remarks.push({
      id: gridDocs[index].remarks.length + 1,
      content: req.body.remark,
      author: req.user.name,
      time: new Date().toISOString(),
      type: 'review',
    });
  }
  
  res.json(gridDocs[index]);
});

router.put('/:id/reject', authenticateToken, requireRole([roles.STATION_MANAGER]), (req, res) => {
  const index = gridDocs.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '资料不存在' });
  }
  gridDocs[index].status = 'rejected';
  gridDocs[index].statusName = '已驳回';
  gridDocs[index].rejectReason = req.body.reason;
  gridDocs[index].reviewer = req.user.name;
  gridDocs[index].reviewerId = req.user.id;
  gridDocs[index].reviewTime = new Date().toISOString();
  
  gridDocs[index].remarks.push({
    id: gridDocs[index].remarks.length + 1,
    content: req.body.reason,
    author: req.user.name,
    time: new Date().toISOString(),
    type: 'reject',
  });
  
  res.json(gridDocs[index]);
});

router.put('/:id/supplement', authenticateToken, requireRole([roles.STATION_MANAGER]), (req, res) => {
  const index = gridDocs.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '资料不存在' });
  }
  gridDocs[index].status = 'supplement';
  gridDocs[index].statusName = '待补录';
  gridDocs[index].supplementNote = req.body.note;
  gridDocs[index].reviewer = req.user.name;
  gridDocs[index].reviewerId = req.user.id;
  gridDocs[index].reviewTime = new Date().toISOString();
  
  gridDocs[index].remarks.push({
    id: gridDocs[index].remarks.length + 1,
    content: req.body.note,
    author: req.user.name,
    time: new Date().toISOString(),
    type: 'supplement',
  });
  
  res.json(gridDocs[index]);
});

router.post('/:id/remarks', authenticateToken, (req, res) => {
  const index = gridDocs.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '资料不存在' });
  }
  
  const newRemark = {
    id: gridDocs[index].remarks.length + 1,
    content: req.body.content,
    author: req.user.name,
    time: new Date().toISOString(),
    type: 'comment',
  };
  
  gridDocs[index].remarks.push(newRemark);
  res.json(newRemark);
});

module.exports = router;
