import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const visaCases = [
  {
    id: 'V2024001',
    studentName: '李思琪',
    studentId: 'S2024001',
    country: '美国',
    visaType: 'F1学生签',
    university: '哥伦比亚大学',
    consultant: '王顾问',
    copywriter: '李文案',
    visaAssistant: '张助理',
    status: 'pending_supplement',
    statusText: '待补件',
    priority: 'high',
    deadline: '2024-02-15',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25',
    currentStep: 4,
    totalSteps: 7,
    timeline: [
      { step: 1, title: '材料收集', status: 'completed', date: '2024-01-10', operator: '王顾问' },
      { step: 2, title: '文书撰写', status: 'completed', date: '2024-01-15', operator: '李文案' },
      { step: 3, title: '材料审核', status: 'completed', date: '2024-01-20', operator: '张助理' },
      { step: 4, title: '使馆递交', status: 'returned', date: '2024-01-25', operator: '使馆', note: '资金证明材料不足，需补充' },
      { step: 5, title: '补件回查', status: 'pending', date: null, operator: null },
      { step: 6, title: '面签安排', status: 'pending', date: null, operator: null },
      { step: 7, title: '签证获批', status: 'pending', date: null, operator: null }
    ],
    supplements: [
      {
        id: 'SP001',
        type: 'bank_statement',
        name: '银行存款证明',
        status: 'required',
        requiredDate: '2024-02-01',
        description: '需提供覆盖第一年学费和生活费的存款证明（至少50万人民币）',
        uploads: []
      },
      {
        id: 'SP002',
        type: 'study_plan',
        name: '学习计划',
        status: 'approved',
        requiredDate: '2024-01-20',
        description: '详细的学习计划和职业规划',
        uploads: [
          { id: 'U001', name: '学习计划_v2.pdf', uploadDate: '2024-01-18', uploader: '李文案', version: 2, size: '1.2 MB' }
        ]
      }
    ],
    documents: [
      { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2024-01-10', uploader: '王顾问', size: '2.3 MB' },
      { id: 'DOC002', name: '身份证正反面.pdf', category: '个人材料', status: 'approved', uploadedAt: '2024-01-10', uploader: '王顾问', size: '1.1 MB' },
      { id: 'DOC003', name: '大学成绩单.pdf', category: '学术材料', status: 'under_review', uploadedAt: '2024-01-15', uploader: '李文案', size: '1.5 MB' },
      { id: 'DOC004', name: '在读证明.pdf', category: '学术材料', status: 'approved', uploadedAt: '2024-01-12', uploader: '李文案', size: '890 KB' },
      { id: 'DOC005', name: '银行存款证明.pdf', category: '资金证明', status: 'required', uploadedAt: null, uploader: null, size: null },
      { id: 'DOC006', name: '收入证明.pdf', category: '资金证明', status: 'rejected', uploadedAt: '2024-01-18', uploader: '张助理', size: '560 KB', rejectReason: '需要英文版盖章' },
      { id: 'DOC007', name: '语言成绩.pdf', category: '学术材料', status: 'approved', uploadedAt: '2024-01-08', uploader: '王顾问', size: '450 KB' },
      { id: 'DOC008', name: '推荐信.pdf', category: '学术材料', status: 'under_review', uploadedAt: '2024-01-20', uploader: '李文案', size: '1.2 MB' }
    ],
    notes: [
      { id: 1, content: '学生已提供护照扫描件，开始处理材料收集', author: '王顾问', createdAt: '2024-01-10 10:30' },
      { id: 2, content: '文书初稿完成，已发送给学生确认', author: '李文案', createdAt: '2024-01-15 14:20' },
      { id: 3, content: '材料审核发现资金证明不足，已通知学生补充', author: '张助理', createdAt: '2024-01-25 09:15' }
    ]
  },
  {
    id: 'V2024002',
    studentName: '王浩然',
    studentId: 'S2024002',
    country: '英国',
    visaType: 'Tier 4学生签',
    university: '伦敦大学学院',
    consultant: '陈顾问',
    copywriter: '刘文案',
    visaAssistant: '赵助理',
    status: 'processing',
    statusText: '处理中',
    priority: 'medium',
    deadline: '2024-03-01',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-22',
    currentStep: 3,
    totalSteps: 7,
    timeline: [
      { step: 1, title: '材料收集', status: 'completed', date: '2024-01-05', operator: '陈顾问' },
      { step: 2, title: '文书撰写', status: 'completed', date: '2024-01-12', operator: '刘文案' },
      { step: 3, title: '材料审核', status: 'in_progress', date: null, operator: '赵助理' },
      { step: 4, title: '使馆递交', status: 'pending', date: null, operator: null },
      { step: 5, title: '补件回查', status: 'pending', date: null, operator: null },
      { step: 6, title: '面签安排', status: 'pending', date: null, operator: null },
      { step: 7, title: '签证获批', status: 'pending', date: null, operator: null }
    ],
    supplements: [],
    documents: [
      { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2024-01-05', uploader: '陈顾问', size: '1.8 MB' },
      { id: 'DOC002', name: '大学成绩单.pdf', category: '学术材料', status: 'approved', uploadedAt: '2024-01-08', uploader: '刘文案', size: '2.1 MB' },
      { id: 'DOC003', name: '存款证明.pdf', category: '资金证明', status: 'under_review', uploadedAt: '2024-01-18', uploader: '赵助理', size: '3.2 MB' }
    ],
    notes: [
      { id: 1, content: '材料收集完成，转入文书撰写阶段', author: '陈顾问', createdAt: '2024-01-08 11:00' },
      { id: 2, content: '文书完成，正在审核材料', author: '赵助理', createdAt: '2024-01-22 16:30' }
    ]
  },
  {
    id: 'V2024003',
    studentName: '陈雨萱',
    studentId: 'S2024003',
    country: '澳大利亚',
    visaType: '500学生签',
    university: '墨尔本大学',
    consultant: '王顾问',
    copywriter: '李文案',
    visaAssistant: '张助理',
    status: 'rejected',
    statusText: '已驳回',
    priority: 'urgent',
    deadline: '2024-02-01',
    createdAt: '2023-12-15',
    updatedAt: '2024-01-20',
    currentStep: 4,
    totalSteps: 7,
    timeline: [
      { step: 1, title: '材料收集', status: 'completed', date: '2023-12-15', operator: '王顾问' },
      { step: 2, title: '文书撰写', status: 'completed', date: '2023-12-22', operator: '李文案' },
      { step: 3, title: '材料审核', status: 'completed', date: '2024-01-02', operator: '张助理' },
      { step: 4, title: '使馆递交', status: 'rejected', date: '2024-01-20', operator: '使馆', note: 'GTE声明不充分，学习目的存疑' },
      { step: 5, title: '补件回查', status: 'pending', date: null, operator: null },
      { step: 6, title: '面签安排', status: 'pending', date: null, operator: null },
      { step: 7, title: '签证获批', status: 'pending', date: null, operator: null }
    ],
    supplements: [
      {
        id: 'SP003',
        type: 'gte_statement',
        name: 'GTE声明',
        status: 'rejected',
        requiredDate: '2024-01-25',
        description: '需重新撰写GTE声明，详细说明学习目的和回国计划',
        uploads: [
          { id: 'U002', name: 'GTE声明_v1.pdf', uploadDate: '2024-01-10', uploader: '李文案', version: 1, status: 'rejected', size: '450 KB' }
        ]
      }
    ],
    documents: [
      { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2023-12-15', uploader: '王顾问', size: '2.0 MB' },
      { id: 'DOC002', name: 'GTE声明.pdf', category: '文书材料', status: 'rejected', uploadedAt: '2024-01-10', uploader: '李文案', size: '450 KB', rejectReason: '学习目的阐述不清晰' },
      { id: 'DOC003', name: '雅思成绩.pdf', category: '学术材料', status: 'approved', uploadedAt: '2023-12-20', uploader: '王顾问', size: '320 KB' }
    ],
    notes: [
      { id: 1, content: '学生目标院校墨尔本大学，GTE需要重点关注', author: '王顾问', createdAt: '2023-12-16 09:00' },
      { id: 2, content: '使馆已驳回，需要重新提交GTE', author: '张助理', createdAt: '2024-01-20 14:00' }
    ]
  },
  {
    id: 'V2024004',
    studentName: '刘子轩',
    studentId: 'S2024004',
    country: '加拿大',
    visaType: '学签',
    university: '多伦多大学',
    consultant: '陈顾问',
    copywriter: '刘文案',
    visaAssistant: '赵助理',
    status: 'approved',
    statusText: '已通过',
    priority: 'low',
    deadline: '2024-02-28',
    createdAt: '2023-11-20',
    updatedAt: '2024-01-15',
    currentStep: 7,
    totalSteps: 7,
    timeline: [
      { step: 1, title: '材料收集', status: 'completed', date: '2023-11-20', operator: '陈顾问' },
      { step: 2, title: '文书撰写', status: 'completed', date: '2023-11-28', operator: '刘文案' },
      { step: 3, title: '材料审核', status: 'completed', date: '2023-12-05', operator: '赵助理' },
      { step: 4, title: '使馆递交', status: 'completed', date: '2023-12-10', operator: '赵助理' },
      { step: 5, title: '补件回查', status: 'completed', date: '2023-12-25', operator: '赵助理' },
      { step: 6, title: '面签安排', status: 'completed', date: '2024-01-05', operator: '赵助理' },
      { step: 7, title: '签证获批', status: 'completed', date: '2024-01-15', operator: '使馆' }
    ],
    supplements: [],
    documents: [
      { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2023-11-20', uploader: '陈顾问', size: '1.5 MB' },
      { id: 'DOC002', name: '录取通知书.pdf', category: '学术材料', status: 'approved', uploadedAt: '2023-11-22', uploader: '陈顾问', size: '2.3 MB' },
      { id: 'DOC003', name: '资金证明.pdf', category: '资金证明', status: 'approved', uploadedAt: '2023-11-25', uploader: '刘文案', size: '4.1 MB' }
    ],
    notes: [
      { id: 1, content: '加拿大学签申请，材料完整', author: '陈顾问', createdAt: '2023-11-21 10:00' },
      { id: 2, content: '签证已获批，恭喜学生！', author: '赵助理', createdAt: '2024-01-15 11:30' }
    ]
  },
  {
    id: 'V2024005',
    studentName: '赵欣怡',
    studentId: 'S2024005',
    country: '新西兰',
    visaType: '学生签证',
    university: '奥克兰大学',
    consultant: '王顾问',
    copywriter: '李文案',
    visaAssistant: '张助理',
    status: 'under_review',
    statusText: '审核中',
    priority: 'medium',
    deadline: '2024-03-15',
    createdAt: '2024-01-08',
    updatedAt: '2024-01-24',
    currentStep: 5,
    totalSteps: 7,
    timeline: [
      { step: 1, title: '材料收集', status: 'completed', date: '2024-01-08', operator: '王顾问' },
      { step: 2, title: '文书撰写', status: 'completed', date: '2024-01-14', operator: '李文案' },
      { step: 3, title: '材料审核', status: 'completed', date: '2024-01-18', operator: '张助理' },
      { step: 4, title: '使馆递交', status: 'completed', date: '2024-01-20', operator: '张助理' },
      { step: 5, title: '补件回查', status: 'in_progress', date: null, operator: '张助理' },
      { step: 6, title: '面签安排', status: 'pending', date: null, operator: null },
      { step: 7, title: '签证获批', status: 'pending', date: null, operator: null }
    ],
    supplements: [
      {
        id: 'SP004',
        type: 'academic_transcript',
        name: '成绩单',
        status: 'under_review',
        requiredDate: '2024-01-28',
        description: '需提供中英文对照的官方成绩单',
        uploads: [
          { id: 'U003', name: '成绩单.pdf', uploadDate: '2024-01-22', uploader: '王顾问', version: 1, status: 'reviewing', size: '1.5 MB' }
        ]
      }
    ],
    documents: [
      { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2024-01-08', uploader: '王顾问', size: '1.9 MB' },
      { id: 'DOC002', name: '成绩单.pdf', category: '学术材料', status: 'under_review', uploadedAt: '2024-01-22', uploader: '王顾问', size: '1.5 MB' }
    ],
    notes: [
      { id: 1, content: '新西兰学生签证申请启动', author: '王顾问', createdAt: '2024-01-08 15:00' },
      { id: 2, content: '成绩单已上传，等待使馆审核', author: '张助理', createdAt: '2024-01-24 09:30' }
    ]
  },
  {
    id: 'V2024006',
    studentName: '孙浩然',
    studentId: 'S2024006',
    country: '德国',
    visaType: '学生签证',
    university: '慕尼黑工业大学',
    consultant: '陈顾问',
    copywriter: '刘文案',
    visaAssistant: '赵助理',
    status: 'overdue',
    statusText: '已逾期',
    priority: 'urgent',
    deadline: '2024-01-20',
    createdAt: '2023-12-01',
    updatedAt: '2024-01-10',
    currentStep: 2,
    totalSteps: 7,
    timeline: [
      { step: 1, title: '材料收集', status: 'completed', date: '2023-12-01', operator: '陈顾问' },
      { step: 2, title: '文书撰写', status: 'in_progress', date: null, operator: '刘文案' },
      { step: 3, title: '材料审核', status: 'pending', date: null, operator: null },
      { step: 4, title: '使馆递交', status: 'pending', date: null, operator: null },
      { step: 5, title: '补件回查', status: 'pending', date: null, operator: null },
      { step: 6, title: '面签安排', status: 'pending', date: null, operator: null },
      { step: 7, title: '签证获批', status: 'pending', date: null, operator: null }
    ],
    supplements: [],
    documents: [
      { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2023-12-01', uploader: '陈顾问', size: '2.1 MB' },
      { id: 'DOC002', name: '德语成绩.pdf', category: '学术材料', status: 'required', uploadedAt: null, uploader: null, size: null }
    ],
    notes: [
      { id: 1, content: '德国留学，需要APS审核', author: '陈顾问', createdAt: '2023-12-02 10:00' },
      { id: 2, content: '文书进度滞后，已催办文案', author: '陈顾问', createdAt: '2024-01-15 16:00' }
    ]
  }
];

const refundCases = [
  {
    id: 'R2024001',
    caseId: 'V2024003',
    studentName: '陈雨萱',
    amount: 15000,
    reason: '签证被拒，申请退款',
    status: 'reviewing',
    statusText: '审核中',
    requestedDate: '2024-01-20',
    deadline: '2024-02-03',
    case: {
      id: 'V2024003',
      studentName: '陈雨萱',
      country: '澳大利亚',
      visaType: '500学生签',
      university: '墨尔本大学',
      status: 'rejected',
      statusText: '已驳回',
      consultant: '王顾问'
    },
    documents: [
      { id: 'D001', name: '拒签信.pdf', uploaded: true },
      { id: 'D002', name: '退款申请.pdf', uploaded: true },
      { id: 'D003', name: '合同复印件.pdf', uploaded: false }
    ],
    messages: [
      { id: 1, author: '系统', content: '退款申请已提交，等待材料审核', time: '2024-01-20 10:30' },
      { id: 2, author: '王顾问', content: '已收到拒签信，正在审核材料', time: '2024-01-21 09:15' }
    ]
  },
  {
    id: 'R2024002',
    caseId: 'V2024006',
    studentName: '孙浩然',
    amount: 8000,
    reason: '文书进度滞后，学生要求退款',
    status: 'pending',
    statusText: '待处理',
    requestedDate: '2024-01-22',
    deadline: '2024-02-05',
    case: {
      id: 'V2024006',
      studentName: '孙浩然',
      country: '德国',
      visaType: '学生签证',
      university: '慕尼黑工业大学',
      status: 'overdue',
      statusText: '已逾期',
      consultant: '陈顾问'
    },
    documents: [
      { id: 'D001', name: '退款申请.pdf', uploaded: true },
      { id: 'D002', name: '合同复印件.pdf', uploaded: true }
    ],
    messages: [
      { id: 1, author: '系统', content: '退款申请已提交', time: '2024-01-22 14:00' }
    ]
  }
];

const notifications = [
  {
    id: 'N001',
    type: 'urgent',
    title: '补件截止日临近',
    message: '李思琪的银行存款证明需在2月1日前提交',
    caseId: 'V2024001',
    time: '1小时前'
  },
  {
    id: 'N002',
    type: 'warning',
    title: '案件已逾期',
    message: '孙浩然的文书撰写已超过截止日期',
    caseId: 'V2024006',
    time: '3小时前'
  },
  {
    id: 'N003',
    type: 'info',
    title: '材料已通过审核',
    message: '刘子轩的签证已成功获批',
    caseId: 'V2024004',
    time: '昨天'
  }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '签证进度管理系统API运行正常' });
});

app.get('/api/dashboard/stats', (req, res) => {
  const pendingCases = visaCases.filter(c => 
    ['pending_supplement', 'processing', 'under_review', 'in_progress', 'overdue'].includes(c.status)
  ).length;
  
  const rejectedCases = visaCases.filter(c => c.status === 'rejected').length;
  
  const supplementCases = visaCases.filter(c => 
    c.supplements && c.supplements.some(s => ['required', 'rejected', 'under_review'].includes(s.status))
  ).length;
  
  const today = new Date('2024-01-26');
  const urgentCases = visaCases.filter(c => {
    const deadline = new Date(c.deadline);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && c.status !== 'approved';
  }).length;
  
  const approvedCases = visaCases.filter(c => c.status === 'approved').length;
  
  res.json({
    success: true,
    data: {
      pendingCases,
      rejectedCases,
      supplementCases,
      urgentCases,
      approvedCases,
      totalCases: visaCases.length,
      approvalRate: Math.round((approvedCases / visaCases.length) * 100)
    }
  });
});

app.get('/api/dashboard/mytasks', (req, res) => {
  const today = new Date('2024-01-26');
  
  const myTasks = visaCases
    .filter(c => c.status !== 'approved')
    .slice(0, 5)
    .map(c => {
      const deadline = new Date(c.deadline);
      const diffTime = deadline - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...c, daysLeft };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  res.json({
    success: true,
    data: myTasks
  });
});

app.get('/api/dashboard/supplement-alerts', (req, res) => {
  const supplementCases = visaCases
    .filter(c => 
      c.supplements && c.supplements.some(s => ['required', 'rejected'].includes(s.status))
    )
    .map(c => ({
      id: c.id,
      studentName: c.studentName,
      supplements: c.supplements.filter(s => ['required', 'rejected'].includes(s.status))
    }));

  res.json({
    success: true,
    data: supplementCases
  });
});

app.get('/api/dashboard/refunds', (req, res) => {
  res.json({
    success: true,
    data: refundCases
  });
});

app.get('/api/cases', (req, res) => {
  const { status, search } = req.query;
  let filteredCases = [...visaCases];
  
  if (status) {
    filteredCases = filteredCases.filter(c => c.status === status);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCases = filteredCases.filter(c => 
      c.studentName.toLowerCase().includes(searchLower) ||
      c.id.toLowerCase().includes(searchLower) ||
      c.university.toLowerCase().includes(searchLower)
    );
  }
  
  res.json({
    success: true,
    data: filteredCases,
    total: filteredCases.length
  });
});

app.get('/api/cases/:id', (req, res) => {
  const caseData = visaCases.find(c => c.id === req.params.id);
  
  if (!caseData) {
    return res.status(404).json({
      success: false,
      message: '未找到该案件'
    });
  }
  
  res.json({
    success: true,
    data: caseData
  });
});

app.get('/api/cases/:id/documents', (req, res) => {
  const caseData = visaCases.find(c => c.id === req.params.id);
  
  if (!caseData) {
    return res.status(404).json({
      success: false,
      message: '未找到该案件'
    });
  }
  
  res.json({
    success: true,
    data: caseData.documents || []
  });
});

app.get('/api/cases/:id/notes', (req, res) => {
  const caseData = visaCases.find(c => c.id === req.params.id);
  
  if (!caseData) {
    return res.status(404).json({
      success: false,
      message: '未找到该案件'
    });
  }
  
  res.json({
    success: true,
    data: caseData.notes || []
  });
});

app.post('/api/cases/:id/notes', (req, res) => {
  const { content } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: '备注内容不能为空'
    });
  }
  
  const caseData = visaCases.find(c => c.id === req.params.id);
  
  if (!caseData) {
    return res.status(404).json({
      success: false,
      message: '未找到该案件'
    });
  }
  
  const newNote = {
    id: Date.now(),
    content: content.trim(),
    author: '当前用户',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  
  if (!caseData.notes) {
    caseData.notes = [];
  }
  
  caseData.notes.unshift(newNote);
  caseData.updatedAt = new Date().toISOString().split('T')[0];
  
  res.json({
    success: true,
    message: '备注添加成功',
    data: newNote
  });
});

app.get('/api/supplements', (req, res) => {
  const allSupplements = visaCases.flatMap(c => 
    c.supplements.map(s => ({
      ...s,
      caseId: c.id,
      studentName: c.studentName,
      country: c.country,
      deadline: c.deadline
    }))
  );
  
  res.json({
    success: true,
    data: allSupplements,
    total: allSupplements.length
  });
});

app.post('/api/cases/:id/supplements/:supplementId/upload', upload.single('file'), (req, res) => {
  const caseData = visaCases.find(c => c.id === req.params.id);
  
  if (!caseData) {
    return res.status(404).json({
      success: false,
      message: '未找到该案件'
    });
  }
  
  const supplement = caseData.supplements?.find(s => s.id === req.params.supplementId);
  
  if (!supplement) {
    return res.status(404).json({
      success: false,
      message: '未找到该补件项'
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '请选择要上传的文件'
    });
  }
  
  const fileSize = req.file.size;
  let sizeText;
  if (fileSize < 1024) {
    sizeText = fileSize + ' B';
  } else if (fileSize < 1024 * 1024) {
    sizeText = (fileSize / 1024).toFixed(1) + ' KB';
  } else {
    sizeText = (fileSize / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  const newUpload = {
    id: 'U' + Date.now(),
    name: req.file.originalname,
    uploadDate: new Date().toISOString().split('T')[0],
    uploader: '当前用户',
    version: (supplement.uploads?.length || 0) + 1,
    status: 'reviewing',
    size: sizeText
  };
  
  if (!supplement.uploads) {
    supplement.uploads = [];
  }
  
  supplement.uploads.push(newUpload);
  supplement.status = 'under_review';
  caseData.updatedAt = new Date().toISOString().split('T')[0];
  
  res.json({
    success: true,
    message: '文件上传成功',
    data: {
      supplement: supplement,
      upload: newUpload
    }
  });
});

app.get('/api/refunds', (req, res) => {
  res.json({
    success: true,
    data: refundCases,
    total: refundCases.length
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: notifications,
    total: notifications.length
  });
});

app.get('/api/reports/stats', (req, res) => {
  const { dateRange = 'this_month' } = req.query;
  
  const totalCases = visaCases.length;
  const approvedCases = visaCases.filter(c => c.status === 'approved').length;
  const rejectedCases = visaCases.filter(c => c.status === 'rejected').length;
  const pendingCases = visaCases.filter(c => 
    ['processing', 'under_review', 'pending_supplement', 'in_progress'].includes(c.status)
  ).length;
  const overdueCases = visaCases.filter(c => c.status === 'overdue').length;
  const approvalRate = totalCases > 0 ? Math.round((approvedCases / totalCases) * 100) : 0;

  const countryMap = {};
  visaCases.forEach(c => {
    countryMap[c.country] = (countryMap[c.country] || 0) + 1;
  });
  
  const countryStats = Object.entries(countryMap).map(([country, count]) => ({
    country,
    count,
    percentage: totalCases > 0 ? Math.round((count / totalCases) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  const completedCases = visaCases.filter(c => c.status === 'approved' || c.status === 'rejected');
  let totalProcessDays = 0;
  let completedCount = 0;
  completedCases.forEach(c => {
    if (c.createdAt && c.updatedAt) {
      const created = new Date(c.createdAt);
      const updated = new Date(c.updatedAt);
      const diffTime = Math.abs(updated - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        totalProcessDays += diffDays;
        completedCount++;
      }
    }
  });
  const avgProcessDays = completedCount > 0 ? (totalProcessDays / completedCount).toFixed(1) : 0;

  const casesWithSupplements = visaCases.filter(c => 
    c.supplements && c.supplements.length > 0 && c.supplements.some(s => s.uploads && s.uploads.length > 0)
  );
  let totalSupplementDays = 0;
  let supplementCount = 0;
  casesWithSupplements.forEach(c => {
    c.supplements.forEach(s => {
      if (s.requiredDate && s.uploads && s.uploads.length > 0) {
        const latestUpload = s.uploads[s.uploads.length - 1];
        if (latestUpload.uploadDate) {
          const required = new Date(s.requiredDate);
          const uploaded = new Date(latestUpload.uploadDate);
          const diffTime = Math.abs(required - uploaded);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          totalSupplementDays += diffDays;
          supplementCount++;
        }
      }
    });
  });
  const avgSupplementDays = supplementCount > 0 ? (totalSupplementDays / supplementCount).toFixed(1) : 0;

  const stats = [
    { label: '总案件数', value: totalCases, change: '+12%', trend: 'up' },
    { label: '已完成', value: approvedCases, change: '+8%', trend: 'up' },
    { label: '进行中', value: pendingCases, change: '-3%', trend: 'down' },
    { label: '已驳回', value: rejectedCases, change: '+2%', trend: 'up' }
  ];

  res.json({
    success: true,
    data: {
      dateRange,
      stats,
      totalCases,
      approvedCases,
      rejectedCases,
      pendingCases,
      overdueCases,
      approvalRate,
      countryStats,
      avgProcessDays: parseFloat(avgProcessDays),
      avgSupplementDays: parseFloat(avgSupplementDays)
    }
  });
});

app.get('/api/refunds/:id', (req, res) => {
  const refund = refundCases.find(r => r.id === req.params.id);
  
  if (!refund) {
    return res.status(404).json({
      success: false,
      message: '未找到该退款申请'
    });
  }

  const relatedCase = visaCases.find(c => c.id === refund.caseId);

  res.json({
    success: true,
    data: {
      ...refund,
      case: relatedCase || null
    }
  });
});

app.post('/api/refunds/:id/messages', (req, res) => {
  const { content } = req.body;
  
  if (!content || !content.trim()) {
    return res.status(400).json({
      success: false,
      message: '消息内容不能为空'
    });
  }

  const refund = refundCases.find(r => r.id === req.params.id);
  
  if (!refund) {
    return res.status(404).json({
      success: false,
      message: '未找到该退款申请'
    });
  }

  const newMessage = {
    id: Date.now(),
    author: '当前用户',
    content: content.trim(),
    time: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };

  if (!refund.messages) {
    refund.messages = [];
  }
  
  refund.messages.push(newMessage);

  res.json({
    success: true,
    message: '消息发送成功',
    data: newMessage
  });
});

app.listen(PORT, () => {
  console.log(`🚀 后端API服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📊 工作台统计: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`📋 待办任务: http://localhost:${PORT}/api/dashboard/mytasks`);
});
