function generateMockData() {
  const users = [
    { id: 'u1', name: '张明', email: 'manager@demo.com', password: 'password123', role: 'consultant_manager' },
    { id: 'u2', name: '李雪', email: 'writer@demo.com', password: 'password123', role: 'copywriter' },
    { id: 'u3', name: '王芳', email: 'visa@demo.com', password: 'password123', role: 'visa_assistant' }
  ];

  const students = [
    {
      id: 's1',
      name: '陈思远',
      englishName: 'Tom Chen',
      phone: '13800138001',
      email: 'chen.siyuan@email.com',
      targetCountry: '美国',
      targetSchool: '哥伦比亚大学',
      targetMajor: '计算机科学',
      status: 'document_prep',
      consultantId: 'u1',
      copywriterId: 'u2',
      visaAssistantId: 'u3',
      contractDate: '2026-01-15',
      expectedStartDate: '2026-09-01',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-05-20T14:30:00Z'
    },
    {
      id: 's2',
      name: '林雨萱',
      englishName: 'Sarah Lin',
      phone: '13800138002',
      email: 'lin.yuxuan@email.com',
      targetCountry: '英国',
      targetSchool: '伦敦大学学院',
      targetMajor: '金融学',
      status: 'visa_processing',
      consultantId: 'u1',
      copywriterId: 'u2',
      visaAssistantId: 'u3',
      contractDate: '2025-11-20',
      expectedStartDate: '2026-09-15',
      createdAt: '2025-11-15T09:00:00Z',
      updatedAt: '2026-05-22T11:00:00Z'
    },
    {
      id: 's3',
      name: '王浩然',
      englishName: 'Henry Wang',
      phone: '13800138003',
      email: 'wang.haoran@email.com',
      targetCountry: '澳大利亚',
      targetSchool: '墨尔本大学',
      targetMajor: '工程学',
      status: 'application_submitted',
      consultantId: 'u1',
      copywriterId: 'u2',
      visaAssistantId: 'u3',
      contractDate: '2026-02-01',
      expectedStartDate: '2027-02-01',
      createdAt: '2026-01-28T16:00:00Z',
      updatedAt: '2026-05-18T09:15:00Z'
    },
    {
      id: 's4',
      name: '赵佳琪',
      englishName: 'Jessie Zhao',
      phone: '13800138004',
      email: 'zhao.jiaqi@email.com',
      targetCountry: '加拿大',
      targetSchool: '多伦多大学',
      targetMajor: '商业管理',
      status: 'document_prep',
      consultantId: 'u1',
      copywriterId: 'u2',
      visaAssistantId: 'u3',
      contractDate: '2026-03-10',
      expectedStartDate: '2027-01-01',
      createdAt: '2026-03-05T11:30:00Z',
      updatedAt: '2026-05-15T15:45:00Z'
    },
    {
      id: 's5',
      name: '刘子轩',
      englishName: 'Leo Liu',
      phone: '13800138005',
      email: 'liu.zixuan@email.com',
      targetCountry: '美国',
      targetSchool: '纽约大学',
      targetMajor: '传媒学',
      status: 'consulting',
      consultantId: 'u1',
      createdAt: '2026-05-01T14:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z'
    }
  ];

  const documents = [
    {
      id: 'd1',
      studentId: 's1',
      name: '个人陈述 (Personal Statement)',
      type: 'personal_statement',
      status: 'review',
      assignedTo: 'u2',
      deadline: '2026-05-28',
      currentVersion: 2,
      versions: [
        { id: 'v1', documentId: 'd1', version: 1, uploadedBy: 's1', uploadedAt: '2026-05-01T10:00:00Z', fileUrl: '/files/s1/ps_v1.docx', fileName: 'PS初稿.docx', fileSize: 25000, comment: '初稿提交' },
        { id: 'v2', documentId: 'd1', version: 2, uploadedBy: 'u2', uploadedAt: '2026-05-15T14:30:00Z', fileUrl: '/files/s1/ps_v2.docx', fileName: 'PS修改版.docx', fileSize: 28000, comment: '根据反馈修改了职业规划部分' }
      ],
      feedback: '研究经历部分需要加强，请补充具体项目细节',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-20T09:00:00Z'
    },
    {
      id: 'd2',
      studentId: 's1',
      name: '推荐信1 (学术推荐)',
      type: 'recommendation_letter',
      status: 'approved',
      assignedTo: 'u2',
      deadline: '2026-05-20',
      currentVersion: 1,
      versions: [
        { id: 'v3', documentId: 'd2', version: 1, uploadedBy: 'u2', uploadedAt: '2026-05-10T11:00:00Z', fileUrl: '/files/s1/rl1_v1.docx', fileName: '推荐信-李教授.docx', fileSize: 18000, comment: '教授推荐信定稿' }
      ],
      createdAt: '2026-05-05T10:00:00Z',
      updatedAt: '2026-05-12T16:00:00Z'
    },
    {
      id: 'd3',
      studentId: 's1',
      name: '成绩单 (中英文)',
      type: 'transcript',
      status: 'overdue',
      deadline: '2026-05-15',
      currentVersion: 0,
      versions: [],
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-16T08:00:00Z'
    },
    {
      id: 'd4',
      studentId: 's2',
      name: '个人陈述 (Personal Statement)',
      type: 'personal_statement',
      status: 'approved',
      assignedTo: 'u2',
      deadline: '2026-03-15',
      currentVersion: 3,
      versions: [
        { id: 'v4', documentId: 'd4', version: 1, uploadedBy: 's2', uploadedAt: '2026-02-10T10:00:00Z', fileUrl: '/files/s2/ps_v1.docx', fileName: 'PS初稿.docx', fileSize: 22000 },
        { id: 'v5', documentId: 'd4', version: 2, uploadedBy: 'u2', uploadedAt: '2026-02-20T14:00:00Z', fileUrl: '/files/s2/ps_v2.docx', fileName: 'PS修改版.docx', fileSize: 24000, comment: '优化了实习经历描述' },
        { id: 'v6', documentId: 'd4', version: 3, uploadedBy: 'u2', uploadedAt: '2026-03-01T09:00:00Z', fileUrl: '/files/s2/ps_v3.docx', fileName: 'PS终稿.docx', fileSize: 24500, comment: '最终版本' }
      ],
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-03-05T16:00:00Z'
    },
    {
      id: 'd5',
      studentId: 's3',
      name: '简历 (Resume)',
      type: 'resume',
      status: 'in_progress',
      assignedTo: 'u2',
      deadline: '2026-06-01',
      currentVersion: 1,
      versions: [
        { id: 'v7', documentId: 'd5', version: 1, uploadedBy: 's3', uploadedAt: '2026-05-10T10:00:00Z', fileUrl: '/files/s3/resume_v1.docx', fileName: '个人简历初稿.docx', fileSize: 32000 }
      ],
      feedback: '项目经历部分需要调整格式，建议添加更多量化成果',
      createdAt: '2026-05-08T10:00:00Z',
      updatedAt: '2026-05-18T14:00:00Z'
    },
    {
      id: 'd6',
      studentId: 's4',
      name: '存款证明',
      type: 'financial_proof',
      status: 'pending',
      deadline: '2026-06-15',
      currentVersion: 0,
      versions: [],
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-01T10:00:00Z'
    }
  ];

  const deadlines = [
    { id: 'dl1', studentId: 's1', title: '哥大申请截止', type: 'application_deadline', date: '2026-06-15', description: '2026 Fall 常规申请截止日期', isCompleted: false, relatedDocumentId: null, createdAt: '2026-01-15T10:00:00Z' },
    { id: 'dl2', studentId: 's1', title: '成绩单提交截止', type: 'document_submission', date: '2026-05-15', description: '官方中英文成绩单', isCompleted: false, relatedDocumentId: 'd3', createdAt: '2026-05-01T10:00:00Z' },
    { id: 'dl3', studentId: 's1', title: 'PS终稿提交', type: 'document_submission', date: '2026-05-28', description: '个人陈述最终版', isCompleted: false, relatedDocumentId: 'd1', createdAt: '2026-05-01T10:00:00Z' },
    { id: 'dl4', studentId: 's2', title: '签证预约', type: 'visa_appointment', date: '2026-06-05', description: '英国学生签证面签', isCompleted: false, createdAt: '2026-04-15T10:00:00Z' },
    { id: 'dl5', studentId: 's2', title: '押金缴纳截止', type: 'tuition_payment', date: '2026-06-20', description: '接受offer需缴纳2000英镑押金', isCompleted: false, createdAt: '2026-04-20T10:00:00Z' },
    { id: 'dl6', studentId: 's3', title: '墨尔本大学申请截止', type: 'application_deadline', date: '2026-08-30', description: '2027 S1 申请截止', isCompleted: false, createdAt: '2026-02-15T10:00:00Z' },
    { id: 'dl7', studentId: 's4', title: '多大申请截止', type: 'application_deadline', date: '2026-09-15', description: '2027 Winter 申请截止', isCompleted: false, createdAt: '2026-03-15T10:00:00Z' },
    { id: 'dl8', studentId: 's4', title: '资金证明准备', type: 'document_submission', date: '2026-06-15', description: '存款证明需满足一年学费+生活费', isCompleted: false, relatedDocumentId: 'd6', createdAt: '2026-05-01T10:00:00Z' },
    { id: 'dl9', studentId: 's2', title: '行前准备', type: 'embarkation', date: '2026-09-10', description: '预计抵英日期', isCompleted: false, createdAt: '2026-04-01T10:00:00Z' }
  ];

  const visaRecords = [
    {
      id: 'visa1',
      studentId: 's2',
      status: 'documents_preparing',
      country: '英国',
      appointmentDate: '2026-06-05',
      notes: [
        { id: 'n1', content: '已收集护照、照片、录取通知书', createdBy: 'u3', createdAt: '2026-05-10T10:00:00Z', type: 'update' },
        { id: 'n2', content: '存款证明金额不足，需要补充', createdBy: 'u3', createdAt: '2026-05-15T14:30:00Z', type: 'issue' },
        { id: 'n3', content: '已通知学生补充资金证明到30万', createdBy: 'u3', createdAt: '2026-05-16T09:00:00Z', type: 'update' }
      ],
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-22T11:00:00Z'
    },
    {
      id: 'visa2',
      studentId: 's1',
      status: 'not_started',
      country: '美国',
      notes: [],
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'visa3',
      studentId: 's4',
      status: 'refund_in_progress',
      country: '加拿大',
      refundAmount: 15000,
      refundDate: '2026-05-08',
      notes: [
        { id: 'n4', content: '学生提出转申澳洲，申请退款', createdBy: 'u3', createdAt: '2026-05-08T10:00:00Z', type: 'refund' },
        { id: 'n5', content: '已发送合同条款说明，扣除30%服务费', createdBy: 'u1', createdAt: '2026-05-12T14:00:00Z', type: 'refund' },
        { id: 'n6', content: '家长希望全额退款，预约5月25日面谈', createdBy: 'u1', createdAt: '2026-05-18T11:00:00Z', type: 'issue' }
      ],
      createdAt: '2026-03-15T10:00:00Z',
      updatedAt: '2026-05-20T15:00:00Z'
    }
  ];

  const issues = [
    {
      id: 'i1',
      studentId: 's1',
      studentName: '陈思远',
      title: '成绩单逾期未提交',
      category: 'deadline_missed',
      status: 'in_progress',
      description: '成绩单截止日已过，学生仍未提交官方中英文成绩单。已催促3次，学生说学校正在办理。',
      assignedTo: 'u1',
      priority: 'high',
      createdAt: '2026-05-16T08:00:00Z',
      updatedAt: '2026-05-20T10:00:00Z',
      history: [
        { id: 'h1', action: 'created', userId: 'u1', userName: '张明', timestamp: '2026-05-16T08:00:00Z', comment: '发现成绩单逾期' },
        { id: 'h2', action: 'status_change', userId: 'u1', userName: '张明', timestamp: '2026-05-17T09:00:00Z', oldValue: 'open', newValue: 'in_progress', comment: '已联系学生，学校教务处下周出' }
      ]
    },
    {
      id: 'i2',
      studentId: 's2',
      studentName: '林雨萱',
      title: '存款证明金额不足',
      category: 'document_version',
      status: 'open',
      description: '签证所需存款证明金额不足，当前只有25万，要求至少35万人民币的资金证明。',
      assignedTo: 'u3',
      priority: 'high',
      createdAt: '2026-05-15T14:30:00Z',
      updatedAt: '2026-05-15T14:30:00Z',
      history: [
        { id: 'h3', action: 'created', userId: 'u3', userName: '王芳', timestamp: '2026-05-15T14:30:00Z', comment: '审核材料时发现金额不足' }
      ]
    },
    {
      id: 'i3',
      studentId: 's4',
      studentName: '赵佳琪',
      title: '退款协商进行中',
      category: 'refund_negotiation',
      status: 'in_progress',
      description: '学生考虑放弃申请加拿大，改申澳洲。已提出退款申请，合同约定签约30天后退款需扣除30%服务费。',
      assignedTo: 'u1',
      priority: 'critical',
      createdAt: '2026-05-10T10:00:00Z',
      updatedAt: '2026-05-20T15:00:00Z',
      history: [
        { id: 'h4', action: 'created', userId: 'u1', userName: '张明', timestamp: '2026-05-10T10:00:00Z', comment: '学生微信提出退款意向' },
        { id: 'h5', action: 'status_change', userId: 'u1', userName: '张明', timestamp: '2026-05-12T14:00:00Z', oldValue: 'open', newValue: 'in_progress', comment: '已发送合同条款说明，等待家长反馈' },
        { id: 'h6', action: 'comment', userId: 'u1', userName: '张明', timestamp: '2026-05-18T11:00:00Z', comment: '家长来电表示希望全额退款，已约5月25日面谈' }
      ]
    },
    {
      id: 'i4',
      studentId: 's3',
      studentName: '王浩然',
      title: 'PS版本混乱',
      category: 'document_version',
      status: 'resolved',
      description: '学生和文案老师各自修改，导致版本混乱，分不清哪个是最新版。',
      assignedTo: 'u2',
      priority: 'medium',
      createdAt: '2026-04-20T10:00:00Z',
      updatedAt: '2026-04-25T16:00:00Z',
      resolvedAt: '2026-04-25T16:00:00Z',
      history: [
        { id: 'h7', action: 'created', userId: 'u2', userName: '李雪', timestamp: '2026-04-20T10:00:00Z' },
        { id: 'h8', action: 'status_change', userId: 'u2', userName: '李雪', timestamp: '2026-04-22T09:00:00Z', oldValue: 'open', newValue: 'in_progress', comment: '已和学生约定统一使用系统版本管理' },
        { id: 'h9', action: 'status_change', userId: 'u2', userName: '李雪', timestamp: '2026-04-25T16:00:00Z', oldValue: 'in_progress', newValue: 'resolved', comment: '已整理完成，v3为最终版本' }
      ]
    }
  ];

  const messages = [
    { id: 'm1', studentId: 's1', senderId: 'u2', senderName: '李雪', content: 'PS的研究经历部分需要补充你在XX实验室的具体项目细节，包括用了什么技术、取得了什么成果。', timestamp: '2026-05-20T09:00:00Z', isRead: false, relatedEntity: { type: 'document', id: 'd1' } },
    { id: 'm2', studentId: 's1', senderId: 'u1', senderName: '张明', content: '成绩单请尽快联系学校开具，已经逾期了，这会影响后续申请进度。', timestamp: '2026-05-18T10:00:00Z', isRead: true, relatedEntity: { type: 'document', id: 'd3' } },
    { id: 'm3', studentId: 's2', senderId: 'u3', senderName: '王芳', content: '存款证明需要补充到35万，请尽快办理，以免影响签证预约。', timestamp: '2026-05-16T09:00:00Z', isRead: false, relatedEntity: { type: 'visa', id: 'visa1' } },
    { id: 'm4', studentId: 's4', senderId: 'u1', senderName: '张明', content: '关于退款事宜，我们已收到您的反馈，预约5月25日下午3点面谈。', timestamp: '2026-05-18T11:00:00Z', isRead: false, relatedEntity: { type: 'deadline', id: 'dl7' } }
  ];

  const activityLogs = [
    { id: 'l1', studentId: 's1', action: '上传了PS初稿', userId: 's1', userName: '陈思远', timestamp: '2026-05-01T10:00:00Z', details: { document: '个人陈述', version: 1 } },
    { id: 'l2', studentId: 's1', action: '提交了修改后的PS v2', userId: 'u2', userName: '李雪', timestamp: '2026-05-15T14:30:00Z', details: { document: '个人陈述', version: 2 } },
    { id: 'l3', studentId: 's2', action: '签证材料审核不通过', userId: 'u3', userName: '王芳', timestamp: '2026-05-15T14:30:00Z', details: { reason: '存款证明金额不足' } },
    { id: 'l4', studentId: 's4', action: '提出退款申请', userId: 'u1', userName: '张明', timestamp: '2026-05-10T10:00:00Z', details: { reason: '转申澳洲' } }
  ];

  return {
    users,
    students,
    documents,
    deadlines,
    visaRecords,
    issues,
    messages,
    activityLogs
  };
}

module.exports = { generateMockData };
