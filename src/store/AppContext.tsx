import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  User,
  Order,
  Delivery,
  BucketReturn,
  InventoryRecord,
  Inventory,
  Complaint,
  ReDelivery,
  TimelineEntry,
  DailyStats,
  UserRole,
} from '../types'
import {
  mockUsers,
  mockOrders,
  mockDeliveries,
  mockBucketReturns,
  mockInventoryRecords,
  mockInventory,
  mockComplaints,
  mockReDeliveries,
  mockTimeline,
  mockDailyStats,
} from '../data/mockData'

interface AppContextType {
  currentUser: User
  setCurrentUser: (user: User) => void
  users: User[]
  orders: Order[]
  deliveries: Delivery[]
  bucketReturns: BucketReturn[]
  inventoryRecords: InventoryRecord[]
  inventory: Inventory[]
  complaints: Complaint[]
  reDeliveries: ReDelivery[]
  timeline: TimelineEntry[]
  dailyStats: DailyStats[]
  
  updateOrder: (order: Order) => void
  addOrder: (order: Order) => void
  updateDelivery: (delivery: Delivery) => void
  updateBucketReturn: (bucketReturn: BucketReturn) => void
  addComplaint: (complaint: Complaint) => void
  updateComplaint: (complaint: Complaint) => void
  addInventoryRecord: (record: InventoryRecord) => void
  addTimelineEntry: (entry: TimelineEntry) => void
  addReDelivery: (redelivery: ReDelivery) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const defaultUser: User = mockUsers[0]

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(defaultUser)
  const [users] = useState<User[]>(mockUsers)
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries)
  const [bucketReturns, setBucketReturns] = useState<BucketReturn[]>(mockBucketReturns)
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>(mockInventoryRecords)
  const [inventory, setInventory] = useState<Inventory[]>(mockInventory)
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints)
  const [reDeliveries, setReDeliveries] = useState<ReDelivery[]>(mockReDeliveries)
  const [timeline, setTimeline] = useState<TimelineEntry[]>(mockTimeline)
  const [dailyStats] = useState<DailyStats[]>(mockDailyStats)

  const updateOrder = useCallback((order: Order) => {
    setOrders(prev => prev.map(o => o.id === order.id ? order : o))
  }, [])

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [order, ...prev])
  }, [])

  const updateDelivery = useCallback((delivery: Delivery) => {
    setDeliveries(prev => prev.map(d => d.id === delivery.id ? delivery : d))
  }, [])

  const updateBucketReturn = useCallback((bucketReturn: BucketReturn) => {
    setBucketReturns(prev => prev.map(br => br.id === bucketReturn.id ? bucketReturn : br))
  }, [])

  const addComplaint = useCallback((complaint: Complaint) => {
    setComplaints(prev => [complaint, ...prev])
  }, [])

  const updateComplaint = useCallback((complaint: Complaint) => {
    setComplaints(prev => prev.map(c => c.id === complaint.id ? complaint : c))
  }, [])

  const addInventoryRecord = useCallback((record: InventoryRecord) => {
    setInventoryRecords(prev => [record, ...prev])
    setInventory(prev => prev.map(inv => {
      if (inv.itemType === record.itemType) {
        return { ...inv, totalQuantity: record.afterQuantity, lastUpdated: record.operatedAt }
      }
      return inv
    }))
  }, [])

  const addTimelineEntry = useCallback((entry: TimelineEntry) => {
    setTimeline(prev => [entry, ...prev])
  }, [])

  const addReDelivery = useCallback((redelivery: ReDelivery) => {
    setReDeliveries(prev => [redelivery, ...prev])
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        orders,
        deliveries,
        bucketReturns,
        inventoryRecords,
        inventory,
        complaints,
        reDeliveries,
        timeline,
        dailyStats,
        updateOrder,
        addOrder,
        updateDelivery,
        updateBucketReturn,
        addComplaint,
        updateComplaint,
        addInventoryRecord,
        addTimelineEntry,
        addReDelivery,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function hasPermission(role: UserRole, action: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    station_master: [
      'view_all',
      'manage_orders',
      'assign_delivery',
      'manage_drivers',
      'resolve_disputes',
      'view_inventory',
      'adjust_inventory',
      'manage_complaints',
      'view_dashboard',
      'generate_reports',
    ],
    driver: [
      'view_my_deliveries',
      'update_delivery_status',
      'collect_buckets',
      'upload_photos',
      'report_issues',
    ],
    customer_service: [
      'create_order',
      'view_orders',
      'create_complaint',
      'update_complaint',
      'view_complaints',
      'communicate_customers',
      'schedule_redelivery',
    ],
  }
  return permissions[role]?.includes(action) ?? false
}
