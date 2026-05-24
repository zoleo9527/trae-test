const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const deadlines = store.getDeadlinesByRole(req.user.id, req.user.role);
  const { start, end, type } = req.query;
  
  let filtered = deadlines;
  
  if (start) {
    filtered = filtered.filter(d => d.date >= start);
  }
  if (end) {
    filtered = filtered.filter(d => d.date <= end);
  }
  if (type && type !== 'all') {
    filtered = filtered.filter(d => d.type === type);
  }
  
  res.json({ deadlines: filtered });
});

router.get('/student/:studentId', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  const deadlines = store.getDeadlinesByStudent(req.params.studentId);
  res.json({ deadlines });
});

router.put('/:id', (req, res) => {
  const deadline = store.deadlines.find(d => d.id === req.params.id);
  if (!deadline) {
    return res.status(404).json({ error: '截点不存在' });
  }
  if (!store.canAccessStudent(deadline.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权操作此截点' });
  }
  if (req.user.role !== 'consultant_manager') {
    return res.status(403).json({ error: '只有顾问主管可以更新截点' });
  }
  const updated = store.updateDeadline(req.params.id, req.body);
  res.json({ deadline: updated });
});

module.exports = router;
