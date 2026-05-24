const { generateMockData } = require('./mockData');

class DataStore {
  constructor() {
    const data = generateMockData();
    this.users = data.users;
    this.students = data.students;
    this.documents = data.documents;
    this.deadlines = data.deadlines;
    this.visaRecords = data.visaRecords;
    this.issues = data.issues;
    this.messages = data.messages;
    this.activityLogs = data.activityLogs;
  }

  findUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  findUserById(id) {
    return this.users.find(u => u.id === id);
  }

  getStudentsByRole(userId, role) {
    if (role === 'consultant_manager') {
      return this.students;
    } else if (role === 'copywriter') {
      return this.students.filter(s => s.copywriterId === userId);
    } else if (role === 'visa_assistant') {
      return this.students.filter(s => s.visaAssistantId === userId);
    }
    return [];
  }

  getStudentById(id) {
    return this.students.find(s => s.id === id);
  }

  updateStudent(id, updates) {
    const index = this.students.findIndex(s => s.id === id);
    if (index !== -1) {
      this.students[index] = { ...this.students[index], ...updates, updatedAt: new Date().toISOString() };
      return this.students[index];
    }
    return null;
  }

  getDocumentsByStudent(studentId) {
    return this.documents.filter(d => d.studentId === studentId);
  }

  getDocumentById(id) {
    return this.documents.find(d => d.id === id);
  }

  updateDocumentStatus(id, status, feedback, userId) {
    const doc = this.documents.find(d => d.id === id);
    if (doc) {
      doc.status = status;
      if (feedback) doc.feedback = feedback;
      doc.updatedAt = new Date().toISOString();
      
      if (status === 'approved') {
        const deadline = this.deadlines.find(d => d.relatedDocumentId === id);
        if (deadline) {
          deadline.isCompleted = true;
        }
      }
      
      this.addActivityLog(doc.studentId, `文档"${doc.name}"状态变更为: ${status}`, userId, this.findUserById(userId)?.name || '系统', { status });
      
      return doc;
    }
    return null;
  }

  addDocumentVersion(documentId, versionData, userId) {
    const doc = this.documents.find(d => d.id === documentId);
    if (doc) {
      const newVersion = {
        id: `v_${Date.now()}`,
        documentId,
        version: doc.currentVersion + 1,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        ...versionData
      };
      doc.versions.push(newVersion);
      doc.currentVersion = newVersion.version;
      doc.status = 'review';
      doc.updatedAt = new Date().toISOString();
      
      this.addActivityLog(doc.studentId, `文档"${doc.name}"上传了新版本 v${newVersion.version}`, userId, this.findUserById(userId)?.name || '系统', { version: newVersion.version });
      
      return newVersion;
    }
    return null;
  }

  getVisaByStudent(studentId) {
    return this.visaRecords.find(v => v.studentId === studentId);
  }

  updateVisaStatus(studentId, status, updates = {}) {
    const visa = this.visaRecords.find(v => v.studentId === studentId);
    if (visa) {
      Object.assign(visa, updates, { status, updatedAt: new Date().toISOString() });
      return visa;
    }
    return null;
  }

  addVisaNote(studentId, content, createdBy, type = 'update') {
    const visa = this.visaRecords.find(v => v.studentId === studentId);
    if (visa) {
      const note = {
        id: `note_${Date.now()}`,
        content,
        createdBy,
        createdAt: new Date().toISOString(),
        type
      };
      visa.notes.push(note);
      visa.updatedAt = new Date().toISOString();
      return note;
    }
    return null;
  }

  getDeadlinesByStudent(studentId) {
    return this.deadlines.filter(d => d.studentId === studentId);
  }

  getAllDeadlines() {
    return this.deadlines;
  }

  updateDeadline(id, updates) {
    const index = this.deadlines.findIndex(d => d.id === id);
    if (index !== -1) {
      this.deadlines[index] = { ...this.deadlines[index], ...updates };
      return this.deadlines[index];
    }
    return null;
  }

  getIssues() {
    return this.issues;
  }

  getIssueById(id) {
    return this.issues.find(i => i.id === id);
  }

  updateIssue(id, updates, userId) {
    const issue = this.issues.find(i => i.id === id);
    if (issue) {
      const oldStatus = issue.status;
      Object.assign(issue, updates, { updatedAt: new Date().toISOString() });
      
      if (updates.status && updates.status !== oldStatus) {
        issue.history.push({
          id: `h_${Date.now()}`,
          action: 'status_change',
          userId,
          userName: this.findUserById(userId)?.name || '系统',
          timestamp: new Date().toISOString(),
          oldValue: oldStatus,
          newValue: updates.status
        });
      }
      
      return issue;
    }
    return null;
  }

  getMessagesByStudent(studentId) {
    return this.messages.filter(m => m.studentId === studentId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  addMessage(studentId, senderId, content, relatedEntity = null) {
    const sender = this.findUserById(senderId);
    const message = {
      id: `msg_${Date.now()}`,
      studentId,
      senderId,
      senderName: sender?.name || '系统',
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedEntity
    };
    this.messages.push(message);
    return message;
  }

  addActivityLog(studentId, action, userId, userName, details = {}) {
    this.activityLogs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId,
      action,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      details
    });
  }

  getActivityLogsByStudent(studentId) {
    return this.activityLogs
      .filter(l => l.studentId === studentId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  canAccessStudent(studentId, userId, role) {
    const student = this.getStudentById(studentId);
    if (!student) return false;
    
    if (role === 'consultant_manager') return true;
    if (role === 'copywriter') return student.copywriterId === userId;
    if (role === 'visa_assistant') return student.visaAssistantId === userId;
    return false;
  }

  getDeadlinesByRole(userId, role) {
    const accessibleStudents = this.getStudentsByRole(userId, role);
    const accessibleStudentIds = accessibleStudents.map(s => s.id);
    return this.deadlines.filter(d => accessibleStudentIds.includes(d.studentId));
  }

  getIssuesByRole(userId, role) {
    if (role === 'consultant_manager') return this.issues;
    
    const accessibleStudents = this.getStudentsByRole(userId, role);
    const accessibleStudentIds = accessibleStudents.map(s => s.id);
    
    return this.issues.filter(i => {
      if (accessibleStudentIds.includes(i.studentId)) return true;
      if (i.assignedTo === userId) return true;
      return false;
    });
  }

  getDocumentsByRole(userId, role) {
    const accessibleStudents = this.getStudentsByRole(userId, role);
    const accessibleStudentIds = accessibleStudents.map(s => s.id);
    return this.documents.filter(d => accessibleStudentIds.includes(d.studentId));
  }
}

module.exports = new DataStore();
