import type { SuppliesApplication, Supplier } from '@/types'

export const mockSuppliers: Supplier[] = [
  {
    id: 's1',
    name: '上海海洋食品供应有限公司',
    contact: '陈经理',
    phone: '13800138001',
    category: ['provisions', 'medical'],
    rating: 4.8,
    lastCooperation: '2024-01-15'
  },
  {
    id: 's2',
    name: '广州船舶设备配件中心',
    contact: '刘总',
    phone: '13900139002',
    category: ['engine', 'deck'],
    rating: 4.5,
    lastCooperation: '2024-01-10'
  },
  {
    id: 's3',
    name: '深圳海事文件代理',
    contact: '王小姐',
    phone: '13700137003',
    category: ['documents'],
    rating: 4.9,
    lastCooperation: '2024-01-18'
  },
  {
    id: 's4',
    name: '青岛综合物资供应',
    contact: '赵经理',
    phone: '13600136004',
    category: ['provisions', 'deck', 'other'],
    rating: 4.2,
    lastCooperation: '2023-12-20'
  }
]

export const mockApplications: SuppliesApplication[] = [
  {
    id: 'app1',
    applicationNo: 'SP-2024-001',
    vesselName: '远洋号',
    port: '上海港',
    berthDate: '2024-01-25',
    departureDate: '2024-01-28',
    applicantId: '2',
    applicantName: '李强',
    items: [
      { id: 'item1', name: '大米', category: 'provisions', quantity: 500, unit: 'kg', urgency: 'normal' },
      { id: 'item2', name: '食用油', category: 'provisions', quantity: 200, unit: 'L', urgency: 'normal' },
      { id: 'item3', name: '柴油滤芯', category: 'engine', quantity: 10, unit: '个', specification: '型号: FH236', urgency: 'urgent' }
    ],
    totalAmount: 28500,
    status: 'pending_review',
    currentHandlerId: '1',
    currentHandlerName: '张明',
    documents: [
      { id: 'doc1', name: '船舶检疫证', type: 'quarantine', deadline: '2024-01-24', status: 'pending', reminderDays: [7, 3, 1] },
      { id: 'doc2', name: '海关报关单', type: 'customs', deadline: '2024-01-26', status: 'pending', reminderDays: [5, 2] }
    ],
    advancePayment: 14250,
    paymentStatus: 'unpaid',
    paymentDueDate: '2024-01-23',
    comments: [
      { id: 'c1', userId: '2', userName: '李强', userRole: 'coordinator', content: '申请提交，预计1月25日靠泊后需要补给', timestamp: '2024-01-20 09:30:00', type: 'system' },
      { id: 'c2', userId: '2', userName: '李强', userRole: 'coordinator', content: '柴油滤芯务必在靠泊前准备好，船舶有故障需要更换', timestamp: '2024-01-20 09:35:00', type: 'comment' }
    ],
    statusHistory: [
      { id: 'h1', status: 'draft', timestamp: '2024-01-19 14:00:00', userId: '2', userName: '李强', remark: '创建申请' },
      { id: 'h2', status: 'pending_review', timestamp: '2024-01-20 09:30:00', userId: '2', userName: '李强', remark: '提交审核' }
    ],
    createdAt: '2024-01-19 14:00:00',
    updatedAt: '2024-01-20 09:35:00'
  },
  {
    id: 'app2',
    applicationNo: 'SP-2024-002',
    vesselName: '星辰号',
    port: '广州港',
    berthDate: '2024-01-22',
    departureDate: '2024-01-24',
    applicantId: '2',
    applicantName: '李强',
    items: [
      { id: 'item4', name: '救生衣', category: 'deck', quantity: 30, unit: '件', urgency: 'critical' },
      { id: 'item5', name: '急救箱', category: 'medical', quantity: 5, unit: '套', urgency: 'normal' }
    ],
    totalAmount: 15600,
    status: 'in_progress',
    currentHandlerId: '2',
    currentHandlerName: '李强',
    supplierId: 's1',
    supplierName: '上海海洋食品供应有限公司',
    documents: [
      { id: 'doc3', name: '船舶安全检查证', type: 'safety', deadline: '2024-01-21', status: 'received', reminderDays: [3] }
    ],
    advancePayment: 7800,
    actualPayment: 7800,
    paymentStatus: 'partial',
    paymentDueDate: '2024-01-20',
    comments: [
      { id: 'c3', userId: '1', userName: '张明', userRole: 'manager', content: '审核通过，注意救生衣是紧急需求', timestamp: '2024-01-18 10:00:00', type: 'system' },
      { id: 'c4', userId: '1', userName: '张明', userRole: 'manager', content: '已分配给上海海洋食品供应，他们的救生衣质量较好', timestamp: '2024-01-18 10:15:00', type: 'comment' },
      { id: 'c5', userId: '3', userName: '王芳', userRole: 'clerk', content: '已收到预付款水单，正在走付款流程', timestamp: '2024-01-19 16:00:00', type: 'comment' },
      { id: 'c6', userId: '2', userName: '李强', userRole: 'coordinator', content: '供应商已确认，预计明天上午送货到码头', timestamp: '2024-01-21 08:30:00', type: 'comment' }
    ],
    statusHistory: [
      { id: 'h3', status: 'draft', timestamp: '2024-01-17 09:00:00', userId: '2', userName: '李强', remark: '创建申请' },
      { id: 'h4', status: 'pending_review', timestamp: '2024-01-17 15:00:00', userId: '2', userName: '李强', remark: '提交审核' },
      { id: 'h5', status: 'reviewed', timestamp: '2024-01-18 10:00:00', userId: '1', userName: '张明', remark: '审核通过' },
      { id: 'h6', status: 'supplier_assigned', timestamp: '2024-01-18 10:15:00', userId: '1', userName: '张明', remark: '分配供应商' },
      { id: 'h7', status: 'in_progress', timestamp: '2024-01-19 16:30:00', userId: '3', userName: '王芳', remark: '预付款已付，开始执行' }
    ],
    createdAt: '2024-01-17 09:00:00',
    updatedAt: '2024-01-21 08:30:00'
  },
  {
    id: 'app3',
    applicationNo: 'SP-2024-003',
    vesselName: '东方号',
    port: '深圳港',
    berthDate: '2024-01-30',
    departureDate: '2024-02-02',
    applicantId: '2',
    applicantName: '李强',
    items: [
      { id: 'item6', name: '液压油', category: 'engine', quantity: 500, unit: 'L', specification: '型号: ISO VG46', urgency: 'normal' },
      { id: 'item7', name: '缆绳', category: 'deck', quantity: 200, unit: 'm', specification: '直径50mm', urgency: 'normal' }
    ],
    totalAmount: 42000,
    status: 'rejected',
    currentHandlerId: '2',
    currentHandlerName: '李强',
    documents: [
      { id: 'doc4', name: '危险品申报单', type: 'dangerous', deadline: '2024-01-28', status: 'pending', reminderDays: [5, 2] }
    ],
    advancePayment: 21000,
    paymentStatus: 'unpaid',
    comments: [
      { id: 'c7', userId: '2', userName: '李强', userRole: 'coordinator', content: '申请提交', timestamp: '2024-01-20 11:00:00', type: 'system' },
      { id: 'c8', userId: '1', userName: '张明', userRole: 'manager', content: '驳回原因：液压油规格需要确认是否与船舶系统匹配，请重新核实后提交。缆绳数量过多，请与船长确认实际需求。', timestamp: '2024-01-20 16:00:00', type: 'reject' }
    ],
    statusHistory: [
      { id: 'h8', status: 'draft', timestamp: '2024-01-20 10:00:00', userId: '2', userName: '李强', remark: '创建申请' },
      { id: 'h9', status: 'pending_review', timestamp: '2024-01-20 11:00:00', userId: '2', userName: '李强', remark: '提交审核' },
      { id: 'h10', status: 'rejected', timestamp: '2024-01-20 16:00:00', userId: '1', userName: '张明', remark: '审核驳回' }
    ],
    createdAt: '2024-01-20 10:00:00',
    updatedAt: '2024-01-20 16:00:00'
  },
  {
    id: 'app4',
    applicationNo: 'SP-2024-004',
    vesselName: '海航号',
    port: '青岛港',
    berthDate: '2024-01-18',
    departureDate: '2024-01-20',
    applicantId: '2',
    applicantName: '李强',
    items: [
      { id: 'item8', name: '蔬菜肉类', category: 'provisions', quantity: 300, unit: 'kg', urgency: 'normal' },
      { id: 'item9', name: '淡水', category: 'other', quantity: 50, unit: '吨', urgency: 'normal' }
    ],
    totalAmount: 8500,
    status: 'paid',
    supplierId: 's4',
    supplierName: '青岛综合物资供应',
    documents: [
      { id: 'doc5', name: '食品检验检疫证', type: 'food', deadline: '2024-01-18', status: 'received', reminderDays: [3] }
    ],
    advancePayment: 4250,
    actualPayment: 8500,
    paymentStatus: 'paid',
    comments: [
      { id: 'c9', userId: '2', userName: '李强', userRole: 'coordinator', content: '物资已全部上船，确认无误', timestamp: '2024-01-18 18:00:00', type: 'comment' },
      { id: 'c10', userId: '3', userName: '王芳', userRole: 'clerk', content: '已收到发票，尾款已支付，流程完成', timestamp: '2024-01-20 14:00:00', type: 'system' }
    ],
    statusHistory: [
      { id: 'h11', status: 'draft', timestamp: '2024-01-15 09:00:00', userId: '2', userName: '李强', remark: '创建申请' },
      { id: 'h12', status: 'pending_review', timestamp: '2024-01-15 14:00:00', userId: '2', userName: '李强', remark: '提交审核' },
      { id: 'h13', status: 'reviewed', timestamp: '2024-01-16 09:00:00', userId: '1', userName: '张明', remark: '审核通过' },
      { id: 'h14', status: 'supplier_assigned', timestamp: '2024-01-16 10:00:00', userId: '1', userName: '张明', remark: '分配供应商' },
      { id: 'h15', status: 'in_progress', timestamp: '2024-01-16 15:00:00', userId: '3', userName: '王芳', remark: '预付款已付' },
      { id: 'h16', status: 'completed', timestamp: '2024-01-18 18:00:00', userId: '2', userName: '李强', remark: '补给完成' },
      { id: 'h17', status: 'paid', timestamp: '2024-01-20 14:00:00', userId: '3', userName: '王芳', remark: '款项结清' }
    ],
    createdAt: '2024-01-15 09:00:00',
    updatedAt: '2024-01-20 14:00:00'
  },
  {
    id: 'app5',
    applicationNo: 'SP-2024-005',
    vesselName: '长江号',
    port: '上海港',
    berthDate: '2024-02-05',
    departureDate: '2024-02-08',
    applicantId: '2',
    applicantName: '李强',
    items: [
      { id: 'item10', name: '主机备件', category: 'engine', quantity: 1, unit: '套', specification: 'MAN B&W 6S50MC-C', urgency: 'critical' },
      { id: 'item11', name: '船员用品', category: 'provisions', quantity: 50, unit: '套', urgency: 'normal' }
    ],
    totalAmount: 125000,
    status: 'supplier_assigned',
    currentHandlerId: '3',
    currentHandlerName: '王芳',
    supplierId: 's2',
    supplierName: '广州船舶设备配件中心',
    documents: [
      { id: 'doc6', name: '进口许可证', type: 'import', deadline: '2024-02-01', status: 'pending', reminderDays: [10, 5, 2] },
      { id: 'doc7', name: '商检证明', type: 'inspection', deadline: '2024-02-03', status: 'pending', reminderDays: [5] }
    ],
    advancePayment: 62500,
    paymentStatus: 'unpaid',
    paymentDueDate: '2024-01-28',
    comments: [
      { id: 'c11', userId: '2', userName: '李强', userRole: 'coordinator', content: '主机备件为紧急需求，船舶停靠期间必须更换，否则影响后续航程', timestamp: '2024-01-21 08:00:00', type: 'reminder' },
      { id: 'c12', userId: '1', userName: '张明', userRole: 'manager', content: '加急处理，已安排广州船舶设备配件中心调货，预计2月1日前到货', timestamp: '2024-01-21 11:00:00', type: 'comment' }
    ],
    statusHistory: [
      { id: 'h18', status: 'draft', timestamp: '2024-01-20 16:00:00', userId: '2', userName: '李强', remark: '创建申请' },
      { id: 'h19', status: 'pending_review', timestamp: '2024-01-21 08:00:00', userId: '2', userName: '李强', remark: '提交审核' },
      { id: 'h20', status: 'reviewed', timestamp: '2024-01-21 10:00:00', userId: '1', userName: '张明', remark: '审核通过(加急)' },
      { id: 'h21', status: 'supplier_assigned', timestamp: '2024-01-21 11:00:00', userId: '1', userName: '张明', remark: '分配供应商' }
    ],
    createdAt: '2024-01-20 16:00:00',
    updatedAt: '2024-01-21 11:00:00'
  }
]
