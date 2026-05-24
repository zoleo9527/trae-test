const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/student/:studentId', (req, res) => {
  const visa = store.getVisaByStudent(req.params.studentId);
  res.json({ visa });
});

router.put('/student/:studentId/status', (req, res) => {
  const { status, ...updates } = req.body;
  const visa = store.updateVisaStatus(req.params.studentId, status, updates);
  if (!visa) {
    return res.status(404).json({ error: '签证记录不存在' });
  }
  res.json({ visa });
});

router.post('/student/:studentId/notes', (req, res) => {
  const { content, type } = req.body;
  const note = store.addVisaNote(req.params.studentId, content, req.user.id, type);
  if (!note) {
    return res.status(404).json({ error: '签证记录不存在' });
  }
  res.json({ note });
});

module.exports = router;
