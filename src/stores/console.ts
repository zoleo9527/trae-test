import type {
    HistoryEntry,
    OverviewSummary,
    ReconciliationRecord,
    ReturnApplication,
    ReturnStatus,
    Role,
    SampleReceipt,
    StockTransfer,
} from '@/types/domain'
import {
    seedReceipts,
    seedReconciliation,
    seedReturns,
    seedTransfers,
} from '@/utils/seed'
import { defineStore } from 'pinia'

interface ConsoleState {
  role: Role
  returns: ReturnApplication[]
  transfers: StockTransfer[]
  receipts: SampleReceipt[]
  reconciliations: ReconciliationRecord[]
  selectedReturnId?: string
  selectedTransferId?: string
  selectedReconciliationId?: string
  drawer: {
    visible: boolean
    mode: 'exception' | 'detail' | 'reject' | 'receipt'
    title: string
    context?: unknown
  }
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 100)}`
}

function timestamp() {
  const d = new Date()
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const useConsoleStore = defineStore('console', {
  state: (): ConsoleState => {
    const returns = seedReturns()
    const transfers = seedTransfers(returns)
    return {
      role: 'channel',
      returns,
      transfers,
      receipts: seedReceipts(returns),
      reconciliations: seedReconciliation(returns),
      drawer: { visible: false, mode: 'exception', title: '' },
    }
  },
  getters: {
    pendingReturns(state): ReturnApplication[] {
      return state.returns.filter(r => ['submitted', 'reviewing'].includes(r.status))
    },
    approvedReturns(state): ReturnApplication[] {
      return state.returns.filter(r => r.status === 'approved' || r.status === 'closed')
    },
    rejectedReturns(state): ReturnApplication[] {
      return state.returns.filter(r => r.status === 'rejected')
    },
    needReviewReturns(state): ReturnApplication[] {
      return state.returns.filter(r => r.lines.some(l => l.reason === '包装破损'))
    },
    missingReceipts(state): SampleReceipt[] {
      return state.receipts.filter(r => r.status === 'missing')
    },
    mismatchedReconciliation(state): ReconciliationRecord[] {
      return state.reconciliations.filter(r => r.status === 'mismatch')
    },
    openTransfers(state): StockTransfer[] {
      return state.transfers.filter(t => t.status !== 'completed')
    },
    overview(state): OverviewSummary {
      return {
        pending: state.returns.filter(r => ['submitted', 'reviewing'].includes(r.status)).length,
        rejected: state.returns.filter(r => r.status === 'rejected').length,
        needReview: state.returns.filter(r => r.lines.some(l => l.reason === '包装破损')).length,
        inTransfer: state.transfers.filter(t => t.status !== 'completed').length,
        receiptsMissing: state.receipts.filter(r => r.status === 'missing').length,
        mismatches: state.reconciliations.filter(r => r.status === 'mismatch').length,
      }
    },
    selectedReturn(state): ReturnApplication | undefined {
      return state.returns.find(r => r.id === state.selectedReturnId)
    },
    selectedTransfer(state): StockTransfer | undefined {
      return state.transfers.find(t => t.id === state.selectedTransferId)
    },
    selectedReconciliation(state): ReconciliationRecord | undefined {
      return state.reconciliations.find(r => r.id === state.selectedReconciliationId)
    },
  },
  actions: {
    setRole(role: Role) {
      this.role = role
    },
    selectReturn(id?: string) {
      this.selectedReturnId = id
    },
    selectTransfer(id?: string) {
      this.selectedTransferId = id
    },
    selectReconciliation(id?: string) {
      this.selectedReconciliationId = id
    },
    openDrawer(payload: Partial<ConsoleState['drawer']> & { visible: true }) {
      this.drawer = { ...this.drawer, ...payload }
    },
    closeDrawer() {
      this.drawer.visible = false
    },
    appendHistory(target: 'return' | 'transfer', id: string, entry: Omit<HistoryEntry, 'id' | 'timestamp'>) {
      const list: Array<{ id: string; history: HistoryEntry[] }> =
        target === 'return' ? this.returns : this.transfers
      const found = list.find(x => x.id === id)
      if (found) {
        found.history.push({ id: uid('h_'), timestamp: timestamp(), ...entry })
      }
    },
    approveReturn(id: string, comment: string) {
      const target = this.returns.find(r => r.id === id)
      if (!target) return
      const prev = target.status
      target.status = 'approved'
      this.appendHistory('return', id, {
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '审核通过',
        from: prev,
        to: 'approved',
        comment,
      })
      const transfer: StockTransfer = {
        id: uid('TR'),
        returnApplicationId: id,
        initiator: '发行专员·周凯',
        status: 'pending',
        createdAt: timestamp().slice(0, 10),
        expectedDate: timestamp().slice(0, 10),
        completedAt: undefined,
        lines: target.lines.map(l => ({
          isbn: l.isbn,
          title: l.title,
          qty: l.returnedQty,
          from: '总仓',
          to: target.channelName,
        })),
        risk: 'medium',
        note: '系统自动生成，待物流安排',
        history: [
          {
            id: uid('h_'),
            timestamp: timestamp(),
            role: 'issuer',
            operator: '发行专员·周凯',
            action: '生成调拨单',
            from: 'pending',
            to: 'pending',
            comment: `关联退货申请 ${id}`,
          },
        ],
      }
      target.linkedTransferId = transfer.id
      this.transfers.push(transfer)
    },
    rejectReturn(id: string, comment: string) {
      const target = this.returns.find(r => r.id === id)
      if (!target) return
      const prev = target.status
      target.status = 'rejected'
      this.appendHistory('return', id, {
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '驳回申请',
        from: prev,
        to: 'rejected',
        comment,
      })
    },
    submitReturn(id: string) {
      const target = this.returns.find(r => r.id === id)
      if (!target) return
      if (target.status === 'draft') {
        target.status = 'submitted'
        this.appendHistory('return', id, {
          role: 'channel',
          operator: target.manager,
          action: '提交退货申请',
          from: 'draft',
          to: 'submitted',
          comment: '渠道提交退货申请',
        })
      }
    },
    shipTransfer(id: string, courier: string, trackingNo: string) {
      const target = this.transfers.find(t => t.id === id)
      if (!target) return
      target.status = 'processing'
      target.courier = courier
      target.trackingNo = trackingNo
      this.appendHistory('transfer', id, {
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '安排发货',
        from: 'pending',
        to: 'processing',
        comment: `${courier} · ${trackingNo}`,
      })
    },
    completeTransfer(id: string) {
      const target = this.transfers.find(t => t.id === id)
      if (!target) return
      target.status = 'completed'
      target.completedAt = timestamp().slice(0, 10)
      this.appendHistory('transfer', id, {
        role: 'channel',
        operator: target.lines[0]?.to ?? '渠道经理',
        action: '确认签收',
        from: 'processing',
        to: 'completed',
      })
    },
    confirmReceipt(id: string) {
      const target = this.receipts.find(r => r.id === id)
      if (!target) return
      target.status = 'confirmed'
      target.confirmedAt = timestamp().slice(0, 10)
    },
    markReconciliationReviewed(id: string, comment: string) {
      const target = this.reconciliations.find(r => r.id === id)
      if (!target) return
      target.lastCheckedAt = timestamp()
      target.checker = '财务对接·孙雯'
      target.status = 'matched'
      target.caliber = comment || '已重新核对铺货台账，口径一致'
    },
    canTransitionTo(status: ReturnStatus, role: Role): Array<'submit' | 'approve' | 'reject' | 'resubmit'> {
      if (role === 'channel') {
        return status === 'draft' ? ['submit'] : []
      }
      if (role === 'issuer') {
        if (status === 'submitted' || status === 'reviewing') return ['approve', 'reject']
      }
      if (role === 'finance') {
        return []
      }
      return []
    },
  },
})
