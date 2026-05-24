const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  let issues = store.getIssuesByRole(req.user.id, req.user.role);
  const { status, category, priority } = req.query;
  
  if (status && status !== 'all') {
    issues = issues.filter(i => i.status === status);
  }
  if (category && category !== 'all') {
    issues = issues.filter(i => i.category === category);
  }
  if (priority && priority !== 'all') {
    issues = issues.filter(i => i.priority === priority);
  }
  
  res.json({ issues });
});

router.get('/:id', (req, res) => {
  const issue = store.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }
  res.json({ issue });
});

router.put('/:id', (req, res) => {
  const issue = store.updateIssue(req.params.id, req.body, req.user.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }
  res.json({ issue });
});

module.exports = router;
