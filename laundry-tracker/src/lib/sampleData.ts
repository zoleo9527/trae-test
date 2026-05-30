import { db } from './db'
import type {
  Order, ClothingItem, Store, User, Batch, ProcessRecord, RewashRecord, Issue, TimelineEvent, HandoverRecord
} from './types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export const STAGES = [
  { id: 0, name: '待分拣', key: 'pending' },
  { id: 1, name: '分拣中', key: 'sorting' },
  { id: 2, name: '洗涤中', key: 'washing' },
  { id: 3, name: '烘干中', key: 'drying' },
  { id: 4, name: '熨烫中', key: 'ironing' },
  { id: 5, name: '质检中', key: 'qc' },
  { id: 6, name: '已完成', key: 'completed' },
  { id: 7, name: '返洗中', key: 'rewash' },
  { id: 8, name: '已交付', key: 'delivered' }
]

export const CLOTHING_TYPES = [
  '衬衫', 'T恤', '西装', '西裤', '牛仔裤', '连衣裙', '外套', '羽绒服', '毛衣', '裙子',
  '床单', '被套', '毛巾', '浴巾', '窗帘'
]

export const sampleStores: Store[] = [
  { id: 'store-1', name: '朝阳门店', code: 'CY001', contact: '张经理', phone: '13800138001', address: '北京市朝阳区朝阳门南大街1号' },
  { id: 'store-2', name: '海淀店', code: 'HD001', contact: '李店长', phone: '13800138002', address: '北京市海淀区中关村大街1号' },
  { id: 'store-3', name: '西城店', code: 'XC001', contact: '王主管', phone: '13800138003', address: '北京市西城区金融街1号' }
]

export const sampleUsers: User[] = [
  { id: 'user-1', name: '厂长 - 王建国', role: 'manager' },
  { id: 'user-2', name: '质检员 - 李芳', role: 'qc' },
  { id: 'user-3', name: '分拣员 - 张伟', role: 'operator' },
  { id: 'user-4', name: '洗涤工 - 刘强', role: 'operator' },
  { id: 'user-5', name: '门店 - 陈晓', role: 'store' }
]

function createClothingItems(orderId: string, count: number): ClothingItem[] {
  const items: ClothingItem[] = []
  for (let i = 0; i < count; i++) {
    items.push({
      id: generateId(),
      orderId,
      barcode: `BC${Date.now()}${String(i).padStart(4, '0')}`,
      type: CLOTHING_TYPES[Math.floor(Math.random() * CLOTHING_TYPES.length)],
      color: ['白色', '黑色', '蓝色', '灰色', '红色'][Math.floor(Math.random() * 5)],
      brand: ['优衣库', '海澜之家', '耐克', '阿迪达斯', '无印良品'][Math.floor(Math.random() * 5)],
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }
  return items
}

export function generateSampleOrders(): Order[] {
  const customers = [
    { name: '张三', phone: '13900139001' },
    { name: '李四', phone: '13900139002' },
    { name: '王五', phone: '13900139003' },
    { name: '赵六', phone: '13900139004' },
    { name: '钱七', phone: '13900139005' },
    { name: '孙八', phone: '13900139006' }
  ]
  
  const statuses: Order['status'][] = ['pending', 'sorting', 'washing', 'drying', 'ironing', 'qc', 'completed', 'rewash', 'delivered']
  const orders: Order[] = []
  
  for (let i = 0; i < 12; i++) {
    const id = generateId()
    const customer = customers[i % customers.length]
    const statusIndex = i % statuses.length
    const store = sampleStores[i % sampleStores.length]
    
    orders.push({
      id,
      orderNo: `ORD${String(202405001 + i).padStart(10, '0')}`,
      storeId: store.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: createClothingItems(id, Math.floor(Math.random() * 5) + 1),
      status: statuses[statusIndex],
      priority: ['normal', 'urgent', 'vip'][Math.floor(Math.random() * 3)] as any,
      receivedAt: Date.now() - (i * 3600000),
      estimatedDelivery: Date.now() + (86400000 * 2),
      currentStage: statusIndex,
      totalRewashCount: i === 3 ? 2 : i === 7 ? 1 : 0,
      createdAt: Date.now() - (i * 3600000),
      updatedAt: Date.now()
    })
  }
  
  return orders
}

export function generateSampleBatches(orders: Order[]): Batch[] {
  const batches: Batch[] = []
  const processTypes = ['普洗', '精洗', '干洗', '水洗']
  
  for (let i = 0; i < 4; i++) {
    const batchOrders = orders.slice(i * 2, i * 2 + 2)
    batches.push({
      id: generateId(),
      batchNo: `BATCH${String(202405001 + i).padStart(8, '0')}`,
      type: i === 2 ? 'rewash' : 'wash',
      orderIds: batchOrders.map(o => o.id),
      status: ['pending', 'processing', 'completed', 'processing'][i] as any,
      processType: processTypes[i],
      startTime: i === 1 || i === 3 ? Date.now() - 1800000 : undefined,
      endTime: i === 2 ? Date.now() - 3600000 : undefined,
      operator: sampleUsers[3].name,
      createdAt: Date.now() - (i * 7200000)
    })
  }
  
  return batches
}

export function generateSampleProcessRecords(orders: Order[]): ProcessRecord[] {
  const records: ProcessRecord[] = []
  
  orders.forEach(order => {
    for (let s = 0; s <= order.currentStage && s < 6; s++) {
      records.push({
        id: generateId(),
        orderId: order.id,
        stage: s,
        stageName: STAGES[s].name,
        operator: sampleUsers[(s + 1) % sampleUsers.length].name,
        startTime: order.receivedAt + (s * 1800000),
        endTime: s < order.currentStage ? order.receivedAt + ((s + 1) * 1800000) : undefined,
        createdAt: order.receivedAt + (s * 1800000)
      })
    }
  })
  
  return records
}

export function generateSampleRewashRecords(orders: Order[]): RewashRecord[] {
  const rewashOrders = orders.filter(o => o.status === 'rewash' || o.totalRewashCount > 0)
  const records: RewashRecord[] = []
  
  rewashOrders.forEach((order, idx) => {
    for (let i = 0; i < order.totalRewashCount; i++) {
      records.push({
        id: generateId(),
        orderId: order.id,
        itemId: order.items[i]?.id,
        reason: ['残留污渍未洗净', '衣物有异味', '衣物褶皱严重', '色泽不均'][idx % 4],
        issueType: ['stain', 'other', 'damage', 'color_fade'][idx % 4] as any,
        detectedAt: Date.now() - ((idx + 1) * 3600000),
        detectedBy: sampleUsers[1].name,
        rewashCount: i + 1,
        resolved: false,
        notes: idx === 0 ? '需要特别注意领口污渍' : undefined
      })
    }
  })
  
  return records
}

export function generateSampleIssues(orders: Order[]): Issue[] {
  const issues: Issue[] = []
  const problematicOrders = orders.slice(3, 7)
  
  const issueData = [
    {
      title: '衣物污损争议',
      description: '客户送洗的白色衬衫领口有明显污渍，工厂称接收时已有，但客户坚持送洗时完好',
      type: 'stain' as const,
      status: 'escalated' as const,
      compensation: undefined
    },
    {
      title: '衣物轻微破损',
      description: '质检发现西装袖口有轻微勾丝，可能是洗涤过程中造成',
      type: 'damage' as const,
      status: 'processing' as const,
      compensation: 50
    },
    {
      title: '配件缺失',
      description: '客户反映取回的羽绒服帽子丢失',
      type: 'missing' as const,
      status: 'resolved' as const,
      compensation: 200
    },
    {
      title: '颜色褪色',
      description: '红色连衣裙洗涤后颜色略有褪色，客户不满意',
      type: 'color_fade' as const,
      status: 'resolved' as const,
      compensation: 100
    }
  ]
  
  problematicOrders.forEach((order, idx) => {
    const data = issueData[idx]
    issues.push({
      id: generateId(),
      orderId: order.id,
      itemId: order.items[0].id,
      ...data,
      reportedBy: sampleUsers[1].name,
      reportedAt: Date.now() - ((idx + 1) * 86400000),
      assignee: sampleUsers[0].name,
      evidence: [
        {
          type: 'photo',
          content: `photo_${order.id}_1.jpg`,
          timestamp: Date.now() - ((idx + 1) * 86400000),
          author: sampleUsers[1].name
        },
        {
          type: 'note',
          content: '已拍照留存，请相关负责人处理',
          timestamp: Date.now() - ((idx + 1) * 86400000) + 3600000,
          author: sampleUsers[1].name
        }
      ],
      resolution: idx >= 2 ? '已与客户协商达成一致' : undefined,
      resolvedAt: idx >= 2 ? Date.now() - (idx * 43200000) : undefined,
      createdAt: Date.now() - ((idx + 1) * 86400000)
    })
  })
  
  return issues
}

export function generateTimelineEvents(orders: Order[], batches: Batch[], issues: Issue[], handoverRecords?: HandoverRecord[]): TimelineEvent[] {
  const events: TimelineEvent[] = []
  
  orders.forEach(order => {
    events.push({
      id: generateId(),
      type: 'order',
      referenceId: order.id,
      action: '订单创建',
      description: `来自${sampleStores.find(s => s.id === order.storeId)?.name}`,
      operator: sampleUsers[4].name,
      timestamp: order.receivedAt
    })
  })
  
  batches.forEach(batch => {
    events.push({
      id: generateId(),
      type: 'batch',
      referenceId: batch.id,
      action: batch.type === 'rewash' ? '返洗批次创建' : '批次创建',
      description: `${batch.processType} - ${batch.orderIds.length}件`,
      operator: sampleUsers[3].name,
      timestamp: batch.createdAt
    })
  })
  
  issues.forEach(issue => {
    events.push({
      id: generateId(),
      type: 'issue',
      referenceId: issue.id,
      action: '问题上报',
      description: issue.title,
      operator: issue.reportedBy,
      timestamp: issue.reportedAt
    })
  })
  
  handoverRecords?.forEach(record => {
    events.push({
      id: generateId(),
      type: 'handover',
      referenceId: record.id,
      action: record.type === 'out' ? '门店交接出库' : '门店送厂入库',
      description: `${sampleStores.find(s => s.id === record.storeId)?.name} - ${record.orderIds.length}单`,
      timestamp: record.timestamp
    })
  })
  
  return events.sort((a, b) => b.timestamp - a.timestamp)
}

export async function loadSampleData(): Promise<void> {
  const existingOrders = await db.orders.count()
  if (existingOrders > 0) {
    console.log('已有数据，跳过加载示例数据')
    return
  }
  
  await db.transaction('rw', db.tables, async () => {
    await db.stores.bulkAdd(sampleStores)
    await db.users.bulkAdd(sampleUsers)
    
    const orders = generateSampleOrders()
    await db.orders.bulkAdd(orders)
    
    const batches = generateSampleBatches(orders)
    await db.batches.bulkAdd(batches)
    
    const processRecords = generateSampleProcessRecords(orders)
    await db.processRecords.bulkAdd(processRecords)
    
    const rewashRecords = generateSampleRewashRecords(orders)
    await db.rewashRecords.bulkAdd(rewashRecords)
    
    const issues = generateSampleIssues(orders)
    await db.issues.bulkAdd(issues)
    
    const handoverRecords = generateSampleHandoverRecords(orders)
    await db.handoverRecords.bulkAdd(handoverRecords)
    
    const timelineEvents = generateTimelineEvents(orders, batches, issues, handoverRecords)
    await db.timelineEvents.bulkAdd(timelineEvents)
  })
  
  console.log('示例数据加载完成')
}

export function generateSampleHandoverRecords(orders: Order[]): HandoverRecord[] {
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const records: HandoverRecord[] = []
  
  if (deliveredOrders.length > 0) {
    records.push({
      id: generateId(),
      type: 'out',
      orderIds: deliveredOrders.slice(0, 2).map(o => o.id),
      storeId: sampleStores[0].id,
      timestamp: Date.now() - 86400000,
      notes: '日常交接'
    })
  }
  
  return records
}
