import type { InventoryRecord } from '~/types'

export const inventoryRecords: InventoryRecord[] = [
  {
    id: 'r001',
    type: 'restock',
    productId: 'p001',
    productName: '梵高向日葵金属徽章',
    productSku: 'BADGE-001',
    quantity: 200,
    status: 'processing',
    priority: 'high',
    createdAt: '2024-05-20T09:30:00',
    updatedAt: '2024-05-22T14:00:00',
    createdBy: 'u003',
    createdByName: '林小艺',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '主馆文创区',
    remark: '五一假期后库存告急，需紧急补货',
    supplier: '文创优品供应商',
    expectedDate: '2024-05-25',
    relatedEvent: '五一特别展览',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-20T09:30:00',
        userId: 'u003',
        userName: '林小艺',
        remark: '活动执行提交补货申请，五一活动销量超预期'
      },
      {
        status: 'approved',
        timestamp: '2024-05-20T11:00:00',
        userId: 'u001',
        userName: '张明远',
        remark: '审批通过，已通知供应商'
      },
      {
        status: 'processing',
        timestamp: '2024-05-22T14:00:00',
        userId: 'u002',
        userName: '李票务',
        remark: '供应商确认发货，预计25日送达'
      }
    ]
  },
  {
    id: 'r002',
    type: 'loss',
    productId: 'p005',
    productName: '星空夜光马克杯',
    productSku: 'CUP-001',
    quantity: 3,
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-05-23T10:15:00',
    updatedAt: '2024-05-23T10:15:00',
    createdBy: 'u002',
    createdByName: '李票务',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '主馆文创区',
    remark: '顾客挑选时不慎打碎',
    lossReason: '顾客损坏',
    lossDate: '2024-05-23',
    relatedTicketOrder: 'TK2024052300127',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-23T10:15:00',
        userId: 'u002',
        userName: '李票务',
        remark: '现场登记损耗，顾客已道歉，未索赔'
      }
    ]
  },
  {
    id: 'r003',
    type: 'restock',
    productId: 'p003',
    productName: '达芬奇蒙娜丽莎拼图',
    productSku: 'PUZZLE-001',
    quantity: 50,
    status: 'abnormal',
    priority: 'high',
    createdAt: '2024-05-18T14:20:00',
    updatedAt: '2024-05-22T09:00:00',
    createdBy: 'u002',
    createdByName: '李票务',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '分馆文创角',
    remark: '到货数量不符，缺少5盒',
    supplier: '智趣玩具商行',
    expectedDate: '2024-05-20',
    actualDate: '2024-05-21',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-18T14:20:00',
        userId: 'u002',
        userName: '李票务',
        remark: '日常补货申请'
      },
      {
        status: 'approved',
        timestamp: '2024-05-18T16:00:00',
        userId: 'u001',
        userName: '张明远',
        remark: '审批通过'
      },
      {
        status: 'processing',
        timestamp: '2024-05-19T10:00:00',
        userId: 'u001',
        userName: '张明远',
        remark: '已安排发货'
      },
      {
        status: 'abnormal',
        timestamp: '2024-05-22T09:00:00',
        userId: 'u002',
        userName: '李票务',
        remark: '【异常】实际到货45盒，与订单50盒不符，已联系供应商核实'
      }
    ]
  },
  {
    id: 'r004',
    type: 'loss',
    productId: 'p008',
    productName: '限定展览丝巾',
    productSku: 'SCARF-001',
    quantity: 1,
    status: 'completed',
    priority: 'high',
    createdAt: '2024-05-15T16:45:00',
    updatedAt: '2024-05-16T15:30:00',
    createdBy: 'u003',
    createdByName: '林小艺',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '特展文创区',
    remark: 'VIP活动纪念礼品',
    lossReason: '活动赠礼',
    lossDate: '2024-05-15',
    actualDate: '2024-05-16',
    relatedEvent: '春季收藏家沙龙',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-15T16:45:00',
        userId: 'u003',
        userName: '林小艺',
        remark: '申请作为VIP活动礼品，需馆长确认'
      },
      {
        status: 'approved',
        timestamp: '2024-05-15T17:30:00',
        userId: 'u001',
        userName: '张明远',
        remark: '同意，作为特别嘉宾伴手礼'
      },
      {
        status: 'completed',
        timestamp: '2024-05-16T15:30:00',
        userId: 'u003',
        userName: '林小艺',
        remark: '已赠送给重要嘉宾，活动反馈良好'
      }
    ]
  },
  {
    id: 'r005',
    type: 'restock',
    productId: 'p002',
    productName: '莫奈睡莲帆布袋',
    productSku: 'BAG-001',
    quantity: 100,
    status: 'completed',
    priority: 'medium',
    createdAt: '2024-05-10T11:00:00',
    updatedAt: '2024-05-14T10:00:00',
    createdBy: 'u002',
    createdByName: '李票务',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '主馆文创区',
    remark: '母亲节促销备货',
    supplier: '文创优品供应商',
    expectedDate: '2024-05-12',
    actualDate: '2024-05-12',
    relatedEvent: '母亲节特别活动',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-10T11:00:00',
        userId: 'u002',
        userName: '李票务',
        remark: '母亲节活动预计销量增长'
      },
      {
        status: 'approved',
        timestamp: '2024-05-10T11:30:00',
        userId: 'u001',
        userName: '张明远',
        remark: '审批通过'
      },
      {
        status: 'processing',
        timestamp: '2024-05-11T09:00:00',
        userId: 'u002',
        userName: '李票务',
        remark: '供应商已发货'
      },
      {
        status: 'completed',
        timestamp: '2024-05-14T10:00:00',
        userId: 'u002',
        userName: '李票务',
        remark: '已签收入库，数量正确'
      }
    ]
  },
  {
    id: 'r006',
    type: 'loss',
    productId: 'p007',
    productName: '雕塑复刻钥匙扣',
    productSku: 'KEY-001',
    quantity: 2,
    status: 'rejected',
    priority: 'low',
    createdAt: '2024-05-21T15:30:00',
    updatedAt: '2024-05-21T17:00:00',
    createdBy: 'u003',
    createdByName: '林小艺',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '活动现场',
    remark: '活动道具使用',
    lossReason: '其他',
    lossDate: '2024-05-21',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-21T15:30:00',
        userId: 'u003',
        userName: '林小艺',
        remark: '活动互动环节需要样品'
      },
      {
        status: 'rejected',
        timestamp: '2024-05-21T17:00:00',
        userId: 'u001',
        userName: '张明远',
        remark: '请走样品借用流程，损耗仅用于实际丢失或损坏'
      }
    ]
  },
  {
    id: 'r007',
    type: 'restock',
    productId: 'p004',
    productName: '美术馆定制笔记本',
    productSku: 'BOOK-001',
    quantity: 200,
    status: 'pending',
    priority: 'low',
    createdAt: '2024-05-23T09:00:00',
    updatedAt: '2024-05-23T09:00:00',
    createdBy: 'u002',
    createdByName: '李票务',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '主馆文创区',
    remark: '常规备货',
    supplier: '文博文具',
    expectedDate: '2024-05-28',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-23T09:00:00',
        userId: 'u002',
        userName: '李票务',
        remark: '库存充足，预计下周需要补货'
      }
    ]
  },
  {
    id: 'r008',
    type: 'loss',
    productId: 'p006',
    productName: '艺术大师明信片套装',
    productSku: 'CARD-001',
    quantity: 5,
    status: 'approved',
    priority: 'medium',
    createdAt: '2024-05-22T11:20:00',
    updatedAt: '2024-05-22T14:00:00',
    createdBy: 'u003',
    createdByName: '林小艺',
    currentHandler: 'u001',
    currentHandlerName: '张明远',
    location: '教育活动区',
    remark: '儿童工作坊材料',
    lossReason: '活动消耗',
    lossDate: '2024-05-25',
    relatedEvent: '小小艺术家工作坊',
    history: [
      {
        status: 'pending',
        timestamp: '2024-05-22T11:20:00',
        userId: 'u003',
        userName: '林小艺',
        remark: '周六儿童工作坊需要使用'
      },
      {
        status: 'approved',
        timestamp: '2024-05-22T14:00:00',
        userId: 'u001',
        userName: '张明远',
        remark: '同意，活动后反馈使用情况'
      }
    ]
  }
]
