import type { Order, Batch, RewashRecord, HandoverRecord, Complaint, StatusHistory, MonthlySettlement } from '@/types';
import dayjs from 'dayjs';

const now = dayjs();

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNo: 'CY20240528001',
    storeId: 'store-1',
    storeName: '朝阳门店',
    customerName: '张先生',
    customerPhone: '13800138001',
    items: [
      {
        id: 'item-1-1',
        orderId: 'order-1',
        name: '羊毛大衣',
        type: 'coat',
        washType: 'dry',
        price: 88,
        brand: '优衣库',
        color: '深灰',
        defects: ['领口轻微磨损'],
        defectPhotos: ['https://picsum.photos/200/150?random=1'],
        status: 'quality_check',
        batchId: 'batch-1',
        rewashCount: 0,
        remark: '客户要求轻柔洗涤'
      },
      {
        id: 'item-1-2',
        orderId: 'order-1',
        name: '白色衬衫',
        type: 'shirt',
        washType: 'water',
        price: 35,
        brand: 'G2000',
        color: '白色',
        defects: [],
        status: 'ready',
        batchId: 'batch-2',
        rewashCount: 0
      }
    ],
    totalAmount: 123,
    receivedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    expectedDeliveryAt: now.add(1, 'day').format('YYYY-MM-DD HH:mm'),
    status: 'quality_check',
    currentBatchId: 'batch-1',
    remark: 'VIP客户，优先处理',
    createdAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: '王店长',
    updatedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    updatedBy: '李质检'
  },
  {
    id: 'order-2',
    orderNo: 'CY20240527002',
    storeId: 'store-1',
    storeName: '朝阳门店',
    customerName: '李女士',
    customerPhone: '13800138002',
    items: [
      {
        id: 'item-2-1',
        orderId: 'order-2',
        name: '真丝连衣裙',
        type: 'dress',
        washType: 'hand',
        price: 128,
        brand: 'ZARA',
        color: '红色',
        defects: ['下摆有油渍'],
        defectPhotos: ['https://picsum.photos/200/150?random=2'],
        status: 'rewash',
        batchId: 'batch-1',
        rewashCount: 1,
        remark: '油渍未洗净需返洗'
      }
    ],
    totalAmount: 128,
    receivedAt: now.subtract(4, 'day').format('YYYY-MM-DD HH:mm'),
    expectedDeliveryAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    status: 'rewash',
    currentBatchId: 'batch-3',
    remark: '返洗订单，加急处理',
    createdAt: now.subtract(4, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: '王店长',
    updatedAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
    updatedBy: '李质检'
  },
  {
    id: 'order-3',
    orderNo: 'HD20240526001',
    storeId: 'store-2',
    storeName: '海淀门店',
    customerName: '王先生',
    customerPhone: '13900139001',
    items: [
      {
        id: 'item-3-1',
        orderId: 'order-3',
        name: '西装套装',
        type: 'suit',
        washType: 'dry',
        price: 198,
        brand: '报喜鸟',
        color: '藏蓝',
        defects: ['袖口磨损'],
        status: 'completed',
        batchId: 'batch-2',
        rewashCount: 0
      }
    ],
    totalAmount: 198,
    receivedAt: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
    expectedDeliveryAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    actualDeliveryAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    status: 'completed',
    remark: '',
    createdAt: now.subtract(5, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: '王店长',
    updatedAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    updatedBy: '李质检'
  },
  {
    id: 'order-4',
    orderNo: 'XC20240525001',
    storeId: 'store-3',
    storeName: '西城门店',
    customerName: '赵女士',
    customerPhone: '13700137001',
    items: [
      {
        id: 'item-4-1',
        orderId: 'order-4',
        name: '牛仔裤',
        type: 'pants',
        washType: 'water',
        price: 45,
        brand: 'Levis',
        color: '蓝色',
        defects: [],
        status: 'complaint',
        batchId: 'batch-2',
        rewashCount: 0,
        remark: '客户反映褪色严重'
      }
    ],
    totalAmount: 45,
    receivedAt: now.subtract(6, 'day').format('YYYY-MM-DD HH:mm'),
    expectedDeliveryAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    actualDeliveryAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    status: 'complaint',
    remark: '客诉处理中',
    createdAt: now.subtract(6, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: '王店长',
    updatedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    updatedBy: '张厂长'
  },
  {
    id: 'order-5',
    orderNo: 'CY20240529001',
    storeId: 'store-1',
    storeName: '朝阳门店',
    customerName: '刘先生',
    customerPhone: '13600136001',
    items: [
      {
        id: 'item-5-1',
        orderId: 'order-5',
        name: '羊绒衫',
        type: 'others',
        washType: 'hand',
        price: 98,
        brand: '鄂尔多斯',
        color: '米色',
        defects: [],
        status: 'pending',
        rewashCount: 0
      },
      {
        id: 'item-5-2',
        orderId: 'order-5',
        name: '西裤',
        type: 'pants',
        washType: 'dry',
        price: 55,
        brand: '七匹狼',
        color: '黑色',
        defects: [],
        status: 'pending',
        rewashCount: 0
      }
    ],
    totalAmount: 153,
    receivedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    expectedDeliveryAt: now.add(2, 'day').format('YYYY-MM-DD HH:mm'),
    status: 'pending',
    remark: '',
    createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: '王店长',
    updatedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    updatedBy: '王店长'
  },
  {
    id: 'order-6',
    orderNo: 'HD20240528003',
    storeId: 'store-2',
    storeName: '海淀门店',
    customerName: '孙先生',
    customerPhone: '13500135001',
    items: [
      {
        id: 'item-6-1',
        orderId: 'order-6',
        name: '羽绒服',
        type: 'coat',
        washType: 'water',
        price: 120,
        brand: '波司登',
        color: '黑色',
        defects: ['袖口有污渍'],
        defectPhotos: ['https://picsum.photos/200/150?random=3'],
        status: 'washing',
        batchId: 'batch-3',
        rewashCount: 0
      }
    ],
    totalAmount: 120,
    receivedAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    expectedDeliveryAt: now.add(1, 'day').format('YYYY-MM-DD HH:mm'),
    status: 'washing',
    currentBatchId: 'batch-3',
    remark: '',
    createdAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    createdBy: '王店长',
    updatedAt: now.subtract(12, 'hour').format('YYYY-MM-DD HH:mm'),
    updatedBy: '张厂长'
  }
];

export const mockBatches: Batch[] = [
  {
    id: 'batch-1',
    batchNo: 'BATCH-20240528-001',
    washType: 'dry',
    itemCount: 3,
    orderIds: ['order-1', 'order-2'],
    status: 'completed',
    startedAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    completedAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
    operator: '李质检',
    remark: '干洗批次，含VIP订单'
  },
  {
    id: 'batch-2',
    batchNo: 'BATCH-20240527-001',
    washType: 'water',
    itemCount: 4,
    orderIds: ['order-1', 'order-3', 'order-4'],
    status: 'completed',
    startedAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    completedAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    operator: '李质检',
    remark: '水洗批次'
  },
  {
    id: 'batch-3',
    batchNo: 'BATCH-20240529-001',
    washType: 'hand',
    itemCount: 2,
    orderIds: ['order-2', 'order-6'],
    status: 'washing',
    startedAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
    operator: '李质检',
    remark: '手洗/返洗批次，加急'
  }
];

export const mockRewashRecords: RewashRecord[] = [
  {
    id: 'rewash-1',
    orderId: 'order-2',
    itemId: 'item-2-1',
    reason: '下摆油渍未清洗干净',
    photos: ['https://picsum.photos/200/150?random=4'],
    operator: '李质检',
    createdAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm'),
    remark: '返洗后需重点检查'
  }
];

export const mockHandoverRecords: HandoverRecord[] = [
  {
    id: 'handover-1',
    type: 'receive',
    orderId: 'order-1',
    storeId: 'store-1',
    storeName: '朝阳门店',
    itemCount: 2,
    operator: '王店长',
    receiver: '张厂长',
    createdAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    remark: '正常接收'
  },
  {
    id: 'handover-2',
    type: 'deliver',
    orderId: 'order-3',
    storeId: 'store-2',
    storeName: '海淀门店',
    itemCount: 1,
    operator: '李质检',
    receiver: '王店长',
    createdAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
    remark: '客户已取件'
  },
  {
    id: 'handover-3',
    type: 'deliver',
    orderId: 'order-4',
    storeId: 'store-3',
    storeName: '西城门店',
    itemCount: 1,
    operator: '李质检',
    receiver: '王店长',
    createdAt: now.subtract(3, 'day').format('YYYY-MM-DD HH:mm'),
    remark: ''
  }
];

export const mockComplaints: Complaint[] = [
  {
    id: 'complaint-1',
    orderId: 'order-4',
    orderNo: 'XC20240525001',
    storeName: '西城门店',
    customerName: '赵女士',
    itemName: '牛仔裤',
    type: 'damage',
    description: '取件后发现裤子有轻微褪色，腰部位置颜色变浅，影响穿着',
    photos: ['https://picsum.photos/200/150?random=5', 'https://picsum.photos/200/150?random=6'],
    requestedCompensation: 200,
    approvedCompensation: 100,
    status: 'investigating',
    handler: '张厂长',
    handlerRemark: '已核实褪色情况，建议按原价50%赔付',
    createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'complaint-2',
    orderId: 'order-2',
    orderNo: 'CY20240527002',
    storeName: '朝阳门店',
    customerName: '李女士',
    itemName: '真丝连衣裙',
    type: 'delay',
    description: '约定交付时间已过，但衣服还没洗好，明天要参加婚礼急穿',
    requestedCompensation: 50,
    status: 'pending',
    createdAt: now.subtract(2, 'hour').format('YYYY-MM-DD HH:mm')
  }
];

export const mockStatusHistory: StatusHistory[] = [
  {
    id: 'history-1',
    orderId: 'order-1',
    itemId: 'item-1-1',
    fromStatus: 'pending',
    toStatus: 'sorted',
    operator: '李质检',
    remark: '分拣完成，归入干洗批次',
    createdAt: now.subtract(3, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'history-2',
    orderId: 'order-1',
    itemId: 'item-1-1',
    fromStatus: 'sorted',
    toStatus: 'washing',
    operator: '李质检',
    remark: '进入BATCH-20240528-001干洗批次',
    createdAt: now.subtract(2, 'day').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'history-3',
    orderId: 'order-1',
    itemId: 'item-1-1',
    fromStatus: 'washing',
    toStatus: 'quality_check',
    operator: '张厂长',
    remark: '洗涤完成，进入质检环节',
    createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'history-4',
    orderId: 'order-2',
    itemId: 'item-2-1',
    fromStatus: 'washing',
    toStatus: 'quality_check',
    operator: '李质检',
    remark: '洗涤完成',
    createdAt: now.subtract(1, 'day').add(3, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'history-5',
    orderId: 'order-2',
    itemId: 'item-2-1',
    fromStatus: 'quality_check',
    toStatus: 'rewash',
    operator: '李质检',
    remark: '质检发现油渍残留，需返洗',
    createdAt: now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm')
  },
  {
    id: 'history-6',
    orderId: 'order-4',
    itemId: 'item-4-1',
    fromStatus: 'delivered',
    toStatus: 'complaint',
    operator: '张厂长',
    remark: '客户投诉褪色问题',
    createdAt: now.subtract(1, 'day').format('YYYY-MM-DD HH:mm')
  }
];

export const mockMonthlySettlements: MonthlySettlement[] = [
  {
    id: 'settle-1',
    month: '2024-04',
    storeId: 'store-1',
    storeName: '朝阳门店',
    totalOrders: 156,
    totalItems: 234,
    totalAmount: 18720,
    totalCompensation: 350,
    netAmount: 18370,
    items: [
      { orderNo: 'CY20240430001', storeName: '朝阳门店', customerName: '客户A', itemCount: 2, orderAmount: 156, compensationAmount: 0, netAmount: 156, status: 'confirmed', confirmedBy: '王店长', confirmedAt: '2024-05-01' },
      { orderNo: 'CY20240429002', storeName: '朝阳门店', customerName: '客户B', itemCount: 3, orderAmount: 288, compensationAmount: 150, netAmount: 138, status: 'confirmed', confirmedBy: '王店长', confirmedAt: '2024-05-01' }
    ],
    status: 'completed',
    factoryConfirmedBy: '张厂长',
    factoryConfirmedAt: '2024-05-05 10:30',
    storeConfirmedBy: '王店长',
    storeConfirmedAt: '2024-05-05 14:20'
  },
  {
    id: 'settle-2',
    month: '2024-04',
    storeId: 'store-2',
    storeName: '海淀门店',
    totalOrders: 132,
    totalItems: 198,
    totalAmount: 15840,
    totalCompensation: 0,
    netAmount: 15840,
    items: [],
    status: 'confirmed',
    factoryConfirmedBy: '张厂长',
    factoryConfirmedAt: '2024-05-05 11:00',
    storeConfirmedBy: '王店长',
    storeConfirmedAt: '2024-05-05 15:00'
  },
  {
    id: 'settle-3',
    month: '2024-05',
    storeId: 'store-1',
    storeName: '朝阳门店',
    totalOrders: 89,
    totalItems: 134,
    totalAmount: 10720,
    totalCompensation: 200,
    netAmount: 10520,
    items: [],
    status: 'pending'
  }
];
