const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/student/:studentId', (req, res) => {
  const documents = store.getDocumentsByStudent(req.params.studentId);
  res.json({ documents });
});

router.get('/:id', (req, res) => {
  const document = store.getDocumentById(req.params.id);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }
  res.json({ document });
});

router.put('/:id/status', (req, res) => {
  const { status, feedback } = req.body;
  const document = store.updateDocumentStatus(req.params.id, status, feedback, req.user.id);
  if (!document) {
    return res.status(404).json({ error: '文档不存在' });
  }
  res.json({ document });
});

router.post('/:id/versions', (req, res) => {
  const version = store.addDocumentVersion(req.params.id, req.body, req.user.id);
  if (!version) {
    return res.status(404).json({ error: '文档不存在' });
  }
  res.json({ version });
});

module.exports = router;
