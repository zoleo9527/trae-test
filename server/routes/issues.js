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
  if (!store.canAccessStudent(issue.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此问题' });
  }
  res.json({ issue });
});

router.put('/:id', (req, res) => {
  const issue = store.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }
  if (!store.canAccessStudent(issue.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权操作此问题' });
  }
  const { comment, ...updates } = req.body;
  const updated = store.updateIssue(req.params.id, updates, req.user.id, comment);
  res.json({ issue: updated });
});

router.post('/:id/comments', (req, res) => {
  const issue = store.getIssueById(req.params.id);
  if (!issue) {
    return res.status(404).json({ error: '问题不存在' });
  }
  if (!store.canAccessStudent(issue.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权操作此问题' });
  }
  if (!req.body.comment || !req.body.comment.trim()) {
    return res.status(400).json({ error: '备注内容不能为空' });
  }
  const historyItem = store.addIssueComment(req.params.id, req.body.comment, req.user.id);
  res.json({ historyItem });
});

module.exports = router;
