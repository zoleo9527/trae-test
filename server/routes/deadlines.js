const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const deadlines = store.getAllDeadlines();
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
  const deadlines = store.getDeadlinesByStudent(req.params.studentId);
  res.json({ deadlines });
});

router.put('/:id', (req, res) => {
  const deadline = store.updateDeadline(req.params.id, req.body);
  if (!deadline) {
    return res.status(404).json({ error: '截点不存在' });
  }
  res.json({ deadline });
});

module.exports = router;
