export const mockWorkOrders = [
  {
    id: 'WO202401001',
    customer: '张三汽修',
    carModel: '大众帕萨特',
    carNumber: '京A12345',
    items: [
      { name: '前刹车片', model: 'FV3456', qty: 2, price: 280 },
      { name: '机油滤芯', model: 'JX0810', qty: 1, price: 45 }
    ],
    totalAmount: 605,
    status: 'pending',
    createTime: '2024-01-15 09:30:00',
    handler: '李销售',
    remark: '客户下午来取'
  },
  {
    id: 'WO202401002',
    customer: '旺达维修中心',
    carModel: '丰田凯美瑞',
    carNumber: '京B67890',
    items: [
      { name: '空气滤芯', model: 'LX2841', qty: 1, price: 65 },
      { name: '火花塞', model: 'SK20R11', qty: 4, price: 85 }
    ],
    totalAmount: 405,
    status: 'rejected',
    createTime: '2024-01-15 10:15:00',
    handler: '王销售',
    remark: '型号不符',
    rejectReason: '空气滤芯型号不对，需要更换型号为LX2842'
  },
  {
    id: 'WO202401003',
    customer: '诚信汽修厂',
    carModel: '本田雅阁',
    carNumber: '京C11111',
    items: [
      { name: '变速箱油', model: 'ATF-DW1', qty: 4, price: 120 }
    ],
    totalAmount: 480,
    status: 'review',
    createTime: '2024-01-15 14:20:00',
    handler: '赵销售',
    remark: '需核对库存'
  },
  {
    id: 'WO202401004',
    customer: '快捷汽修',
    carModel: '别克君威',
    carNumber: '京D22222',
    items: [
      { name: '电瓶', model: '6-QW-60', qty: 1, price: 450 },
      { name: '雨刮片', model: '24/18', qty: 1, price: 120 }
    ],
    totalAmount: 570,
    status: 'approved',
    createTime: '2024-01-14 16:45:00',
    handler: '孙销售'
  },
  {
    id: 'WO202401005',
    customer: '大众专修店',
    carModel: '奥迪A6L',
    carNumber: '京E33333',
    items: [
      { name: '正时皮带套装', model: '6PK1880', qty: 1, price: 850 }
    ],
    totalAmount: 850,
    status: 'pending',
    createTime: '2024-01-16 08:30:00',
    handler: '周销售'
  }
]

export const mockOutbounds = [
  {
    id: 'OB202401001',
    workOrderId: 'WO202401001',
    customer: '张三汽修',
    items: [
      { name: '前刹车片', model: 'FV3456', qty: 2, price: 280, actualQty: 2 },
      { name: '机油滤芯', model: 'JX0810', qty: 1, price: 45, actualQty: 1 }
    ],
    totalAmount: 605,
    actualAmount: 605,
    status: 'reconciled',
    createTime: '2024-01-15 11:00:00',
    warehouse: '主仓库',
    operator: '库管A'
  },
  {
    id: 'OB202401002',
    workOrderId: 'WO202401004',
    customer: '快捷汽修',
    items: [
      { name: '电瓶', model: '6-QW-60', qty: 1, price: 450, actualQty: 1 },
      { name: '雨刮片', model: '24/18', qty: 1, price: 120, actualQty: 1, returnedQty: 1 }
    ],
    totalAmount: 570,
    actualAmount: 450,
    status: 'pending',
    createTime: '2024-01-15 09:00:00',
    warehouse: '主仓库',
    operator: '库管B',
    hasReturn: true,
    returnItems: [
      { name: '雨刮片', model: '24/18', qty: 1, reason: '型号不匹配' }
    ]
  },
  {
    id: 'OB202401003',
    workOrderId: 'WO202401005',
    customer: '大众专修店',
    items: [
      { name: '正时皮带套装', model: '6PK1880', qty: 1, price: 850, actualQty: 0 }
    ],
    totalAmount: 850,
    actualAmount: 0,
    status: 'review',
    createTime: '2024-01-16 10:00:00',
    warehouse: '备件库',
    operator: '库管A',
    remark: '库存不足，等待补货'
  }
]

export const statusMap = {
  pending: { label: '待处理', color: 'warning' },
  approved: { label: '已通过', color: 'success' },
  rejected: { label: '已驳回', color: 'error' },
  review: { label: '需回查', color: 'processing' },
  reconciled: { label: '已对账', color: 'success' }
}
