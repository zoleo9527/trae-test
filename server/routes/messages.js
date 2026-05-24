const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/student/:studentId', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  const messages = store.getMessagesByStudent(req.params.studentId);
  res.json({ messages });
});

router.post('/student/:studentId', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  const { content, relatedEntity } = req.body;
  const message = store.addMessage(req.params.studentId, req.user.id, content, relatedEntity);
  res.json({ message });
});

module.exports = router;
