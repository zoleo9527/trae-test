import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Plot {
  id: number
  name: string
  area: string
  species: string
  status: string
  responsible_person: string
  created_at: string
  updated_at: string
  inventory?: PlotInventory[]
  statusLogs?: PlotStatusLog[]
  status_logs?: PlotStatusLog[]
}

export interface PlotInventory {
  id: number
  plot_id: number
  species: string
  total_count: number
  available_count: number
  reserved_count: number
  transferred_count: number
}

export interface PlotStatusLog {
  id: number
  plot_id: number
  from_status: string
  to_status: string
  reason: string
  operator: string
  note: string
  created_at: string
}

export interface Transfer {
  id: number
  plot_id: number
  customer_name: string
  species: string
  quantity: number
  status: string
  created_by: string
  approved_by: string | null
  expected_date: string
  created_at: string
  updated_at: string
  notes?: TransferNote[]
  plot?: Plot
}

export interface TransferNote {
  id: number
  transfer_id: number
  content: string
  author: string
  type: string
  created_at: string
}

export interface Task {
  id: number
  plot_id: number
  transfer_id: number | null
  type: 'lifting' | 'maintenance' | 'disease' | '起苗' | '养护' | '病害'
  title: string
  status: string
  assignee: string
  priority: string
  due_date: string
  completed_at: string | null
  created_at: string
  disease_report?: DiseaseReport
  notes?: TaskNote[]
}

export interface TaskNote {
  id: number
  task_id: number
  content: string
  author: string
  created_at: string
}

export interface DiseaseReport {
  id: number
  task_id: number
  plot_id: number
  disease_type: string
  severity: string
  description: string
  reported_by: string
  reported_at: string
  status: string
}

export interface LoadingOrder {
  id: number
  transfer_id: number
  vehicle_no: string
  driver_name: string
  status: string
  loaded_at: string
  created_by: string
  customer_name?: string
  species?: string
  items?: LoadingItem[]
  transfer?: Transfer
  has_discrepancy?: boolean
}

export interface LoadingItem {
  id: number
  loading_order_id: number
  species: string
  planned_qty: number
  actual_qty: number
  difference_reason: string
}

export interface Followup {
  id: number
  transfer_id: number
  customer_name: string
  contact_result: string
  satisfaction: string
  issue_description: string
  followup_by: string
  followup_at: string
  status: string
}

export interface Negotiation {
  id: number
  followup_id: number
  disease_report_id: number | null
  type: string
  status: string
  result: string
  negotiated_by: string
  created_at: string
  resolved_at: string | null
  customer_name?: string
  disease_type?: string
  severity?: string
  issue_description?: string
  notes?: NegotiationNote[]
}

export interface NegotiationNote {
  id: number
  negotiation_id: number
  content: string
  author: string
  created_at: string
}

export interface DashboardStats {
  total_plots: number
  active_plots: number
  pending_transfers: number
  pending_tasks: number
}

export interface DashboardAlert {
  id: number
  type: string
  title: string
  urgency: 'red' | 'amber' | 'gray'
  link: string
  created_at: string
}

export interface DashboardActivity {
  id: number
  type: string
  action: string
  actor: string
  timestamp: string
}

export interface CalendarEvent {
  id: number
  type: 'lifting' | 'maintenance' | 'disease' | 'loading' | 'followup'
  title: string
  date: string
  link: string
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    return data.data as T
  }
  return data as T
}

export const useDataStore = defineStore('data', () => {
  const plots = ref<Plot[]>([])
  const transfers = ref<Transfer[]>([])
  const tasks = ref<Task[]>([])
  const loadingOrders = ref<LoadingOrder[]>([])
  const followups = ref<Followup[]>([])
  const negotiations = ref<Negotiation[]>([])
  const dashboardStats = ref<DashboardStats | null>(null)
  const dashboardAlerts = ref<DashboardAlert[]>([])
  const dashboardActivities = ref<DashboardActivity[]>([])
  const calendarEvents = ref<CalendarEvent[]>([])

  const loadingPlots = ref(false)
  const loadingTransfers = ref(false)
  const loadingTasks = ref(false)
  const loadingOrders_loading = ref(false)
  const loadingFollowups = ref(false)
  const loadingNegotiations = ref(false)
  const loadingDashboard = ref(false)
  const loadingCalendar = ref(false)

  async function fetchPlots(params?: Record<string, string>) {
    loadingPlots.value = true
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await apiFetch<Plot[]>(`/api/plots${query}`)
      plots.value = data
    } finally {
      loadingPlots.value = false
    }
  }

  async function fetchPlot(id: number) {
    const data = await apiFetch<Plot>(`/api/plots/${id}`)
    return data
  }

  async function fetchTransfers(params?: Record<string, string>) {
    loadingTransfers.value = true
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await apiFetch<Transfer[]>(`/api/transfers${query}`)
      transfers.value = data
    } finally {
      loadingTransfers.value = false
    }
  }

  async function fetchTransfer(id: number) {
    const data = await apiFetch<Transfer>(`/api/transfers/${id}`)
    return data
  }

  async function createTransfer(payload: Partial<Transfer> & { created_by: string }) {
    return apiFetch<Transfer>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function approveTransfer(id: number, approved_by: string, action: 'approve' | 'reject', comment?: string) {
    return apiFetch(`/api/transfers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_by, action, comment }),
    })
  }

  async function addTransferNote(id: number, content: string, author: string, type?: string) {
    return apiFetch(`/api/transfers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, author, type }),
    })
  }

  async function fetchTasks(params?: Record<string, string>) {
    loadingTasks.value = true
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const data = await apiFetch<Task[]>(`/api/tasks${query}`)
      tasks.value = data
    } finally {
      loadingTasks.value = false
    }
  }

  async function createTask(payload: Partial<Task>) {
    return apiFetch<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function updateTaskStatus(id: number, status: string) {
    return apiFetch(`/api/tasks/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    })
  }

  async function fetchLoadingOrders() {
    loadingOrders_loading.value = true
    try {
      const data = await apiFetch<LoadingOrder[]>('/api/loading-orders')
      loadingOrders.value = data
    } finally {
      loadingOrders_loading.value = false
    }
  }

  async function fetchLoadingOrder(id: number) {
    const data = await apiFetch<LoadingOrder>(`/api/loading-orders/${id}`)
    return data
  }

  async function createLoadingOrder(payload: Partial<LoadingOrder>) {
    return apiFetch<LoadingOrder>('/api/loading-orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function fetchFollowups() {
    loadingFollowups.value = true
    try {
      const data = await apiFetch<Followup[]>('/api/followups')
      followups.value = data
    } finally {
      loadingFollowups.value = false
    }
  }

  async function createFollowup(payload: Partial<Followup>) {
    return apiFetch<Followup>('/api/followups', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function fetchNegotiations() {
    loadingNegotiations.value = true
    try {
      const data = await apiFetch<Negotiation[]>('/api/negotiations')
      negotiations.value = data
    } finally {
      loadingNegotiations.value = false
    }
  }

  async function updateNegotiation(id: number, payload: Partial<Negotiation>) {
    return apiFetch<Negotiation>(`/api/negotiations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  async function addNegotiationNote(id: number, content: string, author: string) {
    return apiFetch(`/api/negotiations/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, author }),
    })
  }

  async function fetchDashboardStats() {
    const data = await apiFetch<DashboardStats>('/api/dashboard/stats')
    dashboardStats.value = data
    return data
  }

  async function fetchDashboardAlerts() {
    const data = await apiFetch<DashboardAlert[]>('/api/dashboard/alerts')
    dashboardAlerts.value = data
    return data
  }

  async function fetchDashboardActivities() {
    const data = await apiFetch<DashboardActivity[]>('/api/dashboard/activities')
    dashboardActivities.value = data
    return data
  }

  async function fetchDashboard() {
    loadingDashboard.value = true
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchDashboardAlerts(),
        fetchDashboardActivities(),
      ])
    } finally {
      loadingDashboard.value = false
    }
  }

  async function fetchCalendarEvents(month: string, types?: string[]) {
    loadingCalendar.value = true
    try {
      const params: Record<string, string> = { month }
      if (types && types.length > 0) {
        params.type = types.join(',')
      }
      const query = new URLSearchParams(params).toString()
      const data = await apiFetch<CalendarEvent[]>(`/api/calendar?${query}`)
      calendarEvents.value = data
    } finally {
      loadingCalendar.value = false
    }
  }

  return {
    plots, transfers, tasks, loadingOrders, followups, negotiations,
    dashboardStats, dashboardAlerts, dashboardActivities, calendarEvents,
    loadingPlots, loadingTransfers, loadingTasks, loadingOrders_loading,
    loadingFollowups, loadingNegotiations, loadingDashboard, loadingCalendar,
    fetchPlots, fetchPlot, fetchTransfers, fetchTransfer,
    createTransfer, approveTransfer, addTransferNote,
    fetchTasks, createTask, updateTaskStatus,
    fetchLoadingOrders, fetchLoadingOrder, createLoadingOrder,
    fetchFollowups, createFollowup,
    fetchNegotiations, updateNegotiation, addNegotiationNote,
    fetchDashboard, fetchDashboardStats, fetchDashboardAlerts, fetchDashboardActivities,
    fetchCalendarEvents,
  }
})
