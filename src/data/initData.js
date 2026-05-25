const { v4: uuidv4 } = require('uuid');

const getInitUsers = () => [
  {
    id: 'user-001',
    username: 'channel_manager',
    password: '123456',
    name: '张伟',
    role: 'channel_manager',
    email: 'zhangwei@bookpub.com',
    phone: '13800138001'
  },
  {
    id: 'user-002',
    username: 'distribution_specialist',
    password: '123456',
    name: '李娜',
    role: 'distribution_specialist',
    email: 'lina@bookpub.com',
    phone: '13800138002'
  },
  {
    id: 'user-003',
    username: 'finance',
    password: '123456',
    name: '王芳',
    role: 'finance',
    email: 'wangfang@bookpub.com',
    phone: '13800138003'
  }
];

const getInitBooks = () => [
  {
    id: 'book-001',
    isbn: '978-7-111-54493-7',
    title: '人工智能时代的产品思维',
    author: '陈明远',
    publisher: '机械工业出版社',
    publishDate: new Date('2024-01-15'),
    price: 68.00,
    category: '计算机/人工智能',
    status: 'distributing'
  },
  {
    id: 'book-002',
    isbn: '978-7-115-45678-9',
    title: '现代企业管理实战',
    author: '刘建国',
    publisher: '人民邮电出版社',
    publishDate: new Date('2024-02-20'),
    price: 56.00,
    category: '管理/企业管理',
    status: 'distributing'
  },
  {
    id: 'book-003',
    isbn: '978-7-5086-9876-5',
    title: '数据驱动的增长策略',
    author: '赵晓峰',
    publisher: '中信出版社',
    publishDate: new Date('2024-03-10'),
    price: 78.00,
    category: '经济/市场营销',
    status: 'new'
  },
  {
    id: 'book-004',
    isbn: '978-7-121-34567-8',
    title: 'Python数据分析从入门到精通',
    author: '王思远',
    publisher: '电子工业出版社',
    publishDate: new Date('2024-01-05'),
    price: 89.00,
    category: '计算机/数据分析',
    status: 'distributing'
  }
];

const getInitChannels = () => [
  {
    id: 'channel-001',
    name: '京东图书',
    type: 'online',
    contactPerson: '刘强',
    contactPhone: '13900139001',
    address: '北京市亦庄经济技术开发区',
    email: 'liuqiang@jd.com',
    creditLevel: 5,
    status: 'active'
  },
  {
    id: 'channel-002',
    name: '当当网',
    type: 'online',
    contactPerson: '俞敏',
    contactPhone: '13900139002',
    address: '北京市朝阳区惠新东街',
    email: 'yumin@dangdang.com',
    creditLevel: 4,
    status: 'active'
  },
  {
    id: 'channel-003',
    name: '新华书店总店',
    type: 'offline',
    contactPerson: '周涛',
    contactPhone: '13900139003',
    address: '北京市西城区北礼士路',
    email: 'zhoutao@xinhua.com',
    creditLevel: 5,
    status: 'active'
  },
  {
    id: 'channel-004',
    name: '博库书城',
    type: 'distribution',
    contactPerson: '吴刚',
    contactPhone: '13900139004',
    address: '杭州市西湖区文二路',
    email: 'wugang@bookuu.com',
    creditLevel: 3,
    status: 'active'
  }
];

const getInitShipments = () => [
  {
    id: 'ship-001',
    shipmentNo: 'SS20240501001',
    bookId: 'book-001',
    channelId: 'channel-001',
    quantity: 50,
    unitPrice: 45.00,
    totalAmount: 2250.00,
    expressCompany: '顺丰速运',
    trackingNo: 'SF1234567890123',
    shipmentDate: new Date('2024-05-01'),
    status: 'confirmed',
    createdBy: 'user-002',
    confirmedBy: 'user-001',
    confirmedAt: new Date('2024-05-05'),
    notes: '京东首发样书'
  },
  {
    id: 'ship-002',
    shipmentNo: 'SS20240501002',
    bookId: 'book-001',
    channelId: 'channel-002',
    quantity: 30,
    unitPrice: 45.00,
    totalAmount: 1350.00,
    expressCompany: '顺丰速运',
    trackingNo: 'SF1234567890124',
    shipmentDate: new Date('2024-05-02'),
    status: 'delivered',
    createdBy: 'user-002',
    notes: '当当网样书寄送'
  },
  {
    id: 'ship-003',
    shipmentNo: 'SS20240503001',
    bookId: 'book-002',
    channelId: 'channel-003',
    quantity: 100,
    unitPrice: 38.00,
    totalAmount: 3800.00,
    expressCompany: '中通快递',
    trackingNo: 'ZT9876543210123',
    shipmentDate: new Date('2024-05-03'),
    status: 'receipt_lost',
    createdBy: 'user-002',
    notes: '新华书店总店铺货-回执丢失待跟进'
  },
  {
    id: 'ship-004',
    shipmentNo: 'SS20240505001',
    bookId: 'book-004',
    channelId: 'channel-001',
    quantity: 40,
    unitPrice: 58.00,
    totalAmount: 2320.00,
    expressCompany: '顺丰速运',
    trackingNo: 'SF1234567890567',
    shipmentDate: new Date('2024-05-05'),
    status: 'confirmed',
    createdBy: 'user-002',
    confirmedBy: 'user-001',
    confirmedAt: new Date('2024-05-08'),
    notes: '京东Python类重点推荐'
  },
  {
    id: 'ship-005',
    shipmentNo: 'SS20240508001',
    bookId: 'book-003',
    channelId: 'channel-004',
    quantity: 25,
    unitPrice: 52.00,
    totalAmount: 1300.00,
    expressCompany: null,
    trackingNo: null,
    shipmentDate: null,
    status: 'pending',
    createdBy: 'user-002',
    notes: '博库书城新书预热'
  },
  {
    id: 'ship-006',
    shipmentNo: 'SS20240510001',
    bookId: 'book-002',
    channelId: 'channel-004',
    quantity: 60,
    unitPrice: 38.00,
    totalAmount: 2280.00,
    expressCompany: '圆通速递',
    trackingNo: 'YT5678901234567',
    shipmentDate: new Date('2024-05-10'),
    status: 'shipped',
    createdBy: 'user-002',
    notes: '博库书城企业管理类铺货'
  }
];

const getInitFeedbacks = () => [
  {
    id: 'fb-001',
    feedbackNo: 'FB20240505001',
    shipmentId: 'ship-001',
    feedbackDate: new Date('2024-05-05'),
    receivedQuantity: 50,
    damagedQuantity: 0,
    channelFeedback: '京东首发反响热烈，预约量超过预期，建议加印备货',
    salesExpectation: 'high',
    displayLocation: '首页推荐位+人工智能专区首位',
    marketingSupport: '需要更多作者签名版用于直播活动',
    followUpDate: new Date('2024-05-20'),
    status: 'reviewed',
    createdBy: 'user-001',
    reviewedBy: 'user-002',
    reviewedAt: new Date('2024-05-06'),
    reviewNotes: '已安排加印计划，签名版协调中'
  },
  {
    id: 'fb-002',
    feedbackNo: 'FB20240508001',
    shipmentId: 'ship-004',
    feedbackDate: new Date('2024-05-08'),
    receivedQuantity: 40,
    damagedQuantity: 2,
    channelFeedback: '外包装轻微破损，2本书角有压痕，已协商补发',
    salesExpectation: 'medium',
    displayLocation: '计算机类目热销区',
    marketingSupport: '配合618大促活动',
    followUpDate: new Date('2024-06-01'),
    status: 'submitted',
    createdBy: 'user-001',
    reviewNotes: null
  },
  {
    id: 'fb-003',
    feedbackNo: 'FB20240512001',
    shipmentId: 'ship-003',
    feedbackDate: new Date('2024-05-12'),
    receivedQuantity: 100,
    damagedQuantity: 0,
    channelFeedback: '门店反馈读者咨询较多，但缺乏营销物料支持',
    salesExpectation: 'medium',
    displayLocation: '入口展台',
    marketingSupport: '需要宣传海报和作者讲座视频',
    followUpDate: new Date('2024-05-25'),
    status: 'draft',
    createdBy: 'user-001',
    reviewNotes: null
  }
];

const getInitReturns = () => [
  {
    id: 'ret-001',
    returnNo: 'RT20240515001',
    shipmentId: 'ship-002',
    requestDate: new Date('2024-05-15'),
    returnReason: 'slow_sales',
    returnReasonDetail: '上架两周销量未达预期，当当网申请退回10本',
    requestedQuantity: 10,
    approvedQuantity: 8,
    returnDate: new Date('2024-05-18'),
    trackingNo: 'SF9876543210987',
    receivedDate: new Date('2024-05-20'),
    receivedQuantity: 8,
    status: 'reconciled',
    caliberType: 'channel',
    caliberNotes: '渠道口径：按实际可销售数量退回8本，2本作为样品留存',
    createdBy: 'user-001',
    approvedBy: 'user-002',
    approvedAt: new Date('2024-05-17'),
    reconciledBy: 'user-003',
    reconciledAt: new Date('2024-05-22')
  },
  {
    id: 'ret-002',
    returnNo: 'RT20240520001',
    shipmentId: 'ship-001',
    requestDate: new Date('2024-05-20'),
    returnReason: 'damage',
    returnReasonDetail: '仓储过程中发现3本书脊损坏',
    requestedQuantity: 3,
    approvedQuantity: null,
    returnDate: null,
    trackingNo: null,
    receivedDate: null,
    receivedQuantity: 0,
    status: 'pending',
    caliberType: 'original',
    caliberNotes: null,
    createdBy: 'user-001',
    approvedBy: null,
    approvedAt: null,
    reconciledBy: null,
    reconciledAt: null
  }
];

const getInitReconciliations = () => [
  {
    id: 'recon-001',
    reconNo: 'RC202405-JD',
    period: '2024-05',
    channelId: 'channel-001',
    totalShipped: 90,
    totalShippedAmount: 4570.00,
    totalConfirmed: 90,
    totalConfirmedAmount: 4570.00,
    totalReturned: 3,
    totalReturnedAmount: 135.00,
    totalReceiptLost: 0,
    totalReceiptLostAmount: 0,
    totalCaliberDiscrepancy: 0,
    balanceQuantity: 87,
    balanceAmount: 4435.00,
    discrepancies: null,
    status: 'approved',
    createdBy: 'user-003',
    approvedBy: 'user-003',
    approvedAt: new Date('2024-05-25')
  },
  {
    id: 'recon-002',
    reconNo: 'RC202405-DD',
    period: '2024-05',
    channelId: 'channel-002',
    totalShipped: 30,
    totalShippedAmount: 1350.00,
    totalConfirmed: 0,
    totalConfirmedAmount: 0,
    totalReturned: 8,
    totalReturnedAmount: 360.00,
    totalReceiptLost: 0,
    totalReceiptLostAmount: 0,
    totalCaliberDiscrepancy: 2,
    balanceQuantity: -8,
    balanceAmount: -360.00,
    discrepancies: null,
    status: 'pending_approval',
    createdBy: 'user-003',
    approvedBy: null,
    approvedAt: null
  },
  {
    id: 'recon-003',
    reconNo: 'RC202405-XH',
    period: '2024-05',
    channelId: 'channel-003',
    totalShipped: 100,
    totalShippedAmount: 3800.00,
    totalConfirmed: 0,
    totalConfirmedAmount: 0,
    totalReturned: 0,
    totalReturnedAmount: 0,
    totalReceiptLost: 100,
    totalReceiptLostAmount: 3800.00,
    totalCaliberDiscrepancy: 0,
    balanceQuantity: 100,
    balanceAmount: 3800.00,
    discrepancies: null,
    status: 'draft',
    createdBy: 'user-003',
    approvedBy: null,
    approvedAt: null
  }
];

const getInitReconciliationItems = () => [
  {
    id: 'recon-item-001',
    reconciliationId: 'recon-001',
    shipmentId: 'ship-001',
    bookId: 'book-001',
    shippedQuantity: 50,
    shippedAmount: 2250.00,
    confirmedQuantity: 50,
    confirmedAmount: 2250.00,
    returnedQuantity: 3,
    returnedAmount: 135.00,
    difference: 47,
    differenceAmount: 2115.00,
    status: 'matched',
    notes: null
  },
  {
    id: 'recon-item-002',
    reconciliationId: 'recon-001',
    shipmentId: 'ship-004',
    bookId: 'book-004',
    shippedQuantity: 40,
    shippedAmount: 2320.00,
    confirmedQuantity: 40,
    confirmedAmount: 2320.00,
    returnedQuantity: 0,
    returnedAmount: 0,
    difference: 40,
    differenceAmount: 2320.00,
    status: 'matched',
    notes: null
  },
  {
    id: 'recon-item-003',
    reconciliationId: 'recon-002',
    shipmentId: 'ship-002',
    bookId: 'book-001',
    shippedQuantity: 30,
    shippedAmount: 1350.00,
    confirmedQuantity: 0,
    confirmedAmount: 0,
    returnedQuantity: 8,
    returnedAmount: 360.00,
    difference: -8,
    differenceAmount: -360.00,
    status: 'discrepancy',
    notes: '已签收待确认回执 | 退货口径差异: 申请10本，按渠道口径批准8本'
  },
  {
    id: 'recon-item-004',
    reconciliationId: 'recon-003',
    shipmentId: 'ship-003',
    bookId: 'book-002',
    shippedQuantity: 100,
    shippedAmount: 3800.00,
    confirmedQuantity: 0,
    confirmedAmount: 0,
    returnedQuantity: 0,
    returnedAmount: 0,
    difference: 100,
    differenceAmount: 3800.00,
    status: 'discrepancy',
    notes: '回执丢失，待跟进确认'
  }
];

const getInitActivityLogs = () => [
  {
    id: 'log-001',
    entityType: 'shipment',
    entityId: 'ship-001',
    action: 'create',
    oldStatus: null,
    newStatus: 'pending',
    description: '创建样书寄送单 SS20240501001',
    createdBy: 'user-002',
    timestamp: new Date('2024-05-01 10:00:00')
  },
  {
    id: 'log-002',
    entityType: 'shipment',
    entityId: 'ship-001',
    action: 'ship',
    oldStatus: 'pending',
    newStatus: 'shipped',
    description: '已发货，顺丰速运 SF1234567890123',
    createdBy: 'user-002',
    timestamp: new Date('2024-05-01 14:30:00')
  },
  {
    id: 'log-003',
    entityType: 'shipment',
    entityId: 'ship-001',
    action: 'deliver',
    oldStatus: 'shipped',
    newStatus: 'delivered',
    description: '物流显示已签收',
    createdBy: 'user-002',
    timestamp: new Date('2024-05-03 09:15:00')
  },
  {
    id: 'log-004',
    entityType: 'shipment',
    entityId: 'ship-001',
    action: 'confirm',
    oldStatus: 'delivered',
    newStatus: 'confirmed',
    description: '渠道经理确认回执，数量无误',
    createdBy: 'user-001',
    timestamp: new Date('2024-05-05 16:00:00')
  },
  {
    id: 'log-005',
    entityType: 'feedback',
    entityId: 'fb-001',
    action: 'create',
    oldStatus: null,
    newStatus: 'draft',
    description: '创建渠道反馈单 FB20240505001',
    createdBy: 'user-001',
    timestamp: new Date('2024-05-05 16:30:00')
  },
  {
    id: 'log-006',
    entityType: 'feedback',
    entityId: 'fb-001',
    action: 'submit',
    oldStatus: 'draft',
    newStatus: 'submitted',
    description: '提交渠道反馈',
    createdBy: 'user-001',
    timestamp: new Date('2024-05-05 17:00:00')
  },
  {
    id: 'log-007',
    entityType: 'shipment',
    entityId: 'ship-003',
    action: 'mark_lost',
    oldStatus: 'delivered',
    newStatus: 'receipt_lost',
    description: '标记回执丢失，需跟进处理',
    createdBy: 'user-002',
    timestamp: new Date('2024-05-12 11:00:00')
  },
  {
    id: 'log-008',
    entityType: 'return',
    entityId: 'ret-001',
    action: 'approve',
    oldStatus: 'pending',
    newStatus: 'approved',
    description: '退货申请已批准，同意退回8本',
    createdBy: 'user-002',
    timestamp: new Date('2024-05-17 10:00:00')
  }
];

module.exports = {
  getInitUsers,
  getInitBooks,
  getInitChannels,
  getInitShipments,
  getInitFeedbacks,
  getInitReturns,
  getInitReconciliations,
  getInitReconciliationItems,
  getInitActivityLogs
};
