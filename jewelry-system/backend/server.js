import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

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
          { id: 'U001', name: '学习计划_v2.pdf', uploadDate: '2024-01-18', uploader: '李文案', version: 2 }
        ]
      }
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
    supplements: []
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
          { id: 'U002', name: 'GTE声明_v1.pdf', uploadDate: '2024-01-10', uploader: '李文案', version: 1, status: 'rejected' }
        ]
      }
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
    supplements: []
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
          { id: 'U003', name: '成绩单.pdf', uploadDate: '2024-01-22', uploader: '王顾问', version: 1, status: 'reviewing' }
        ]
      }
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
    supplements: []
  }
];

const refundCases = [
  {
    id: 'R2024001',
    caseId: 'V2024007',
    studentName: '周小明',
    amount: 15000,
    reason: '签证被拒，申请退款',
    status: 'reviewing',
    statusText: '审核中',
    requestedDate: '2024-01-20',
    deadline: '2024-02-03',
    documents: [
      { id: 'D001', name: '拒签信.pdf', uploaded: true },
      { id: 'D002', name: '退款申请.pdf', uploaded: true },
      { id: 'D003', name: '合同复印件.pdf', uploaded: false }
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

app.post('/api/cases/:id/supplements/:supplementId/upload', (req, res) => {
  res.json({
    success: true,
    message: '文件上传成功'
  });
});

app.post('/api/cases/:id/notes', (req, res) => {
  res.json({
    success: true,
    message: '备注添加成功',
    data: {
      id: Date.now(),
      content: req.body.content,
      createdAt: new Date().toISOString(),
      author: '当前用户'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 后端API服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/api/health`);
});
