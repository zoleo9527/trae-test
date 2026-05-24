const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/student/:studentId', (req, res) => {
  if (!store.canAccessStudent(req.params.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  const documents = store.getDocumentsByStudent(req.params.studentId);
  res.json({ documents });
});

router.get('/:id', (req, res) => {
  const document = store.getDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }
  if (!store.canAccessStudent(document.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此文档' });
  }
  res.json({ document });
});

router.put('/:id/status', (req, res) => {
  const document = store.getDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }
  if (!store.canAccessStudent(document.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权操作此文档' });
  }
  if (['approved', 'rejected'].includes(req.body.status) && req.user.role !== 'consultant_manager') {
    return res.status(403).json({ error: '只有顾问主管可以审核文档' });
  }
  const { status, feedback } = req.body;
  const updated = store.updateDocumentStatus(req.params.id, status, feedback, req.user.id);
  res.json({ document: updated });
});

router.post('/:id/versions', (req, res) => {
  const document = store.getDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }
  if (!store.canAccessStudent(document.studentId, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权操作此文档' });
  }
  const version = store.addDocumentVersion(req.params.id, req.body, req.user.id);
  res.json({ version });
});

module.exports = router;
