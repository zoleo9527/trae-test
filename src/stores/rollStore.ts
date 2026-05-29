import { create } from 'zustand'

export type RollStatus =
  | 'registered'
  | 'developing'
  | 'qc_pending'
  | 'qc_passed'
  | 'qc_failed'
  | 'reworking'
  | 'recheck'
  | 'confirming'
  | 'compensating'
  | 'completed'

export interface FilmRoll {
  id: string
  roll_number: string
  customer_name: string
  customer_contact: string
  film_type: string
  scan_spec: string
  status: RollStatus
  registered_at: string
  due_date: string
  assignee_id: string | null
  notes: string
}

export interface ActionRecord {
  id: string
  roll_id: string
  action_type: string
  operator_id: string
  operator_role: string
  detail: string
  created_at: string
}

export interface QcRecord {
  id: string
  roll_id: string
  result: string
  issue_desc: string
  impact_scope: string
  operator_id: string
  created_at: string
}

export interface ReworkDecision {
  id: string
  qc_id: string
  roll_id: string
  decision: string
  reason: string
  decided_by: string
  created_at: string
}

export interface ReworkExecution {
  id: string
  decision_id: string
  roll_id: string
  action_detail: string
  result: string
  operator_id: string
  created_at: string
}

export interface RecheckRecord {
  id: string
  execution_id: string
  roll_id: string
  result: string
  note: string
  checked_by: string
  created_at: string
}

export interface ConfirmRequest {
  id: string
  roll_id: string
  delivery_desc: string
  operator_id: string
  created_at: string
}

export interface ConfirmResult {
  id: string
  request_id: string
  roll_id: string
  result: string
  feedback: string
  operator_id: string
  created_at: string
}

export interface CompensationRecord {
  id: string
  confirm_result_id: string
  roll_id: string
  amount: number
  method: string
  reason: string
  approved_by: string
  created_at: string
}

export interface RollDetail extends FilmRoll {
  actions: ActionRecord[]
  qc_records: QcRecord[]
  rework_decisions: ReworkDecision[]
  rework_executions: ReworkExecution[]
  recheck_records: RecheckRecord[]
  confirm_requests: ConfirmRequest[]
  confirm_results: ConfirmResult[]
  compensation_records: CompensationRecord[]
}

interface RollFilters {
  status: string
  search: string
}

interface RollState {
  rolls: FilmRoll[]
  currentRoll: RollDetail | null
  loading: boolean
  filters: RollFilters
  fetchRolls: () => Promise<void>
  fetchRollDetail: (id: string) => Promise<void>
  createRoll: (data: Partial<FilmRoll>) => Promise<boolean>
  updateRoll: (id: string, data: Partial<FilmRoll>) => Promise<boolean>
  setFilter: (filters: Partial<RollFilters>) => void
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || '请求失败')
  return json.data as T
}

export const useRollStore = create<RollState>((set, get) => ({
  rolls: [],
  currentRoll: null,
  loading: false,
  filters: { status: '', search: '' },

  fetchRolls: async () => {
    set({ loading: true })
    try {
      const { filters } = get()
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await apiFetch<FilmRoll[]>(`/api/rolls${query}`)
      set({ rolls: data })
    } catch (e) {
      console.error('获取胶卷列表失败:', e)
    } finally {
      set({ loading: false })
    }
  },

  fetchRollDetail: async (id: string) => {
    set({ loading: true })
    try {
      const data = await apiFetch<RollDetail>(`/api/rolls/${id}`)
      set({ currentRoll: data })
    } catch (e) {
      console.error('获取胶卷详情失败:', e)
    } finally {
      set({ loading: false })
    }
  },

  createRoll: async (data) => {
    try {
      await apiFetch<FilmRoll>('/api/rolls', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('创建胶卷失败:', e)
      return false
    }
  },

  updateRoll: async (id, data) => {
    try {
      await apiFetch<FilmRoll>(`/api/rolls/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      await get().fetchRollDetail(id)
      return true
    } catch (e) {
      console.error('更新胶卷失败:', e)
      return false
    }
  },

  setFilter: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }))
  },
}))
