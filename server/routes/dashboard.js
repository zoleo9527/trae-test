const express = require('express');
const store = require('../data');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', (req, res) => {
  const { id: userId, role } = req.user;
  
  const students = store.getStudentsByRole(userId, role);
  const studentIds = students.map(s => s.id);
  const documents = store.getDocumentsByRole(userId, role);
  const deadlines = store.getDeadlinesByRole(userId, role);
  const issues = store.getIssuesByRole(userId, role);
  
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingDeadlines = deadlines.filter(d => 
    !d.isCompleted && new Date(d.date) <= sevenDaysLater
  );
  
  const overdueCount = deadlines.filter(d => 
    !d.isCompleted && new Date(d.date) < now
  ).length;
  
  const pendingDocs = documents.filter(d => 
    ['pending', 'in_progress', 'review', 'overdue'].includes(d.status)
  ).length;
  
  const openIssues = issues.filter(i => 
    ['open', 'in_progress'].includes(i.status)
  ).length;
  
  const stats = {
    students: students.length,
    pendingDocs,
    upcomingDeadlines: upcomingDeadlines.length,
    openIssues,
    overdueCount
  };
  
  let roleSpecificData = {};
  
  if (role === 'consultant_manager') {
    roleSpecificData = {
      studentByStatus: {
        consulting: students.filter(s => s.status === 'consulting').length,
        contract_signed: students.filter(s => s.status === 'contract_signed').length,
        document_prep: students.filter(s => s.status === 'document_prep').length,
        application_submitted: students.filter(s => s.status === 'application_submitted').length,
        visa_processing: students.filter(s => s.status === 'visa_processing').length,
        completed: students.filter(s => s.status === 'completed').length,
      },
      issuesByPriority: {
        critical: issues.filter(i => i.priority === 'critical').length,
        high: issues.filter(i => i.priority === 'high').length,
        medium: issues.filter(i => i.priority === 'medium').length,
        low: issues.filter(i => i.priority === 'low').length,
      }
    };
  } else if (role === 'copywriter') {
    roleSpecificData = {
      docsByStatus: {
        pending: documents.filter(d => d.status === 'pending').length,
        in_progress: documents.filter(d => d.status === 'in_progress').length,
        review: documents.filter(d => d.status === 'review').length,
        approved: documents.filter(d => d.status === 'approved').length,
        overdue: documents.filter(d => d.status === 'overdue').length,
      },
      myStudents: students.length
    };
  } else if (role === 'visa_assistant') {
    const visaRecords = store.visaRecords.filter(v => 
      studentIds.includes(v.studentId)
    );
    roleSpecificData = {
      visaByStatus: {
        not_started: visaRecords.filter(v => v.status === 'not_started').length,
        documents_preparing: visaRecords.filter(v => v.status === 'documents_preparing').length,
        submitted: visaRecords.filter(v => v.status === 'submitted').length,
        interview_scheduled: visaRecords.filter(v => v.status === 'interview_scheduled').length,
        approved: visaRecords.filter(v => v.status === 'approved').length,
        rejected: visaRecords.filter(v => v.status === 'rejected').length,
      },
      upcomingAppointments: visaRecords.filter(v => 
        v.appointmentDate && new Date(v.appointmentDate) <= sevenDaysLater
      ).length
    };
  }
  
  res.json({
    stats,
    roleSpecificData,
    recentDeadlines: upcomingDeadlines
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
      .map(d => ({
        ...d,
        studentName: students.find(s => s.id === d.studentId)?.name
      })),
    recentIssues: issues
      .filter(i => i.status !== 'resolved' && i.status !== 'closed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  });
});

module.exports = router;
