import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  Order, Batch, ProcessRecord, RewashRecord, Issue, HandoverRecord, Store, User, TimelineEvent
} from './types'

export class LaundryDatabase extends Dexie {
  orders!: Table<Order>
  batches!: Table<Batch>
  processRecords!: Table<ProcessRecord>
  rewashRecords!: Table<RewashRecord>
  issues!: Table<Issue>
  handoverRecords!: Table<HandoverRecord>
  stores!: Table<Store>
  users!: Table<User>
  timelineEvents!: Table<TimelineEvent>

  constructor() {
    super('laundry-tracker')
    this.version(1).stores({
      orders: 'id, orderNo, storeId, status, receivedAt',
      batches: 'id, batchNo, status, createdAt',
      processRecords: 'id, orderId, stage, createdAt',
      rewashRecords: 'id, orderId, detectedAt',
      issues: 'id, orderId, status, reportedAt',
      handoverRecords: 'id, type, storeId, timestamp',
      stores: 'id, code',
      users: 'id, role',
      timelineEvents: 'id, type, referenceId, timestamp'
    })
  }
}

export const db = new LaundryDatabase()

export async function exportData(): Promise<string> {
  const [orders, batches, processRecords, rewashRecords, issues, handoverRecords, stores, users, timelineEvents] = await Promise.all([
    db.orders.toArray(),
    db.batches.toArray(),
    db.processRecords.toArray(),
    db.rewashRecords.toArray(),
    db.issues.toArray(),
    db.handoverRecords.toArray(),
    db.stores.toArray(),
    db.users.toArray(),
    db.timelineEvents.toArray()
  ])
  
  return JSON.stringify({
    version: 1,
    exportedAt: Date.now(),
    data: {
      orders,
      batches,
      processRecords,
      rewashRecords,
      issues,
      handoverRecords,
      stores,
      users,
      timelineEvents
    }
  }, null, 2)
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString)
  if (data.version !== 1) {
    throw new Error('不支持的数据版本')
  }
  
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(table => table.clear()))
    
    if (data.data.orders?.length) await db.orders.bulkAdd(data.data.orders)
    if (data.data.batches?.length) await db.batches.bulkAdd(data.data.batches)
    if (data.data.processRecords?.length) await db.processRecords.bulkAdd(data.data.processRecords)
    if (data.data.rewashRecords?.length) await db.rewashRecords.bulkAdd(data.data.rewashRecords)
    if (data.data.issues?.length) await db.issues.bulkAdd(data.data.issues)
    if (data.data.handoverRecords?.length) await db.handoverRecords.bulkAdd(data.data.handoverRecords)
    if (data.data.stores?.length) await db.stores.bulkAdd(data.data.stores)
    if (data.data.users?.length) await db.users.bulkAdd(data.data.users)
    if (data.data.timelineEvents?.length) await db.timelineEvents.bulkAdd(data.data.timelineEvents)
  })
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(table => table.clear()))
  })
}
