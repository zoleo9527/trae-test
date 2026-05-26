import type {
    HistoryEntry,
    OverviewSummary,
    ReceiptMethod,
    ReconciliationRecord,
    ReturnApplication,
    ReturnLine,
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

export type DrawerContextKind = 'return' | 'transfer' | 'receipt' | 'reconciliation' | null

interface ConsoleState {
  role: Role
  returns: ReturnApplication[]
  transfers: StockTransfer[]
  receipts: SampleReceipt[]
  reconciliations: ReconciliationRecord[]
  selectedReturnId?: string
  selectedTransferId?: string
  selectedReceiptId?: string
  selectedReconciliationId?: string
  drawer: {
    visible: boolean
    mode: 'detail' | 'edit' | 'exception' | 'receipt' | 'reconcile'
    title: string
    contextKind: DrawerContextKind
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
      drawer: { visible: false, mode: 'detail', title: '', contextKind: null },
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
    draftReturns(state): ReturnApplication[] {
      return state.returns.filter(r => r.status === 'draft')
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
        reconciled: state.reconciliations.filter(r => r.status === 'matched').length,
      }
    },
    selectedReturn(state): ReturnApplication | undefined {
      return state.returns.find(r => r.id === state.selectedReturnId)
    },
    selectedTransfer(state): StockTransfer | undefined {
      return state.transfers.find(t => t.id === state.selectedTransferId)
    },
    selectedReceipt(state): SampleReceipt | undefined {
      return state.receipts.find(r => r.id === state.selectedReceiptId)
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
    selectReceipt(id?: string) {
      this.selectedReceiptId = id
    },
    selectReconciliation(id?: string) {
      this.selectedReconciliationId = id
    },
    openDrawer(payload: Partial<Omit<ConsoleState['drawer'], 'visible'>> & { visible: true }) {
      this.drawer = { ...this.drawer, ...payload }
    },
    closeDrawer() {
      this.drawer.visible = false
    },
    appendHistory(
      target: 'return' | 'transfer' | 'receipt' | 'reconciliation',
      id: string,
      entry: Omit<HistoryEntry, 'id' | 'timestamp'>,
    ) {
      const pool: Array<{ id: string; history: HistoryEntry[] }> =
        target === 'return'
          ? this.returns
          : target === 'transfer'
            ? this.transfers
            : target === 'receipt'
              ? this.receipts
              : this.reconciliations
      const found = pool.find(x => x.id === id)
      if (found) {
        found.history.push({ id: uid('h_'), timestamp: timestamp(), ...entry })
      }
    },
    createDraftReturn() {
      const id = uid('RT')
      const draft: ReturnApplication = {
        id,
        channelCode: '',
        channelName: '',
        manager: '当前用户',
        createdAt: timestamp().slice(0, 10),
        deadline: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
        status: 'draft',
        totalAmount: 0,
        lines: [],
        note: '',
        attachments: [],
        history: [
          {
            id: uid('h_'),
            timestamp: timestamp(),
            role: 'channel',
            operator: '当前用户',
            action: '创建草稿',
            comment: '等待补充明细',
          },
        ],
      }
      this.returns.unshift(draft)
      this.selectReturn(id)
      this.openDrawer({
        visible: true,
        mode: 'edit',
        contextKind: 'return',
        title: `新建退货申请 ${id}`,
        context: draft,
      })
      return id
    },
    updateDraftReturn(id: string, patch: Partial<Pick<ReturnApplication, 'channelCode' | 'channelName' | 'deadline' | 'note'>>) {
      const target = this.returns.find(r => r.id === id)
      if (!target || target.status !== 'draft') return
      Object.assign(target, patch)
      this.appendHistory('return', id, {
        role: 'channel',
        operator: target.manager,
        action: '更新草稿',
        comment: `修改了基础信息`,
      })
    },
    addReturnLine(id: string, line: Omit<ReturnLine, 'isbn'> & { isbn?: string }) {
      const target = this.returns.find(r => r.id === id)
      if (!target || target.status !== 'draft') return
      const newLine: ReturnLine = {
        isbn: line.isbn || '9787' + Math.floor(100000000 + Math.random() * 900000000),
        title: line.title || '未命名图书',
        author: line.author || '',
        category: line.category || '',
        price: line.price || 0,
        distributedQty: line.distributedQty || 0,
        returnedQty: line.returnedQty || 0,
        reason: line.reason || '',
      }
      target.lines.push(newLine)
      target.totalAmount = target.lines.reduce((s, l) => s + l.price * l.returnedQty, 0)
      this.appendHistory('return', id, {
        role: 'channel',
        operator: target.manager,
        action: '新增退货明细',
        comment: `《${newLine.title}》· 退货 ${newLine.returnedQty} 册`,
      })
    },
    removeReturnLine(id: string, lineIndex: number) {
      const target = this.returns.find(r => r.id === id)
      if (!target || target.status !== 'draft') return
      const removed = target.lines.splice(lineIndex, 1)
      target.totalAmount = target.lines.reduce((s, l) => s + l.price * l.returnedQty, 0)
      if (removed[0]) {
        this.appendHistory('return', id, {
          role: 'channel',
          operator: target.manager,
          action: '删除退货明细',
          comment: `《${removed[0].title}》`,
        })
      }
    },
    updateReturnLine(
      id: string,
      lineIndex: number,
      patch: Partial<ReturnLine>,
      changed: string[] = [],
      silent = false,
    ) {
      const target = this.returns.find(r => r.id === id)
      if (!target || target.status !== 'draft') return
      const line = target.lines[lineIndex]
      if (!line) return
      Object.assign(line, patch)
      target.totalAmount = target.lines.reduce((s, l) => s + l.price * l.returnedQty, 0)
      if (!silent && changed.length) {
        this.appendHistory('return', id, {
          role: 'channel',
          operator: target.manager,
          action: '修改退货明细',
          comment: changed.join('；'),
        })
      }
    },
    submitReturn(id: string) {
      const target = this.returns.find(r => r.id === id)
      if (!target) return
      if (target.status !== 'draft') return
      if (target.lines.length === 0) {
        throw new Error('请至少添加一条退货明细后再提交')
      }
      if (!target.channelName || target.channelName.trim().length === 0) {
        throw new Error('请填写渠道名称后再提交')
      }
      const invalidLine = target.lines.find(
        l =>
          !l.title ||
          l.title.trim().length === 0 ||
          !l.returnedQty ||
          l.returnedQty <= 0,
      )
      if (invalidLine) {
        throw new Error('存在未完善的退货明细，请补全书名与退货数量后再提交')
      }
      target.status = 'submitted'
      this.appendHistory('return', id, {
        role: 'channel',
        operator: target.manager,
        action: '提交退货申请',
        from: 'draft',
        to: 'submitted',
        comment: `共 ${target.lines.length} 条明细，金额 ¥${target.totalAmount.toFixed(2)}`,
      })
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
    handleException(id: string, kind: 'return' | 'transfer', action: 'reject' | 'approve' | 'resubmit', comment: string, exceptionType: string) {
      if (kind === 'return') {
        const target = this.returns.find(r => r.id === id)
        if (!target) return
        if (action === 'reject') {
          this.rejectReturn(id, `[${exceptionType}] ${comment}`)
        } else if (action === 'approve') {
          this.approveReturn(id, `[${exceptionType}] ${comment}`)
        } else {
          this.appendHistory('return', id, {
            role: 'issuer',
            operator: '发行专员·周凯',
            action: '退回补充',
            comment: `[${exceptionType}] ${comment}`,
          })
        }
      } else {
        const target = this.transfers.find(t => t.id === id)
        if (!target) return
        this.appendHistory('transfer', id, {
          role: action === 'reject' ? 'issuer' : action === 'approve' ? 'issuer' : 'issuer',
          operator: '发行专员·周凯',
          action:
            action === 'reject' ? '驳回调拨' : action === 'approve' ? '附说明通过' : '退回补充',
          from: target.status,
          to: action === 'reject' ? 'rejected' : target.status,
          comment: `[${exceptionType}] ${comment}`,
        })
        if (action === 'reject') {
          target.status = 'rejected'
        }
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
    updateReceipt(id: string, data: { receiptCode: string; method: ReceiptMethod; remark: string }) {
      const target = this.receipts.find(r => r.id === id)
      if (!target) return
      target.receiptCode = data.receiptCode
      target.method = data.method
      target.remark = data.remark
      target.status = 'confirmed'
      target.confirmedAt = timestamp().slice(0, 10)
      target.submittedAt = target.submittedAt || timestamp().slice(0, 10)
      const methodLabel = { mail: '纸质寄回', online: '线上扫描', note: '书面说明' }[data.method]
      this.appendHistory('receipt', id, {
        role: 'channel',
        operator: target.channel,
        action: '补录回执',
        comment: `回执编号 ${data.receiptCode}，${methodLabel}${data.remark ? ` · ${data.remark}` : ''}`,
      })
    },
    markReconciliationReviewed(id: string, comment: string) {
      const target = this.reconciliations.find(r => r.id === id)
      if (!target) return
      const prev = target.status
      target.lastCheckedAt = timestamp()
      target.checker = '财务对接·孙雯'
      target.status = 'matched'
      target.caliber = comment || '已重新核对铺货台账，口径一致'
      this.appendHistory('reconciliation', id, {
        role: 'finance',
        operator: '财务对接·孙雯',
        action: '重新核对',
        from: prev,
        to: 'matched',
        comment: target.caliber,
      })
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
