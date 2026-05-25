
const today = new Date()
const daysAgo = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const daysLater = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export const mockCustomers = [
  { id: 1, name: '鲜果超市', contact: '刘老板', phone: '13911110001', address: '北京市朝阳区水果批发市场A区12号', creditLimit: 50000, currentCredit: 32000, status: 'normal', level: 'A', createDate: daysAgo(180) },
  { id: 2, name: '天天鲜果', contact: '陈经理', phone: '13911110002', address: '北京市海淀区中关村大街88号', creditLimit: 30000, currentCredit: 28500, status: 'warning', level: 'B', createDate: daysAgo(120) },
  { id: 3, name: '果园直供', contact: '王总', phone: '13911110003', address: '北京市丰台区南三环西路16号', creditLimit: 80000, currentCredit: 45000, status: 'normal', level: 'A', createDate: daysAgo(365) },
  { id: 4, name: '惠民水果店', contact: '赵姐', phone: '13911110004', address: '北京市西城区阜成门大街25号', creditLimit: 20000, currentCredit: 18000, status: 'overdue', level: 'C', createDate: daysAgo(90) },
  { id: 5, name: '鲜果时光', contact: '孙老板', phone: '13911110005', address: '北京市东城区王府井大街138号', creditLimit: 100000, currentCredit: 0, status: 'normal', level: 'S', createDate: daysAgo(400) },
  { id: 6, name: '百果汇', contact: '周经理', phone: '13911110006', address: '北京市通州区新华大街56号', creditLimit: 40000, currentCredit: 38000, status: 'warning', level: 'B', createDate: daysAgo(150) },
  { id: 7, name: '果味鲜', contact: '吴总', phone: '13911110007', address: '北京市大兴区黄村东大街88号', creditLimit: 25000, currentCredit: 22000, status: 'overdue', level: 'C', createDate: daysAgo(60) },
  { id: 8, name: '绿园果品', contact: '郑老板', phone: '13911110008', address: '北京市石景山区鲁谷路35号', creditLimit: 60000, currentCredit: 25000, status: 'normal', level: 'A', createDate: daysAgo(200) }
]

export const mockWeighingOrders = [
  { id: 'WO202501001', supplier: '山东烟台果园', fruitId: 1, fruitName: '苹果', quantity: 5000, unit: '斤', grossWeight: 5100, tareWeight: 100, netWeight: 5000, pricePerUnit: 3.5, totalAmount: 17500, warehouse: 'A区-01', operator: '孙采购', status: 'confirmed', createDate: daysAgo(3), gradingStatus: 'pending' },
  { id: 'WO202501002', supplier: '江西赣南果业', fruitId: 2, fruitName: '橙子', quantity: 8000, unit: '斤', grossWeight: 8150, tareWeight: 150, netWeight: 8000, pricePerUnit: 4.2, totalAmount: 33600, warehouse: 'A区-02', operator: '孙采购', status: 'confirmed', createDate: daysAgo(2), gradingStatus: 'in_progress' },
  { id: 'WO202501003', supplier: '海南香蕉基地', fruitId: 3, fruitName: '香蕉', quantity: 3000, unit: '斤', grossWeight: 3050, tareWeight: 50, netWeight: 3000, pricePerUnit: 2.8, totalAmount: 8400, warehouse: 'B区-01', operator: '孙采购', status: 'confirmed', createDate: daysAgo(1), gradingStatus: 'pending' },
  { id: 'WO202501004', supplier: '新疆葡萄基地', fruitId: 4, fruitName: '葡萄', quantity: 2000, unit: '斤', grossWeight: 2080, tareWeight: 80, netWeight: 2000, pricePerUnit: 8.5, totalAmount: 17000, warehouse: 'A区-03', operator: '孙采购', status: 'pending', createDate: daysAgo(0), gradingStatus: 'pending' },
  { id: 'WO202501005', supplier: '海南西瓜基地', fruitId: 5, fruitName: '西瓜', quantity: 10000, unit: '斤', grossWeight: 10200, tareWeight: 200, netWeight: 10000, pricePerUnit: 1.8, totalAmount: 18000, warehouse: 'C区-01', operator: '孙采购', status: 'confirmed', createDate: daysAgo(5), gradingStatus: 'completed' }
]

export const mockColdRoomInventory = [
  { id: 1, warehouse: 'A区-01', fruitId: 1, fruitName: '苹果', totalQuantity: 5000, availableQuantity: 4500, gradedQuantity: 3000, ungradedQuantity: 2000, inboundDate: daysAgo(3), expectedShelfLife: daysLater(27), temperature: 2, humidity: 85, status: 'normal' },
  { id: 2, warehouse: 'A区-02', fruitId: 2, fruitName: '橙子', totalQuantity: 8000, availableQuantity: 7000, gradedQuantity: 5000, ungradedQuantity: 3000, inboundDate: daysAgo(2), expectedShelfLife: daysLater(43), temperature: 4, humidity: 80, status: 'normal' },
  { id: 3, warehouse: 'B区-01', fruitId: 3, fruitName: '香蕉', totalQuantity: 3000, availableQuantity: 2500, gradedQuantity: 1500, ungradedQuantity: 1500, inboundDate: daysAgo(1), expectedShelfLife: daysLater(6), temperature: 13, humidity: 90, status: 'warning' },
  { id: 4, warehouse: 'A区-03', fruitId: 4, fruitName: '葡萄', totalQuantity: 2000, availableQuantity: 0, gradedQuantity: 0, ungradedQuantity: 2000, inboundDate: daysAgo(0), expectedShelfLife: daysLater(15), temperature: 0, humidity: 85, status: 'pending' },
  { id: 5, warehouse: 'C区-01', fruitId: 5, fruitName: '西瓜', totalQuantity: 10000, availableQuantity: 8000, gradedQuantity: 8000, ungradedQuantity: 2000, inboundDate: daysAgo(5), expectedShelfLife: daysLater(15), temperature: 10, humidity: 75, status: 'normal' },
  { id: 6, warehouse: 'A区-01', fruitId: 1, fruitName: '苹果', totalQuantity: 2000, availableQuantity: 1800, gradedQuantity: 1800, ungradedQuantity: 200, inboundDate: daysAgo(10), expectedShelfLife: daysLater(20), temperature: 2, humidity: 85, status: 'normal' }
]

export const mockGradingRecords = [
  { id: 'GR202501001', weighingOrderId: 'WO202501001', fruitId: 1, fruitName: '苹果', totalQuantity: 5000, grades: [
    { level: 'A', quantity: 1500, price: 4.55, amount: 6825 },
    { level: 'B', quantity: 2000, price: 3.85, amount: 7700 },
    { level: 'C', quantity: 1000, price: 3.50, amount: 3500 },
    { level: 'D', quantity: 500, price: 2.45, amount: 1225 }
  ], operator: '王库管', status: 'completed', createDate: daysAgo(2) },
  { id: 'GR202501002', weighingOrderId: 'WO202501002', fruitId: 2, fruitName: '橙子', totalQuantity: 8000, grades: [
    { level: 'A', quantity: 3000, price: 5.46, amount: 16380 },
    { level: 'B', quantity: 3500, price: 4.62, amount: 16170 },
    { level: 'C', quantity: 1000, price: 4.20, amount: 4200 },
    { level: 'D', quantity: 500, price: 2.94, amount: 1470 }
  ], operator: '王库管', status: 'in_progress', createDate: daysAgo(1) },
  { id: 'GR202501003', weighingOrderId: 'WO202501005', fruitId: 5, fruitName: '西瓜', totalQuantity: 10000, grades: [
    { level: 'A', quantity: 4000, price: 2.34, amount: 9360 },
    { level: 'B', quantity: 4000, price: 1.98, amount: 7920 },
    { level: 'C', quantity: 1500, price: 1.80, amount: 2700 },
    { level: 'D', quantity: 500, price: 1.26, amount: 630 }
  ], operator: '王库管', status: 'completed', createDate: daysAgo(4) }
]

export const mockCreditOrders = [
  { id: 'CO202501001', customerId: 1, customerName: '鲜果超市', items: [
    { fruitId: 1, fruitName: '苹果', level: 'A', quantity: 500, price: 4.55, amount: 2275 },
    { fruitId: 2, fruitName: '橙子', level: 'A', quantity: 300, price: 5.46, amount: 1638 }
  ], totalAmount: 3913, paidAmount: 0, creditDays: 30, createDate: daysAgo(5), dueDate: daysLater(25), status: 'normal', salesperson: '李销售' },
  { id: 'CO202501002', customerId: 2, customerName: '天天鲜果', items: [
    { fruitId: 3, fruitName: '香蕉', level: 'B', quantity: 1000, price: 3.08, amount: 3080 },
    { fruitId: 5, fruitName: '西瓜', level: 'A', quantity: 2000, price: 2.34, amount: 4680 }
  ], totalAmount: 7760, paidAmount: 0, creditDays: 30, createDate: daysAgo(10), dueDate: daysLater(20), status: 'normal', salesperson: '李销售' },
  { id: 'CO202412003', customerId: 4, customerName: '惠民水果店', items: [
    { fruitId: 1, fruitName: '苹果', level: 'C', quantity: 800, price: 3.50, amount: 2800 }
  ], totalAmount: 2800, paidAmount: 0, creditDays: 30, createDate: daysAgo(45), dueDate: daysAgo(15), status: 'overdue', salesperson: '李销售' },
  { id: 'CO202412004', customerId: 7, customerName: '果味鲜', items: [
    { fruitId: 2, fruitName: '橙子', level: 'B', quantity: 500, price: 4.62, amount: 2310 },
    { fruitId: 4, fruitName: '葡萄', level: 'A', quantity: 200, price: 11.05, amount: 2210 }
  ], totalAmount: 4520, paidAmount: 1000, creditDays: 30, createDate: daysAgo(50), dueDate: daysAgo(20), status: 'overdue', salesperson: '李销售' },
  { id: 'CO202501005', customerId: 3, customerName: '果园直供', items: [
    { fruitId: 1, fruitName: '苹果', level: 'A', quantity: 1000, price: 4.55, amount: 4550 },
    { fruitId: 8, fruitName: '梨', level: 'B', quantity: 600, price: 3.85, amount: 2310 }
  ], totalAmount: 6860, paidAmount: 6860, creditDays: 15, createDate: daysAgo(20), dueDate: daysAgo(5), status: 'paid', salesperson: '李销售' },
  { id: 'CO202501006', customerId: 6, customerName: '百果汇', items: [
    { fruitId: 2, fruitName: '橙子', level: 'A', quantity: 800, price: 5.46, amount: 4368 }
  ], totalAmount: 4368, paidAmount: 0, creditDays: 30, createDate: daysAgo(8), dueDate: daysLater(22), status: 'normal', salesperson: '李销售' },
  { id: 'CO202411007', customerId: 4, customerName: '惠民水果店', items: [
    { fruitId: 3, fruitName: '香蕉', level: 'C', quantity: 500, price: 1.96, amount: 980 }
  ], totalAmount: 980, paidAmount: 0, creditDays: 30, createDate: daysAgo(75), dueDate: daysAgo(45), status: 'bad_debt', salesperson: '李销售' }
]

export const mockCollectionRecords = [
  { id: 'CR202501001', creditOrderId: 'CO202412003', customerId: 4, customerName: '惠民水果店', amount: 2800, method: 'phone', operator: '李销售', status: 'in_progress', record: '客户称资金周转困难，承诺一周内还款', createDate: daysAgo(3), nextFollowDate: daysLater(4) },
  { id: 'CR202501002', creditOrderId: 'CO202412004', customerId: 7, customerName: '果味鲜', amount: 3520, method: 'visit', operator: '李销售', status: 'pending', record: '', createDate: daysAgo(1), nextFollowDate: daysLater(2) },
  { id: 'CR202501003', creditOrderId: 'CO202501005', customerId: 3, customerName: '果园直供', amount: 6860, method: 'bank', operator: '赵财务', status: 'completed', record: '客户已通过银行转账全额还款', createDate: daysAgo(5), nextFollowDate: null },
  { id: 'CR202501004', creditOrderId: 'CO202411007', customerId: 4, customerName: '惠民水果店', amount: 980, method: 'phone', operator: '李销售', status: 'failed', record: '客户电话无法接通，已发律师函', createDate: daysAgo(10), nextFollowDate: daysLater(20) }
]

export const mockLossRecords = [
  { id: 'LS202501001', fruitId: 1, fruitName: '苹果', warehouse: 'A区-01', quantity: 200, unit: '斤', reason: '自然损耗', description: '入库后正常水分流失', operator: '王库管', status: 'confirmed', createDate: daysAgo(2), relatedOrder: 'WO202501001' },
  { id: 'LS202501002', fruitId: 3, fruitName: '香蕉', warehouse: 'B区-01', quantity: 300, unit: '斤', reason: '冷害损伤', description: '温度设置不当导致果皮变黑', operator: '王库管', status: 'pending', createDate: daysAgo(0), relatedOrder: 'WO202501003' },
  { id: 'LS202501003', fruitId: 2, fruitName: '橙子', warehouse: 'A区-02', quantity: 50, unit: '斤', reason: '机械损伤', description: '搬运过程中碰撞损伤', operator: '王库管', status: 'rejected', createDate: daysAgo(1), relatedOrder: 'WO202501002' },
  { id: 'LS202501004', fruitId: 4, fruitName: '葡萄', warehouse: 'A区-03', quantity: 100, unit: '斤', reason: '霉变', description: '部分葡萄霉变，需及时处理', operator: '王库管', status: 'pending', createDate: daysAgo(0), relatedOrder: 'WO202501004' }
]

export const mockComplaintRecords = [
  { id: 'CP202501001', customerId: 2, customerName: '天天鲜果', orderId: 'CO202501002', type: 'quality', description: '部分香蕉到货时已过熟', evidence: ['photo1.jpg', 'photo2.jpg'], quantity: 200, unit: '斤', claimAmount: 500, status: 'pending', handler: '李销售', createDate: daysAgo(1) },
  { id: 'CP202501002', customerId: 1, customerName: '鲜果超市', orderId: 'CO202501001', type: 'shortage', description: '实际到货数量比订单少20斤', evidence: ['weighing_slip.jpg'], quantity: 20, unit: '斤', claimAmount: 91, status: 'resolved', handler: '李销售', resolution: '已补发20斤A级苹果', createDate: daysAgo(3) },
  { id: 'CP202501003', customerId: 6, customerName: '百果汇', orderId: 'CO202501006', type: 'quality', description: '橙子大小不均匀，部分有干疤', evidence: ['photo3.jpg', 'photo4.jpg', 'photo5.jpg'], quantity: 100, unit: '斤', claimAmount: 300, status: 'processing', handler: '李销售', createDate: daysAgo(0) }
]

export const mockTasks = [
  { id: 1, title: '过磅单 WO202501004 待确认', type: 'weighing', priority: 'high', status: 'pending', assignedTo: '孙采购', relatedId: 'WO202501004', dueDate: daysLater(0), createDate: daysAgo(0) },
  { id: 2, title: '分级记录 GR202501002 待完成', type: 'grading', priority: 'high', status: 'in_progress', assignedTo: '王库管', relatedId: 'GR202501002', dueDate: daysLater(1), createDate: daysAgo(1) },
  { id: 3, title: '惠民水果店 逾期账款催办', type: 'collection', priority: 'urgent', status: 'in_progress', assignedTo: '李销售', relatedId: 'CR202501001', relatedOrderId: 'CO202412003', dueDate: daysAgo(1), createDate: daysAgo(3) },
  { id: 4, title: '果味鲜 逾期账款催办', type: 'collection', priority: 'urgent', status: 'pending', assignedTo: '李销售', relatedId: 'CR202501002', relatedOrderId: 'CO202412004', dueDate: daysLater(0), createDate: daysAgo(1) },
  { id: 5, title: '损耗记录 LS202501002 待审核', type: 'loss', priority: 'medium', status: 'pending', assignedTo: '张经理', relatedId: 'LS202501002', dueDate: daysLater(2), createDate: daysAgo(0) },
  { id: 6, title: '投诉 CP202501003 待处理', type: 'complaint', priority: 'high', status: 'pending', assignedTo: '李销售', relatedId: 'CP202501003', dueDate: daysLater(1), createDate: daysAgo(0) },
  { id: 7, title: '损耗记录 LS202501003 已驳回', type: 'loss', priority: 'medium', status: 'rejected', assignedTo: '王库管', relatedId: 'LS202501003', dueDate: daysLater(0), createDate: daysAgo(1), rejectReason: '损耗原因描述不够详细' },
  { id: 8, title: '香蕉库存即将到期', type: 'inventory', priority: 'warning', status: 'pending', assignedTo: '王库管', relatedId: '3', dueDate: daysLater(6), createDate: daysAgo(0) },
  { id: 9, title: '天天鲜果 账款即将到期', type: 'collection', priority: 'medium', status: 'pending', assignedTo: '李销售', relatedId: 'CO202501002', relatedOrderId: 'CO202501002', dueDate: daysLater(20), createDate: daysAgo(0) },
  { id: 10, title: '百果汇 账款即将到期', type: 'collection', priority: 'medium', status: 'pending', assignedTo: '李销售', relatedId: 'CO202501006', relatedOrderId: 'CO202501006', dueDate: daysLater(22), createDate: daysAgo(0) }
]

export const mockNotifications = [
  { id: 1, type: 'urgent', message: '惠民水果店账款已逾期15天', relatedTo: 'CO202412003', createDate: daysAgo(0) },
  { id: 2, type: 'warning', message: '香蕉库存将在6天后到期', relatedTo: '3', createDate: daysAgo(0) },
  { id: 3, type: 'info', message: '新的过磅单 WO202501004 已创建', relatedTo: 'WO202501004', createDate: daysAgo(0) },
  { id: 4, type: 'success', message: '果园直供订单 CO202501005 已全额回款', relatedTo: 'CO202501005', createDate: daysAgo(5) }
]
