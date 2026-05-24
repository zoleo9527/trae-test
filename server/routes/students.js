const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  const students = store.getStudentsByRole(req.user.id, req.user.role);
  const { status, search } = req.query;
  
  let filtered = students;
  
  if (status && status !== 'all') {
    filtered = filtered.filter(s => s.status === status);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.targetSchool.toLowerCase().includes(searchLower)
    );
  }
  
  res.json({ students: filtered });
});

router.get('/:id', (req, res) => {
  if (!store.canAccessStudent(req.params.id, req.user.id, req.user.role)) {
    return res.status(403).json({ error: '无权访问此学生数据' });
  }
  
  const student = store.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: '学生不存在' });
  }
  
  const documents = store.getDocumentsByStudent(req.params.id);
  const deadlines = store.getDeadlinesByStudent(req.params.id);
  const visa = store.getVisaByStudent(req.params.id);
  const messages = store.getMessagesByStudent(req.params.id);
  const activityLogs = store.getActivityLogsByStudent(req.params.id);
  
  res.json({
    student,
    documents,
    deadlines,
    visa,
    messages,
    activityLogs
  });
});

router.put('/:id', (req, res) => {
  const student = store.updateStudent(req.params.id, req.body);
  if (!student) {
    return res.status(404).json({ error: '学生不存在' });
  }
  res.json({ student });
});

module.exports = router;
