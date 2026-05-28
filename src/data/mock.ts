import type { Instrument, Customer, Order, Alert } from '@/types'

export const instruments: Instrument[] = [
  { id: 'INST-001', name: '小提琴 #V101', type: 'violin', brand: '雅马哈', status: 'rented', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=violin%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 50 },
  { id: 'INST-002', name: '大提琴 #C201', type: 'cello', brand: '斯特拉迪瓦里', status: 'rented', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cello%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 80 },
  { id: 'INST-003', name: '吉他 #G301', type: 'guitar', brand: '马丁', status: 'available', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=acoustic%20guitar%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 40 },
  { id: 'INST-004', name: '钢琴 #P401', type: 'piano', brand: '卡瓦依', status: 'rented', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grand%20piano%20in%20elegant%20room%20studio%20photo&image_size=square', dailyRate: 200 },
  { id: 'INST-005', name: '长笛 #F501', type: 'flute', brand: '村松', status: 'repairing', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silver%20flute%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 60 },
  { id: 'INST-006', name: '二胡 #E601', type: 'erhu', brand: '敦煌', status: 'available', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=erhu%20Chinese%20instrument%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 45 },
  { id: 'INST-007', name: '架子鼓 #D701', type: 'drum', brand: '罗兰', status: 'rented', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drum%20set%20in%20studio%20dark%20background%20elegant%20photo&image_size=square', dailyRate: 70 },
  { id: 'INST-008', name: '萨克斯 #S801', type: 'saxophone', brand: '塞尔玛', status: 'available', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=saxophone%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 90 },
  { id: 'INST-009', name: '小提琴 #V102', type: 'violin', brand: '雅马哈', status: 'available', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=violin%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 55 },
  { id: 'INST-010', name: '吉他 #G302', type: 'guitar', brand: '泰勒', status: 'rented', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=acoustic%20guitar%20on%20dark%20velvet%20background%20elegant%20studio%20photo&image_size=square', dailyRate: 45 },
]

export const customers: Customer[] = [
  { id: 'CUST-001', name: '张晓明', phone: '138****1234', type: 'individual' },
  { id: 'CUST-002', name: '市第三中学', phone: '010-8888****', type: 'school', schoolName: '市第三中学' },
  { id: 'CUST-003', name: '李思雨', phone: '139****5678', type: 'individual' },
  { id: 'CUST-004', name: '阳光艺术培训中心', phone: '021-6666****', type: 'organization' },
  { id: 'CUST-005', name: '王大力', phone: '137****9012', type: 'individual' },
  { id: 'CUST-006', name: '实验小学', phone: '010-7777****', type: 'school', schoolName: '实验小学' },
  { id: 'CUST-007', name: '赵雅琴', phone: '136****3456', type: 'individual' },
  { id: 'CUST-008', name: '音乐学院附中', phone: '010-5555****', type: 'school', schoolName: '音乐学院附中' },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysLater(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

export const orders: Order[] = [
  {
    id: 'ORD-001', orderNo: 'ORD-2024-0010', instrumentId: 'INST-001', customerId: 'CUST-001',
    status: 'completed', checkoutBy: '李小芳', checkoutAt: daysAgo(30), expectedReturnAt: daysAgo(16),
    actualReturnAt: daysAgo(15), depositAmount: 1500, rentalFee: 700, schoolCooperation: false,
    checkoutPhotos: ['checkout-violin-001.jpg'],
    logs: [
      { id: 'LOG-001', orderId: 'ORD-001', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(30), note: '小提琴租出，状况良好' },
      { id: 'LOG-002', orderId: 'ORD-001', action: '客户归还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(15), note: '按时归还' },
      { id: 'LOG-003', orderId: 'ORD-001', action: '验收通过', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(15), note: '无损坏，验收通过' },
      { id: 'LOG-004', orderId: 'ORD-001', action: '押金退还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(15), note: '全额退还押金1500元' },
    ],
    returnInspection: { id: 'RI-001', orderId: 'ORD-001', inspectedBy: '李小芳', inspectedAt: daysAgo(15), hasDamage: false, damageLevel: 'none', damagePhotos: [], liabilityParty: 'undetermined', isDisputed: false },
    depositSettlement: { id: 'DS-001', orderId: 'ORD-001', originalAmount: 1500, totalDeduction: 700, refundAmount: 800, status: 'completed', approvedBy: '王建国', settledAt: daysAgo(15), deductions: [{ id: 'DI-001', settlementId: 'DS-001', type: 'rental', amount: 700, description: '15天租金', isDisputed: false }] },
  },
  {
    id: 'ORD-002', orderNo: 'ORD-2024-0015', instrumentId: 'INST-002', customerId: 'CUST-002',
    status: 'overdue', checkoutBy: '李小芳', checkoutAt: daysAgo(30), expectedReturnAt: daysAgo(3),
    depositAmount: 3000, rentalFee: 0, schoolCooperation: true,
    schoolPaymentSchedule: [
      { installment: 1, amount: 2000, dueDate: daysAgo(20), paidAt: daysAgo(18), status: 'paid' },
      { installment: 2, amount: 2000, dueDate: daysAgo(5), status: 'overdue' },
      { installment: 3, amount: 2000, dueDate: daysLater(10), status: 'pending' },
    ],
    checkoutPhotos: ['checkout-cello-001.jpg'],
    logs: [
      { id: 'LOG-010', orderId: 'ORD-002', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(30), note: '大提琴租出至市第三中学，学校批量订单' },
      { id: 'LOG-011', orderId: 'ORD-002', action: '回款逾期', operator: '系统', operatorRole: 'boss', operatedAt: daysAgo(5), note: '第二期回款已逾期5天' },
      { id: 'LOG-012', orderId: 'ORD-002', action: '归还超时', operator: '系统', operatorRole: 'boss', operatedAt: daysAgo(3), note: '已超期3天未归还' },
    ],
  },
  {
    id: 'ORD-003', orderNo: 'ORD-2024-0018', instrumentId: 'INST-004', customerId: 'CUST-003',
    status: 'damage_assessing', checkoutBy: '李小芳', checkoutAt: daysAgo(20), expectedReturnAt: daysAgo(6),
    actualReturnAt: daysAgo(5), depositAmount: 5000, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: ['checkout-piano-001.jpg', 'checkout-piano-002.jpg'],
    logs: [
      { id: 'LOG-020', orderId: 'ORD-003', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(20), note: '钢琴租出' },
      { id: 'LOG-021', orderId: 'ORD-003', action: '客户归还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(5), note: '归还时发现琴键损坏' },
      { id: 'LOG-022', orderId: 'ORD-003', action: '损坏标记', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(5), note: '3个白键凹陷，琴盖有划痕，判定为严重损坏' },
    ],
    returnInspection: {
      id: 'RI-003', orderId: 'ORD-003', inspectedBy: '李小芳', inspectedAt: daysAgo(5),
      hasDamage: true, damageLevel: 'severe', damageDescription: '3个白键凹陷无法弹奏，琴盖明显划痕，疑似人为重压',
      damagePhotos: ['damage-piano-001.jpg', 'damage-piano-002.jpg'],
      liabilityParty: 'customer', isDisputed: false,
    },
  },
  {
    id: 'ORD-004', orderNo: 'ORD-2024-0020', instrumentId: 'INST-005', customerId: 'CUST-005',
    status: 'repair_reviewing', checkoutBy: '李小芳', checkoutAt: daysAgo(25), expectedReturnAt: daysAgo(11),
    actualReturnAt: daysAgo(10), depositAmount: 2000, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: ['checkout-flute-001.jpg'],
    logs: [
      { id: 'LOG-030', orderId: 'ORD-004', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(25), note: '长笛租出' },
      { id: 'LOG-031', orderId: 'ORD-004', action: '客户归还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(10), note: '归还时垫片变形' },
      { id: 'LOG-032', orderId: 'ORD-004', action: '损坏判定', operator: '张师傅', operatorRole: 'repair', operatedAt: daysAgo(9), note: '判定为客户责任，垫片人为损坏' },
      { id: 'LOG-033', orderId: 'ORD-004', action: '维修开始', operator: '张师傅', operatorRole: 'repair', operatedAt: daysAgo(9), note: '开始更换垫片' },
      { id: 'LOG-034', orderId: 'ORD-004', action: '维修完成', operator: '张师傅', operatorRole: 'repair', operatedAt: daysAgo(4), note: '垫片更换完成' },
      { id: 'LOG-035', orderId: 'ORD-004', action: '复检退回', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(3), note: '音准仍有偏差，退回重修' },
      { id: 'LOG-036', orderId: 'ORD-004', action: '重新维修', operator: '张师傅', operatorRole: 'repair', operatedAt: daysAgo(2), note: '重新调整音准，再次提交复检' },
    ],
    returnInspection: {
      id: 'RI-004', orderId: 'ORD-004', inspectedBy: '李小芳', inspectedAt: daysAgo(10),
      hasDamage: true, damageLevel: 'moderate', damageDescription: '垫片变形，影响音准',
      damagePhotos: ['damage-flute-001.jpg'],
      liabilityParty: 'customer', isDisputed: false,
    },
    repairTask: {
      id: 'RT-001', orderId: 'ORD-004', assignedTo: '张师傅', status: 'review',
      damageCause: '垫片人为变形', liabilityParty: 'customer', estimatedCost: 300, actualCost: 350,
      startedAt: daysAgo(9), completedAt: daysAgo(1), returnedForRework: true, returnReason: '音准仍有偏差',
      logs: [
        { id: 'RL-001', repairTaskId: 'RT-001', action: '接单', operator: '张师傅', operatedAt: daysAgo(9), note: '判定为客户责任' },
        { id: 'RL-002', repairTaskId: 'RT-001', action: '维修中', operator: '张师傅', operatedAt: daysAgo(8), note: '更换垫片' },
        { id: 'RL-003', repairTaskId: 'RT-001', action: '首次完成', operator: '张师傅', operatedAt: daysAgo(4), note: '垫片更换完成' },
        { id: 'RL-004', repairTaskId: 'RT-001', action: '被退回', operator: '系统', operatedAt: daysAgo(3), note: '顾问复检不合格：音准偏差' },
        { id: 'RL-005', repairTaskId: 'RT-001', action: '重新维修', operator: '张师傅', operatedAt: daysAgo(2), note: '调整音准，重新提交' },
      ],
    },
  },
  {
    id: 'ORD-005', orderNo: 'ORD-2024-0022', instrumentId: 'INST-010', customerId: 'CUST-007',
    status: 'disputed', checkoutBy: '李小芳', checkoutAt: daysAgo(18), expectedReturnAt: daysAgo(4),
    actualReturnAt: daysAgo(3), depositAmount: 1800, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: ['checkout-guitar-001.jpg'],
    logs: [
      { id: 'LOG-040', orderId: 'ORD-005', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(18), note: '吉他租出' },
      { id: 'LOG-041', orderId: 'ORD-005', action: '客户归还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(3), note: '归还' },
      { id: 'LOG-042', orderId: 'ORD-005', action: '损坏标记', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(3), note: '琴面有磕碰痕迹' },
      { id: 'LOG-043', orderId: 'ORD-005', action: '客户异议', operator: '赵雅琴', operatorRole: 'consultant', operatedAt: daysAgo(2), note: '客户否认人为损坏，称租出时已有' },
      { id: 'LOG-044', orderId: 'ORD-005', action: '进入争议', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(2), note: '客户对扣款有异议，转入争议流程' },
    ],
    returnInspection: {
      id: 'RI-005', orderId: 'ORD-005', inspectedBy: '李小芳', inspectedAt: daysAgo(3),
      hasDamage: true, damageLevel: 'moderate', damageDescription: '琴面有明显磕碰痕迹，影响外观',
      damagePhotos: ['damage-guitar-001.jpg'],
      liabilityParty: 'customer', isDisputed: true,
    },
  },
  {
    id: 'ORD-006', orderNo: 'ORD-2024-0025', instrumentId: 'INST-007', customerId: 'CUST-006',
    status: 'checked_out', checkoutBy: '李小芳', checkoutAt: daysAgo(14), expectedReturnAt: daysLater(16),
    depositAmount: 4000, rentalFee: 0, schoolCooperation: true,
    schoolPaymentSchedule: [
      { installment: 1, amount: 3000, dueDate: daysAgo(7), status: 'overdue' },
      { installment: 2, amount: 3000, dueDate: daysLater(14), status: 'pending' },
      { installment: 3, amount: 3000, dueDate: daysLater(28), status: 'pending' },
    ],
    checkoutPhotos: ['checkout-drum-001.jpg'],
    logs: [
      { id: 'LOG-050', orderId: 'ORD-006', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(14), note: '架子鼓租出至实验小学，学校批量订单' },
      { id: 'LOG-051', orderId: 'ORD-006', action: '回款逾期', operator: '系统', operatorRole: 'boss', operatedAt: daysAgo(7), note: '第一期回款已逾期7天' },
    ],
  },
  {
    id: 'ORD-007', orderNo: 'ORD-2024-0028', instrumentId: 'INST-009', customerId: 'CUST-008',
    status: 'disputed', checkoutBy: '李小芳', checkoutAt: daysAgo(12), expectedReturnAt: daysLater(2),
    actualReturnAt: daysAgo(1), depositAmount: 1600, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: ['checkout-violin-002.jpg'],
    logs: [
      { id: 'LOG-060', orderId: 'ORD-007', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(12), note: '小提琴租出' },
      { id: 'LOG-061', orderId: 'ORD-007', action: '客户提前归还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(1), note: '客户提前归还' },
      { id: 'LOG-062', orderId: 'ORD-007', action: '轻微损坏标记', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(1), note: '琴弓毛有少量脱落' },
      { id: 'LOG-063', orderId: 'ORD-007', action: '客户异议', operator: '系统', operatorRole: 'consultant', operatedAt: daysAgo(1), note: '客户拒不承认损坏，称正常使用损耗' },
      { id: 'LOG-064', orderId: 'ORD-007', action: '进入争议', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(1), note: '需老板裁定是否属于正常损耗' },
    ],
    returnInspection: {
      id: 'RI-007', orderId: 'ORD-007', inspectedBy: '李小芳', inspectedAt: daysAgo(1),
      hasDamage: true, damageLevel: 'minor', damageDescription: '琴弓毛有少量脱落，琴身轻微划痕',
      damagePhotos: ['damage-violin-002.jpg'],
      liabilityParty: 'undetermined', isDisputed: true,
    },
  },
  {
    id: 'ORD-008', orderNo: 'ORD-2024-0030', instrumentId: 'INST-003', customerId: 'CUST-004',
    status: 'checked_out', checkoutBy: '李小芳', checkoutAt: daysAgo(5), expectedReturnAt: daysLater(10),
    depositAmount: 1200, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: ['checkout-guitar-002.jpg'],
    logs: [
      { id: 'LOG-070', orderId: 'ORD-008', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(5), note: '吉他租出至阳光艺术培训中心' },
    ],
  },
  {
    id: 'ORD-009', orderNo: 'ORD-2024-0032', instrumentId: 'INST-006', customerId: 'CUST-001',
    status: 'settling', checkoutBy: '李小芳', checkoutAt: daysAgo(22), expectedReturnAt: daysAgo(8),
    actualReturnAt: daysAgo(7), depositAmount: 1350, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: ['checkout-erhu-001.jpg'],
    logs: [
      { id: 'LOG-080', orderId: 'ORD-009', action: '租出办理', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(22), note: '二胡租出' },
      { id: 'LOG-081', orderId: 'ORD-009', action: '客户归还', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(7), note: '归还' },
      { id: 'LOG-082', orderId: 'ORD-009', action: '验收通过', operator: '李小芳', operatorRole: 'consultant', operatedAt: daysAgo(7), note: '轻微使用痕迹，不影响使用' },
      { id: 'LOG-083', orderId: 'ORD-009', action: '进入结算', operator: '系统', operatorRole: 'consultant', operatedAt: daysAgo(7), note: '结算中' },
    ],
    returnInspection: {
      id: 'RI-009', orderId: 'ORD-009', inspectedBy: '李小芳', inspectedAt: daysAgo(7),
      hasDamage: false, damageLevel: 'none', damagePhotos: [], liabilityParty: 'undetermined', isDisputed: false,
    },
    depositSettlement: {
      id: 'DS-009', orderId: 'ORD-009', originalAmount: 1350, totalDeduction: 990, refundAmount: 360,
      status: 'pending', deductions: [
        { id: 'DI-0091', settlementId: 'DS-009', type: 'rental', amount: 990, description: '22天租金', isDisputed: false },
      ],
    },
  },
  {
    id: 'ORD-010', orderNo: 'ORD-2024-0035', instrumentId: 'INST-008', customerId: 'CUST-003',
    status: 'checkout_pending', checkoutBy: '', checkoutAt: daysLater(0), expectedReturnAt: daysLater(30),
    depositAmount: 2700, rentalFee: 0, schoolCooperation: false,
    checkoutPhotos: [],
    logs: [],
  },
]

export const alerts: Alert[] = [
  { id: 'ALT-001', type: 'overdue', orderId: 'ORD-002', orderNo: 'ORD-2024-0015', message: '大提琴订单已超时7天未归还（学校客户：市第三中学）', severity: 'high', createdAt: daysAgo(3), dismissed: false },
  { id: 'ALT-002', type: 'school_payment_overdue', orderId: 'ORD-002', orderNo: 'ORD-2024-0015', message: '市第三中学第二期回款已逾期5天，金额2000元', severity: 'high', createdAt: daysAgo(5), dismissed: false },
  { id: 'ALT-003', type: 'damage_dispute', orderId: 'ORD-005', orderNo: 'ORD-2024-0022', message: '吉他损坏争议：客户否认人为损坏，需老板裁定', severity: 'medium', createdAt: daysAgo(2), dismissed: false },
  { id: 'ALT-004', type: 'repair_returned', orderId: 'ORD-004', orderNo: 'ORD-2024-0020', message: '长笛维修被退回重修：顾问复检音准偏差', severity: 'medium', createdAt: daysAgo(3), dismissed: false },
  { id: 'ALT-005', type: 'deposit_dispute', orderId: 'ORD-005', orderNo: 'ORD-2024-0022', message: '吉他订单押金争议：客户对损坏扣款有异议', severity: 'medium', createdAt: daysAgo(2), dismissed: false },
  { id: 'ALT-006', type: 'school_payment_overdue', orderId: 'ORD-006', orderNo: 'ORD-2024-0025', message: '实验小学第一期回款已逾期7天，金额3000元', severity: 'high', createdAt: daysAgo(7), dismissed: false },
  { id: 'ALT-007', type: 'damage_dispute', orderId: 'ORD-007', orderNo: 'ORD-2024-0028', message: '小提琴轻微损坏争议：客户拒认，称正常损耗', severity: 'low', createdAt: daysAgo(1), dismissed: false },
]
