import { create } from 'zustand'

export type Role = 'manager' | 'selector' | 'butler'

export interface Order {
  id: string
  customer_name: string
  order_no: string
  shoot_date: string
  select_date: string | null
  total_amount: number
  paid_amount: number
  status: string
  collection_level: number
  current_reschedule_id: string | null
  created_at: string
  updated_at: string
  event_count: number
  pending_reschedule_count: number
  latest_retouch_version: number | null
}

export interface TimelineEvent {
  id: string
  order_id: string
  type: string
  actor_role: string
  actor_name: string
  at: string
  payload: string
}

export interface Reschedule {
  id: string
  order_id: string
  suggested_from: string
  suggested_to: string
  reason: string
  status: string
  approver_role: string | null
  approver_name: string | null
  approved_at: string | null
  reject_reason: string | null
  created_at: string
  customer_name?: string
  order_no?: string
  original_shoot_date?: string
}

export interface Collection {
  id: string
  order_id: string
  method: string
  result: string
  remark: string | null
  actor_role: string
  actor_name: string
  created_at: string
}

export interface Retouch {
  id: string
  order_id: string
  version_no: number
  remark: string | null
  created_at: string
  actor_role: string
  actor_name: string
}

export interface Alerts {
  overdue: number
  pendingReschedule: number
  awaitingPayment: number
  rescheduling: number
}

export interface FeedEvent extends TimelineEvent {
  customer_name: string
  order_no: string
}

interface StudioState {
  role: Role
  orders: Order[]
  alerts: Alerts
  feed: FeedEvent[]
  loading: boolean
  setRole: (role: Role) => void
  loadAll: () => Promise<void>
}

const ROLE_STORAGE_KEY = 'studio-role'

export const roleLabel: Record<Role, string> = {
  manager: '店长',
  selector: '选片师',
  butler: '客服管家',
}

export const roleName: Record<Role, string> = {
  manager: '店长·周嘉诚',
  selector: '选片师·江书言',
  butler: '客服管家·谢予安',
}

const defaultRole = (): Role => {
  if (typeof window === 'undefined') return 'manager'
  const stored = window.localStorage.getItem(ROLE_STORAGE_KEY)
  if (stored === 'manager' || stored === 'selector' || stored === 'butler') return stored
  return 'manager'
}

export const useStudio = create<StudioState>((set, get) => ({
  role: defaultRole(),
  orders: [],
  alerts: { overdue: 0, pendingReschedule: 0, awaitingPayment: 0, rescheduling: 0 },
  feed: [],
  loading: false,
  setRole: (role) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(ROLE_STORAGE_KEY, role)
    set({ role })
  },
  loadAll: async () => {
    set({ loading: true })
    try {
      const [ordersRes, alertsRes, feedRes] = await Promise.all([
        fetch('/api/studio/orders'),
        fetch('/api/studio/alerts'),
        fetch('/api/studio/timeline'),
      ])
      const orders = await ordersRes.json()
      const alerts = await alertsRes.json()
      const feed = await feedRes.json()
      set({
        orders: orders.data || [],
        alerts: alerts.data || { overdue: 0, pendingReschedule: 0, awaitingPayment: 0, rescheduling: 0 },
        feed: feed.data || [],
      })
    } finally {
      set({ loading: false })
    }
  },
}))

export const statusLabel: Record<string, string> = {
  scheduled: '已排期',
  selected: '已选片',
  awaiting_payment: '待尾款',
  completed: '已完成',
  overdue: '已逾期',
  rescheduling: '改期中',
  cancelled: '已取消',
}

export const statusDot: Record<string, string> = {
  scheduled: 'bg-status-scheduled',
  selected: 'bg-status-selected',
  awaiting_payment: 'bg-status-awaiting_payment',
  completed: 'bg-status-completed',
  overdue: 'bg-status-overdue',
  rescheduling: 'bg-status-rescheduling',
  cancelled: 'bg-status-cancelled',
}

export const eventTypeLabel: Record<string, string> = {
  status: '状态变更',
  reschedule: '改期',
  collection: '催收',
  retouch: '修片',
  note: '备注',
  remind: '提醒',
}

export const collectionMethodLabel: Record<string, string> = {
  wechat: '微信',
  phone: '电话',
  onsite: '到店',
  other: '其他',
}

export const collectionResultLabel: Record<string, string> = {
  contacted: '已联系',
  responded: '已回应',
  escalated: '已升级',
  paid: '已付清',
  unpaid: '未付款',
}
