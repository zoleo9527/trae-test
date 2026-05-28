import { nanoid } from 'nanoid'
import type { Order, SplitOrder, Receipt, Refund, OrderVersion, OrderItem, TimelineEvent, Role } from '../types'

const now = new Date()
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000)

const createItems = (): OrderItem[] => [
  { id: nanoid(), name: '定制马克杯', spec: '350ml 陶瓷 白色', quantity: 500, unitPrice: 28, category: '杯具' },
  { id: nanoid(), name: '商务笔记本', spec: 'A5 皮面 烫金', quantity: 300, unitPrice: 45, category: '文具' },
  { id: nanoid(), name: '定制U盘', spec: '32G 金属外壳', quantity: 200, unitPrice: 68, category: '数码' },
  { id: nanoid(), name: '礼品袋', spec: '25*35cm 铜版纸', quantity: 1000, unitPrice: 5, category: '包装' },
]

const createVersion = (orderId: string, versionNo: number, items: OrderItem[], needsReview = false, overrideReason?: string): OrderVersion => ({
  id: nanoid(),
  orderId,
  versionNo,
  content: `第${versionNo}版设计方案，包含客户确认的logo位置和配色`,
  confirmedBy: versionNo === 1 ? '张跟单' : '李跟单',
  isCurrent: true,
  needsReview,
  overrideReason,
  createdAt: daysAgo(15 - versionNo * 3),
  items,
})

export const mockOrders: Order[] = [
  {
    id: 'ord-001',
    orderNo: 'GFT-2024-0528-001',
    customerName: '科技创新有限公司',
    contactPhone: '13800138001',
    status: 'split',
    createdBy: '张跟单',
    createdAt: daysAgo(15),
    updatedAt: hoursAgo(4),
    items: createItems(),
    versions: [createVersion('ord-001', 1, createItems())],
    needsReview: false,
  },
  {
    id: 'ord-002',
    orderNo: 'GFT-2024-0528-002',
    customerName: '金融服务集团',
    contactPhone: '13800138002',
    status: 'rejected',
    createdBy: '张跟单',
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(24),
    items: createItems(),
    versions: [createVersion('ord-002', 1, createItems())],
    needsReview: false,
    rejectionReason: '报价超出客户预算，需要重新核算成本',
  },
  {
    id: 'ord-003',
    orderNo: 'GFT-2024-0528-003',
    customerName: '教育培训中心',
    contactPhone: '13800138003',
    status: 'confirmed',
    createdBy: '李跟单',
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(2),
    items: createItems(),
    versions: [
      { ...createVersion('ord-003', 1, createItems()), isCurrent: false, createdAt: daysAgo(10) },
      createVersion('ord-003', 2, createItems().map(i => ({ ...i, quantity: i.quantity + 100 })), true, '客户临时加量20%，原版本已覆盖'),
    ],
    needsReview: true,
    reviewReason: '版本被覆盖，需确认变更影响',
  },
  {
    id: 'ord-004',
    orderNo: 'GFT-2024-0528-004',
    customerName: '医疗健康科技',
    contactPhone: '13800138004',
    status: 'scheduled',
    createdBy: '张跟单',
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(8),
    items: createItems(),
    versions: [createVersion('ord-004', 1, createItems())],
    needsReview: false,
  },
  {
    id: 'ord-005',
    orderNo: 'GFT-2024-0528-005',
    customerName: '房地产开发公司',
    contactPhone: '13800138005',
    status: 'shipped',
    createdBy: '李跟单',
    createdAt: daysAgo(20),
    updatedAt: hoursAgo(48),
    items: createItems(),
    versions: [createVersion('ord-005', 1, createItems())],
    needsReview: false,
  },
  {
    id: 'ord-006',
    orderNo: 'GFT-2024-0528-006',
    customerName: '互联网科技公司',
    contactPhone: '13800138006',
    status: 'sampling',
    createdBy: '张跟单',
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(12),
    items: createItems(),
    versions: [],
    needsReview: false,
  },
]

export const mockSplits: SplitOrder[] = [
  {
    id: 'split-001',
    orderId: 'ord-001',
    splitNo: 'GFT-2024-0528-001-S01',
    items: [
      { id: nanoid(), orderItemId: mockOrders[0].items[0].id, name: '定制马克杯', spec: '350ml 陶瓷 白色', quantity: 300, category: '杯具' },
    ],
    status: 'shipped',
    trackingNo: 'SF1234567890',
    shippedBy: '王仓管',
    shippedAt: daysAgo(3),
    createdAt: daysAgo(5),
  },
  {
    id: 'split-002',
    orderId: 'ord-001',
    splitNo: 'GFT-2024-0528-001-S02',
    items: [
      { id: nanoid(), orderItemId: mockOrders[0].items[0].id, name: '定制马克杯', spec: '350ml 陶瓷 白色', quantity: 200, category: '杯具' },
      { id: nanoid(), orderItemId: mockOrders[0].items[1].id, name: '商务笔记本', spec: 'A5 皮面 烫金', quantity: 300, category: '文具' },
    ],
    status: 'pending',
    createdAt: daysAgo(5),
    missingWarning: true,
  },
  {
    id: 'split-003',
    orderId: 'ord-005',
    splitNo: 'GFT-2024-0528-005-S01',
    items: [
      { id: nanoid(), orderItemId: mockOrders[4].items[0].id, name: '定制马克杯', spec: '350ml 陶瓷 白色', quantity: 500, category: '杯具' },
      { id: nanoid(), orderItemId: mockOrders[4].items[1].id, name: '商务笔记本', spec: 'A5 皮面 烫金', quantity: 300, category: '文具' },
      { id: nanoid(), orderItemId: mockOrders[4].items[2].id, name: '定制U盘', spec: '32G 金属外壳', quantity: 200, category: '数码' },
      { id: nanoid(), orderItemId: mockOrders[4].items[3].id, name: '礼品袋', spec: '25*35cm 铜版纸', quantity: 1000, category: '包装' },
    ],
    status: 'shipped',
    trackingNo: 'YT9876543210',
    shippedBy: '赵仓管',
    shippedAt: daysAgo(7),
    createdAt: daysAgo(10),
  },
]

export const mockReceipts: Receipt[] = [
  {
    id: 'receipt-001',
    splitId: 'split-001',
    status: 'signed',
    signedBy: '刘经理',
    signedAt: daysAgo(2),
    createdAt: daysAgo(2),
  },
  {
    id: 'receipt-002',
    splitId: 'split-003',
    status: 'exception',
    signedBy: '陈主任',
    signedAt: daysAgo(5),
    exceptionNote: '外包装破损，内部有20个马克杯碎裂，已拍照留证',
    photos: ['photo1.jpg', 'photo2.jpg'],
    createdAt: daysAgo(5),
  },
]

export const mockRefunds: Refund[] = [
  {
    id: 'refund-001',
    orderId: 'ord-005',
    splitId: 'split-003',
    amount: 560,
    reason: '物流破损导致20个马克杯碎裂，客户要求退款',
    responsibilityChainId: 'resp-001',
    status: 'finance_approved',
    financeOpinion: '情况属实，同意退款',
    financeApprovedBy: '财务小王',
    financeApprovedAt: daysAgo(3),
    createdBy: '李跟单',
    createdAt: daysAgo(4),
  },
]

export const mockResponsibilityChains = [
  {
    id: 'resp-001',
    type: 'logistics_damage' as const,
    description: '物流运输过程中包裹跌落导致破损',
    responsiblePerson: '物流承运商',
    relatedRecordId: 'split-003',
    relatedRecordType: 'split' as const,
  },
]

export const mockTimeline: TimelineEvent[] = [
  {
    id: 'tl-001',
    type: 'order_create',
    orderId: 'ord-001',
    title: '订单创建',
    description: '科技创新有限公司礼品订单创建，包含4类定制礼品',
    operator: '张跟单',
    timestamp: daysAgo(15),
  },
  {
    id: 'tl-002',
    type: 'version_confirm',
    orderId: 'ord-001',
    title: '打样确认',
    description: '客户确认V1版设计方案，logo位置和配色已锁定',
    operator: '张跟单',
    timestamp: daysAgo(12),
  },
  {
    id: 'tl-003',
    type: 'order_schedule',
    orderId: 'ord-001',
    title: '排期确认',
    description: '工厂排期完成，预计10个工作日内生产完毕',
    operator: '李跟单',
    timestamp: daysAgo(10),
  },
  {
    id: 'tl-004',
    type: 'split_create',
    orderId: 'ord-001',
    splitId: 'split-001',
    title: '拆单发货S01',
    description: '拆分为两个子单发货，S01单包含300个马克杯',
    operator: '王仓管',
    timestamp: daysAgo(5),
  },
  {
    id: 'tl-005',
    type: 'split_ship',
    orderId: 'ord-001',
    splitId: 'split-001',
    title: 'S01单发货',
    description: '顺丰速运 SF1234567890 已发出',
    operator: '王仓管',
    timestamp: daysAgo(3),
  },
  {
    id: 'tl-006',
    type: 'receipt_sign',
    orderId: 'ord-001',
    splitId: 'split-001',
    title: 'S01单签收',
    description: '刘经理正常签收，无异常',
    operator: '刘经理',
    timestamp: daysAgo(2),
  },
  {
    id: 'tl-007',
    type: 'split_create',
    orderId: 'ord-001',
    splitId: 'split-002',
    title: '拆单发货S02',
    description: 'S02单包含200个马克杯和300个笔记本',
    operator: '王仓管',
    timestamp: daysAgo(5),
    isException: true,
    needsReview: true,
  },
  {
    id: 'tl-008',
    type: 'version_override',
    orderId: 'ord-003',
    title: '版本覆盖',
    description: '客户临时加量20%，原版本已被覆盖',
    operator: '李跟单',
    timestamp: hoursAgo(2),
    isException: true,
    needsReview: true,
    metadata: { oldVersion: 1, newVersion: 2 },
  },
  {
    id: 'tl-009',
    type: 'receipt_exception',
    orderId: 'ord-005',
    splitId: 'split-003',
    title: '签收异常',
    description: '外包装破损，20个马克杯碎裂',
    operator: '陈主任',
    timestamp: daysAgo(5),
    isException: true,
    needsReview: true,
  },
  {
    id: 'tl-010',
    type: 'refund_create',
    orderId: 'ord-005',
    refundId: 'refund-001',
    title: '退款申请',
    description: '申请退款560元，责任方为物流承运商',
    operator: '李跟单',
    timestamp: daysAgo(4),
  },
  {
    id: 'tl-011',
    type: 'refund_approve',
    orderId: 'ord-005',
    refundId: 'refund-001',
    title: '财务审核通过',
    description: '财务小王审核通过，待管理层确认',
    operator: '财务小王',
    timestamp: daysAgo(3),
  },
]

export const getRolePermissions = (role: Role) => ({
  canCreateOrder: role === 'merchandiser' || role === 'manager',
  canEditOrder: role === 'merchandiser' || role === 'manager',
  canSplitOrder: role === 'warehouse' || role === 'manager',
  canConfirmShip: role === 'warehouse' || role === 'manager',
  canEnterReceipt: role === 'merchandiser' || role === 'warehouse' || role === 'manager',
  canCreateRefund: role === 'merchandiser' || role === 'manager',
  canApproveRefundFinance: role === 'finance' || role === 'manager',
  canApproveRefundManager: role === 'manager',
  canViewReview: role !== 'merchandiser' || true,
  canExport: role === 'manager',
})

export const initializeMockData = () => {
  const initializedKey = 'gift-system-initialized'
  if (localStorage.getItem(initializedKey)) {
    return
  }
  localStorage.setItem(initializedKey, 'true')
}
