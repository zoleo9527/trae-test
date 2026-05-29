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
  roll_number?: string
  customer_name?: string
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

export interface CalendarDay {
  date: string
  action_count: number
  roll_ids: string[]
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
  fetchRollDetail: (id: string) => Promise<RollDetail | null>
  createRoll: (data: Partial<FilmRoll> & { operator_id?: string; operator_role?: string }) => Promise<boolean>
  updateRoll: (id: string, data: Partial<FilmRoll>) => Promise<boolean>
  setFilter: (filters: Partial<RollFilters>) => void
  fetchRecentActions: (limit?: number) => Promise<ActionRecord[]>
  fetchCalendarData: (month: string) => Promise<CalendarDay[]>
  fetchDailyActions: (date: string) => Promise<ActionRecord[]>
  startDevelop: (rollId: string, operatorId: string, operatorRole: string) => Promise<boolean>
  submitQc: (rollId: string, data: { result: string; issue_desc: string; impact_scope: string; operator_id: string; operator_role?: string }) => Promise<boolean>
  submitReworkDecision: (rollId: string, qcId: string, data: { decision: string; reason: string; decided_by: string; operator_role?: string }) => Promise<boolean>
  executeRework: (rollId: string, decisionId: string, data: { action_detail: string; result: string; operator_id: string; operator_role?: string }) => Promise<boolean>
  submitRecheck: (rollId: string, executionId: string, data: { result: string; note: string; checked_by: string; operator_role?: string }) => Promise<boolean>
  requestConfirm: (rollId: string, data: { delivery_desc: string; operator_id: string }) => Promise<boolean>
  submitConfirmResult: (rollId: string, requestId: string, data: { result: string; feedback: string; operator_id: string }) => Promise<boolean>
  submitCompensation: (rollId: string, confirmResultId: string, data: { amount: number; method: string; reason: string; approved_by: string }) => Promise<boolean>
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
      return data
    } catch (e) {
      console.error('获取胶卷详情失败:', e)
      return null
    } finally {
      set({ loading: false })
    }
  },

  createRoll: async (data: Partial<FilmRoll> & { operator_id?: string; operator_role?: string }) => {
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

  fetchRecentActions: async (limit = 20) => {
    try {
      return await apiFetch<ActionRecord[]>(`/api/actions?limit=${limit}`)
    } catch (e) {
      console.error('获取最近动作失败:', e)
      return []
    }
  },

  fetchCalendarData: async (month: string) => {
    try {
      return await apiFetch<CalendarDay[]>(`/api/actions/calendar?month=${month}`)
    } catch (e) {
      console.error('获取日历数据失败:', e)
      return []
    }
  },

  fetchDailyActions: async (date: string) => {
    try {
      return await apiFetch<ActionRecord[]>(`/api/actions/daily/${date}`)
    } catch (e) {
      console.error('获取当日动作失败:', e)
      return []
    }
  },

  startDevelop: async (rollId, operatorId, operatorRole) => {
    try {
      await apiFetch(`/api/actions/develop`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, operator_id: operatorId, operator_role: operatorRole }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('开始冲扫失败:', e)
      return false
    }
  },

  submitQc: async (rollId, data) => {
    try {
      await apiFetch(`/api/qc/submit`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('提交质检失败:', e)
      return false
    }
  },

  submitReworkDecision: async (rollId, qcId, data) => {
    try {
      await apiFetch(`/api/qc/rework-decision`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, qc_id: qcId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('提交返工决策失败:', e)
      return false
    }
  },

  executeRework: async (rollId, decisionId, data) => {
    try {
      await apiFetch(`/api/qc/rework-execute`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, decision_id: decisionId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('执行返工失败:', e)
      return false
    }
  },

  submitRecheck: async (rollId, executionId, data) => {
    try {
      await apiFetch(`/api/qc/recheck`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, execution_id: executionId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('提交复检失败:', e)
      return false
    }
  },

  requestConfirm: async (rollId, data) => {
    try {
      await apiFetch(`/api/confirm/request`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('发起确认失败:', e)
      return false
    }
  },

  submitConfirmResult: async (rollId, requestId, data) => {
    try {
      await apiFetch(`/api/confirm/result`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, request_id: requestId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('提交确认结果失败:', e)
      return false
    }
  },

  submitCompensation: async (rollId, confirmResultId, data) => {
    try {
      await apiFetch(`/api/confirm/compensate`, {
        method: 'POST',
        body: JSON.stringify({ roll_id: rollId, confirm_result_id: confirmResultId, ...data }),
      })
      await get().fetchRollDetail(rollId)
      await get().fetchRolls()
      return true
    } catch (e) {
      console.error('提交赔付失败:', e)
      return false
    }
  },
}))
