import type { RoleInfo, Order, AfterSalesTicket, SampleLending } from '../types'

export const roles: RoleInfo[] = [
  {
    id: 'manager',
    name: '展厅经理',
    description: '查看全局进度、审批赔付方案、协调跨角色冲突',
    color: '#6366f1'
  },
  {
    id: 'consultant',
    name: '销售顾问',
    description: '处理售后工单、与客户沟通补件与赔付、确认样品回收',
    color: '#10b981'
  },
  {
    id: 'coordinator',
    name: '安装协调',
    description: '追踪安装进度、确认补件到场、回查历史记录',
    color: '#f59e0b'
  }
]

export const mockOrders: Order[] = [
  {
    id: 'o-001',
    orderNo: 'DD-20260418-001',
    customer: {
      id: 'c-001',
      name: '张女士',
      phone: '138****2345',
      address: '上海市浦东新区世纪大道1000号 7号楼 1202'
    },
    items: [
      { id: 'oi-001', name: '北欧风三人沙发', sku: 'SF-NORDIC-003', quantity: 1, unitPrice: 12800, note: '客户要求浅灰色' },
      { id: 'oi-002', name: '原木茶几', sku: 'TB-WOOD-012', quantity: 1, unitPrice: 3200, note: '' },
      { id: 'oi-003', name: '边柜', sku: 'CB-WOOD-008', quantity: 1, unitPrice: 4500, note: '需要胡桃木色' }
    ],
    status: 'after_sales',
    statusHistory: [
      { status: 'customizing', changedAt: '2026-04-18 10:30', changedBy: '销售-李明', note: '合同签订，进入定制生产' },
      { status: 'arriving', changedAt: '2026-05-08 14:20', changedBy: '仓储-王强', note: '货物到达仓库，等待发货' },
      { status: 'installing', changedAt: '2026-05-12 09:00', changedBy: '协调-赵芳', note: '预约安装，安装队已到现场' },
      { status: 'after_sales', changedAt: '2026-05-14 16:45', changedBy: '销售-李明', note: '客户反馈沙发靠垫破损，启动售后' }
    ],
    contractDate: '2026-04-18',
    expectedDelivery: '2026-05-08',
    actualDelivery: '2026-05-08',
    installDate: '2026-05-12',
    salesConsultant: '李明',
    coordinator: '赵芳',
    manager: '陈经理',
    totalAmount: 20500,
    afterSalesTickets: [],
    sampleLendings: [],
    notes: [
      '客户对颜色搭配很挑剔，反复确认过三次',
      '安装当天客户不在，由其母亲在场验收',
      '破损发生在运输途中，已拍照留证'
    ]
  },
  {
    id: 'o-002',
    orderNo: 'DD-20260422-002',
    customer: {
      id: 'c-002',
      name: '刘先生',
      phone: '139****6789',
      address: '杭州市西湖区文三路 88号 绿城玫瑰园 5栋'
    },
    items: [
      { id: 'oi-004', name: '意式极简餐桌', sku: 'TB-ITALY-005', quantity: 1, unitPrice: 15600, note: '1.8米白色大理石台面' },
      { id: 'oi-005', name: '餐椅', sku: 'CH-ITALY-005', quantity: 6, unitPrice: 1800, note: '客户要求皮面升级' }
    ],
    status: 'installing',
    statusHistory: [
      { status: 'customizing', changedAt: '2026-04-22 11:00', changedBy: '销售-周琳', note: '签约定制，皮面升级需加价' },
      { status: 'arriving', changedAt: '2026-05-10 16:30', changedBy: '仓储-王强', note: '到货，餐椅皮面升级确认完成' },
      { status: 'installing', changedAt: '2026-05-15 08:30', changedBy: '协调-赵芳', note: '开始安装' }
    ],
    contractDate: '2026-04-22',
    expectedDelivery: '2026-05-10',
    actualDelivery: '2026-05-10',
    installDate: '2026-05-15',
    salesConsultant: '周琳',
    coordinator: '赵芳',
    manager: '陈经理',
    totalAmount: 26400,
    afterSalesTickets: [],
    sampleLendings: [],
    notes: [
      '客户曾借餐桌样块确认纹理，样品借出未归还'
    ]
  },
  {
    id: 'o-003',
    orderNo: 'DD-20260425-003',
    customer: {
      id: 'c-003',
      name: '陈女士',
      phone: '137****1122',
      address: '南京市鼓楼区中山北路 200号 长江花园 3栋 801'
    },
    items: [
      { id: 'oi-006', name: '美式书柜', sku: 'BK-AMER-002', quantity: 1, unitPrice: 9800, note: '需要定制高度2.4m' },
      { id: 'oi-007', name: '书桌', sku: 'DK-AMER-002', quantity: 1, unitPrice: 4200, note: '' }
    ],
    status: 'completed',
    statusHistory: [
      { status: 'customizing', changedAt: '2026-04-25 15:00', changedBy: '销售-李明', note: '签订合同' },
      { status: 'arriving', changedAt: '2026-05-05 10:00', changedBy: '仓储-王强', note: '到货入库' },
      { status: 'installing', changedAt: '2026-05-07 09:00', changedBy: '协调-孙浩', note: '安装中' },
      { status: 'completed', changedAt: '2026-05-09 17:30', changedBy: '销售-李明', note: '客户验收通过，已完成' }
    ],
    contractDate: '2026-04-25',
    expectedDelivery: '2026-05-05',
    actualDelivery: '2026-05-05',
    installDate: '2026-05-07',
    salesConsultant: '李明',
    coordinator: '孙浩',
    manager: '陈经理',
    totalAmount: 14000,
    afterSalesTickets: [],
    sampleLendings: [],
    notes: [
      '客户非常满意，已推荐朋友'
    ]
  },
  {
    id: 'o-004',
    orderNo: 'DD-20260501-004',
    customer: {
      id: 'c-004',
      name: '王先生',
      phone: '135****9988',
      address: '苏州市工业园区星海街 188号 11栋 1503'
    },
    items: [
      { id: 'oi-008', name: '儿童房上下铺', sku: 'CB-KIDS-001', quantity: 1, unitPrice: 8500, note: '带滑梯' },
      { id: 'oi-009', name: '儿童书桌', sku: 'DK-KIDS-001', quantity: 1, unitPrice: 3200, note: '可调节高度' }
    ],
    status: 'after_sales',
    statusHistory: [
      { status: 'customizing', changedAt: '2026-05-01 10:00', changedBy: '销售-周琳', note: '签订合同' },
      { status: 'arriving', changedAt: '2026-05-18 14:00', changedBy: '仓储-王强', note: '货物到达' },
      { status: 'installing', changedAt: '2026-05-20 09:00', changedBy: '协调-赵芳', note: '安装开始' },
      { status: 'after_sales', changedAt: '2026-05-22 11:00', changedBy: '销售-周琳', note: '客户发现滑梯有划痕，启动售后' }
    ],
    contractDate: '2026-05-01',
    expectedDelivery: '2026-05-18',
    actualDelivery: '2026-05-18',
    installDate: '2026-05-20',
    salesConsultant: '周琳',
    coordinator: '赵芳',
    manager: '陈经理',
    totalAmount: 11700,
    afterSalesTickets: [],
    sampleLendings: [],
    notes: [
      '滑梯划痕为出厂问题，非运输损坏',
      '客户要求免费更换或赔偿500元'
    ]
  },
  {
    id: 'o-005',
    orderNo: 'DD-20260510-005',
    customer: {
      id: 'c-005',
      name: '黄先生',
      phone: '136****3344',
      address: '上海市闵行区虹桥路 1234号 5栋 202'
    },
    items: [
      { id: 'oi-010', name: '北欧双人床', sku: 'BD-NORDIC-002', quantity: 1, unitPrice: 6800, note: '1.8米' },
      { id: 'oi-011', name: '床头柜', sku: 'NS-NORDIC-002', quantity: 2, unitPrice: 1200, note: '' }
    ],
    status: 'arriving',
    statusHistory: [
      { status: 'customizing', changedAt: '2026-05-10 16:00', changedBy: '销售-李明', note: '合同签订' },
      { status: 'arriving', changedAt: '2026-05-24 10:00', changedBy: '仓储-王强', note: '到货，等待安装预约' }
    ],
    contractDate: '2026-05-10',
    expectedDelivery: '2026-05-24',
    actualDelivery: '2026-05-24',
    installDate: null,
    salesConsultant: '李明',
    coordinator: '孙浩',
    manager: '陈经理',
    totalAmount: 9200,
    afterSalesTickets: [],
    sampleLendings: [],
    notes: []
  }
]

export const mockAfterSalesTickets: AfterSalesTicket[] = [
  {
    id: 't-001',
    orderId: 'o-001',
    type: 'supplementary',
    status: 'processing',
    title: '沙发靠垫破损需补发',
    description: '客户张女士反馈，北欧风三人沙发的左侧靠垫在安装时发现内部填充物外露，疑似运输途中被锐物划破。',
    createdBy: '销售-李明',
    createdAt: '2026-05-14 16:45',
    updatedAt: '2026-05-16 10:20',
    assignee: '销售-李明',
    priority: 'high',
    parts: [
      {
        id: 'p-001',
        name: '沙发左侧靠垫',
        sku: 'SF-NORDIC-003-CUSHION-L',
        reason: '运输破损',
        quantity: 1,
        confirmed: true,
        confirmedBy: '仓储-王强',
        confirmedAt: '2026-05-15 09:30',
        note: '已确认库存有货，预计2026-05-18可发出'
      },
      {
        id: 'p-002',
        name: '沙发扶手防护套',
        sku: 'SF-NORDIC-003-COVER',
        reason: '配套补发',
        quantity: 1,
        confirmed: false,
        confirmedBy: null,
        confirmedAt: null,
        note: '客户要求附带防护套防止二次破损，需确认是否属于免费补发范围'
      }
    ],
    compensation: null,
    history: [
      { action: '创建工单', by: '销售-李明', at: '2026-05-14 16:45', detail: '客户电话反馈问题，已拍照留证' },
      { action: '确认补件', by: '仓储-王强', at: '2026-05-15 09:30', detail: '确认靠垫库存，可补发' },
      { action: '更新状态', by: '销售-李明', at: '2026-05-16 10:20', detail: '客户追加要求防护套，待内部确认' }
    ],
    relatedOrder: null
  },
  {
    id: 't-002',
    orderId: 'o-004',
    type: 'compensation',
    status: 'processing',
    title: '儿童房滑梯划痕赔偿协商',
    description: '客户王先生反映儿童房滑梯在出厂时已有明显划痕，要求免费更换或赔偿500元。销售评估划痕较深，影响使用体验。',
    createdBy: '销售-周琳',
    createdAt: '2026-05-22 11:00',
    updatedAt: '2026-05-24 15:30',
    assignee: '销售-周琳',
    priority: 'high',
    parts: [],
    compensation: {
      id: 'cmp-001',
      amount: 500,
      reason: '出厂划痕',
      customerRequest: '免费更换滑梯或赔偿500元',
      internalDiscussion: '划痕深度约2mm，位于滑梯中段，不影响安全但影响美观。更换成本约800元，赔偿500元更经济。',
      approvedBy: null,
      approvedAt: null,
      status: 'negotiating'
    },
    history: [
      { action: '创建工单', by: '销售-周琳', at: '2026-05-22 11:00', detail: '客户现场发现划痕，已拍照' },
      { action: '评估', by: '质检-刘工', at: '2026-05-23 14:00', detail: '确认为出厂划痕，非运输或安装造成' },
      { action: '提交赔付方案', by: '销售-周琳', at: '2026-05-24 15:30', detail: '建议赔偿500元，待经理审批' }
    ],
    relatedOrder: null
  },
  {
    id: 't-003',
    orderId: 'o-002',
    type: 'supplementary',
    status: 'confirmed',
    title: '餐椅脚套补发',
    description: '客户刘先生反馈意式极简餐椅有一只脚套缺失，需要补发。',
    createdBy: '销售-周琳',
    createdAt: '2026-05-16 09:00',
    updatedAt: '2026-05-17 14:00',
    assignee: '协调-赵芳',
    priority: 'low',
    parts: [
      {
        id: 'p-003',
        name: '餐椅脚套',
        sku: 'CH-ITALY-005-CAP',
        reason: '缺失',
        quantity: 1,
        confirmed: true,
        confirmedBy: '仓储-王强',
        confirmedAt: '2026-05-17 10:00',
        note: '小件，随下次送货补发'
      }
    ],
    compensation: null,
    history: [
      { action: '创建工单', by: '销售-周琳', at: '2026-05-16 09:00', detail: '客户安装后发现一只脚套缺失' },
      { action: '确认补件', by: '仓储-王强', at: '2026-05-17 10:00', detail: '确认有库存，安排补发' },
      { action: '工单确认', by: '销售-周琳', at: '2026-05-17 14:00', detail: '客户同意随下次送货补发' }
    ],
    relatedOrder: null
  }
]

export const mockSampleLendings: SampleLending[] = [
  {
    id: 'sl-001',
    orderId: 'o-002',
    itemName: '大理石台面样块',
    sku: 'TB-ITALY-005-SAMPLE',
    quantity: 1,
    lentBy: '销售-周琳',
    lentTo: '刘先生',
    lentAt: '2026-04-22 14:00',
    expectedReturn: '2026-04-29',
    returned: false,
    returnedAt: null,
    returnedBy: null,
    returnNote: null,
    note: '客户要求带回家确认纹理是否与装修风格匹配',
    overdue: true,
    history: [
      { action: '借出', by: '销售-周琳', at: '2026-04-22 14:00', detail: '借出大理石台面样块给刘先生，应于4月29日归还' },
      { action: '催还', by: '销售-周琳', at: '2026-05-02 10:00', detail: '电话催促刘先生归还，客户表示下周送回' }
    ]
  },
  {
    id: 'sl-002',
    orderId: 'o-001',
    itemName: '沙发面料样卡',
    sku: 'SF-NORDIC-003-FABRIC',
    quantity: 1,
    lentBy: '销售-李明',
    lentTo: '张女士',
    lentAt: '2026-04-18 11:30',
    expectedReturn: '2026-04-25',
    returned: true,
    returnedAt: '2026-04-23 10:00',
    returnedBy: '销售-李明',
    returnNote: '客户确认颜色为浅灰色，样卡完好归还',
    note: '客户确认颜色后归还',
    overdue: false,
    history: [
      { action: '借出', by: '销售-李明', at: '2026-04-18 11:30', detail: '借出沙发面料样卡给张女士确认颜色' },
      { action: '归还', by: '销售-李明', at: '2026-04-23 10:00', detail: '客户确认颜色为浅灰色，样卡完好归还' }
    ]
  },
  {
    id: 'sl-003',
    orderId: 'o-004',
    itemName: '儿童房木质样块',
    sku: 'CB-KIDS-001-SAMPLE',
    quantity: 1,
    lentBy: '销售-周琳',
    lentTo: '王先生',
    lentAt: '2026-05-01 11:00',
    expectedReturn: '2026-05-08',
    returned: false,
    returnedAt: null,
    returnedBy: null,
    returnNote: null,
    note: '客户带回家给孩子看，一直未归还',
    overdue: true,
    history: [
      { action: '借出', by: '销售-周琳', at: '2026-05-01 11:00', detail: '借出儿童房木质样块给王先生，应于5月8日归还' },
      { action: '催还', by: '销售-周琳', at: '2026-05-15 14:30', detail: '微信联系客户，客户说近期忙，下周末送回' }
    ]
  }
]

export function buildRelations() {
  const orderMap = new Map(mockOrders.map(o => [o.id, o]))

  mockAfterSalesTickets.forEach(ticket => {
    ticket.relatedOrder = orderMap.get(ticket.orderId) || null
    const order = orderMap.get(ticket.orderId)
    if (order) {
      order.afterSalesTickets.push(ticket)
    }
  })

  mockSampleLendings.forEach(lending => {
    const order = orderMap.get(lending.orderId)
    if (order) {
      order.sampleLendings.push(lending)
    }
  })

  return { mockOrders, mockAfterSalesTickets, mockSampleLendings }
}