const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/student/:studentId', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  const visa = store.getVisaByStudent(req.params.studentId);
  res.json({ visa });
});

router.put('/student/:studentId/status', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  if (req.user.role !== 'visa_assistant' && req.user.role !== 'consultant_manager') {
    return res.status(403).json({ error: '只有签证助理和顾问主管可以更新签证状态' });
  }
  const { status, ...updates } = req.body;
  const visa = store.updateVisaStatus(req.params.studentId, status, updates);
  if (!visa) {
    return res.status(404).json({ error: '签证记录不存在' });
  }
  const user = store.findUserById(req.user.id);
  store.addActivityLog(req.params.studentId, `签证状态变更为: ${status}`, req.user.id, user?.name || '系统', { status });
  res.json({ visa });
});

router.post('/student/:studentId/notes', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  if (req.user.role !== 'visa_assistant' && req.user.role !== 'consultant_manager') {
    return res.status(403).json({ error: '只有签证助理和顾问主管可以添加签证记录' });
  }
  const { content, type } = req.body;
  const note = store.addVisaNote(req.params.studentId, content, req.user.id, type);
  if (!note) {
    return res.status(404).json({ error: '签证记录不存在' });
  }
  res.json({ note });
});

module.exports = router;
