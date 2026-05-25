import type {
    BookItem,
    HistoryEntry,
    ReconciliationRecord,
    ReturnApplication,
    ReturnLine,
    SampleReceipt,
    StockTransfer,
} from '@/types/domain'

const BOOKS: BookItem[] = [
  { isbn: '9787111000001', title: '增长黑客实战', author: '张一鸣', category: '经管', price: 68 },
  { isbn: '9787111000002', title: '产品经理的第一性原理', author: '李开复', category: '经管', price: 72 },
  { isbn: '9787111000003', title: '渠道运营的艺术', author: '王石', category: '发行', price: 58 },
  { isbn: '9787111000004', title: '新书铺货手册', author: '任正非', category: '发行', price: 49 },
  { isbn: '9787111000005', title: '数据分析入门到进阶', author: '吴军', category: '技术', price: 89 },
  { isbn: '9787111000006', title: '财务视角的发行风险', author: '曹德旺', category: '财务', price: 66 },
]

const CHANNELS = [
  { code: 'CH001', name: '华东新华·上海书城' },
  { code: 'CH002', name: '博库·杭州总店' },
  { code: 'CH003', name: '文轩·成都旗舰店' },
  { code: 'CH004', name: '当当·自营仓' },
  { code: 'CH005', name: '京东·图书仓' },
]

const MANAGERS = ['林夏', '陈默', '王浩然', '赵一鸣']

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 100)}`
}

function randomLines(count: number): ReturnLine[] {
  const picked = [...BOOKS].sort(() => Math.random() - 0.5).slice(0, count)
  return picked.map(b => {
    const distributedQty = 40 + Math.floor(Math.random() * 200)
    const returnedQty = Math.floor(distributedQty * (0.2 + Math.random() * 0.3))
    const reasons = ['滞销', '包装破损', '样书寄回', '渠道撤架', '临时停售']
    return {
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      category: b.category,
      price: b.price,
      distributedQty,
      returnedQty,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
    }
  })
}

function totalAmount(lines: ReturnLine[]) {
  return lines.reduce((sum, l) => sum + l.price * l.returnedQty, 0)
}

export function seedReturns(): ReturnApplication[] {
  const now = new Date()
  return [0, 1, 2, 3, 4, 5].map(i => {
    const channel = CHANNELS[i % CHANNELS.length]
    const lines = randomLines(2 + (i % 3))
    const statuses: Array<ReturnApplication['status']> = [
      'draft',
      'submitted',
      'reviewing',
      'approved',
      'rejected',
      'closed',
    ]
    const status = statuses[i % statuses.length]
    const createdAt = new Date(now.getTime() - i * 86400000 * 2)
    const deadline = new Date(now.getTime() + (20 - i * 2) * 86400000)
    const history: HistoryEntry[] = [
      {
        id: uid('h_'),
        timestamp: fmt(createdAt) + ' 09:31',
        role: 'channel',
        operator: MANAGERS[i % MANAGERS.length],
        action: status === 'draft' ? '创建草稿' : '提交退货申请',
        comment: status === 'draft' ? '等待补充明细' : '渠道反馈退货需求',
      },
    ]
    if (status !== 'draft') {
      history.push({
        id: uid('h_'),
        timestamp: fmt(new Date(createdAt.getTime() + 86400000)) + ' 14:02',
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '发起初审',
        comment: '已核对铺货台账，进入审核',
        from: 'submitted',
        to: 'reviewing',
      })
    }
    if (status === 'approved' || status === 'closed') {
      history.push({
        id: uid('h_'),
        timestamp: fmt(new Date(createdAt.getTime() + 2 * 86400000)) + ' 10:20',
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '审核通过',
        from: 'reviewing',
        to: 'approved',
        comment: '已生成调拨单',
      })
    }
    if (status === 'rejected') {
      history.push({
        id: uid('h_'),
        timestamp: fmt(new Date(createdAt.getTime() + 2 * 86400000)) + ' 16:45',
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '驳回申请',
        from: 'reviewing',
        to: 'rejected',
        comment: '退货口径与铺货台账不符，请渠道补充明细',
      })
    }
    return {
      id: uid('RT'),
      channelCode: channel.code,
      channelName: channel.name,
      manager: MANAGERS[i % MANAGERS.length],
      createdAt: fmt(createdAt),
      deadline: fmt(deadline),
      status,
      totalAmount: totalAmount(lines),
      lines,
      note: '月底前完成对账',
      attachments: [],
      history,
    }
  })
}

export function seedTransfers(returns: ReturnApplication[]): StockTransfer[] {
  const now = new Date()
  const approved = returns.filter(r => r.status === 'approved' || r.status === 'closed')
  const seeded: StockTransfer[] = approved.slice(0, 3).map((r, idx) => {
    const statuses: Array<StockTransfer['status']> = ['pending', 'processing', 'completed']
    const status = statuses[idx % statuses.length]
    const createdAt = new Date(now.getTime() - idx * 86400000)
    const expectedDate = new Date(now.getTime() + (5 - idx) * 86400000)
    const history: HistoryEntry[] = [
      {
        id: uid('h_'),
        timestamp: fmt(createdAt) + ' 10:10',
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '生成调拨单',
        from: 'pending',
        to: 'pending',
        comment: `关联退货申请 ${r.id}`,
      },
    ]
    if (status !== 'pending') {
      history.push({
        id: uid('h_'),
        timestamp: fmt(new Date(createdAt.getTime() + 86400000)) + ' 15:00',
        role: 'issuer',
        operator: '发行专员·周凯',
        action: '安排发货',
        from: 'pending',
        to: 'processing',
        comment: '顺丰速递·SF2025000001',
      })
    }
    if (status === 'completed') {
      history.push({
        id: uid('h_'),
        timestamp: fmt(new Date(createdAt.getTime() + 2 * 86400000)) + ' 09:30',
        role: 'channel',
        operator: r.manager,
        action: '确认签收',
        from: 'processing',
        to: 'completed',
      })
    }
    return {
      id: uid('TR'),
      returnApplicationId: r.id,
      initiator: '发行专员·周凯',
      status,
      createdAt: fmt(createdAt),
      expectedDate: fmt(expectedDate),
      completedAt: status === 'completed' ? fmt(new Date(createdAt.getTime() + 2 * 86400000)) : undefined,
      lines: r.lines.slice(0, 2).map(l => ({
        isbn: l.isbn,
        title: l.title,
        qty: l.returnedQty,
        from: '总仓',
        to: r.channelName,
      })),
      courier: status !== 'pending' ? '顺丰速递' : undefined,
      trackingNo: status !== 'pending' ? 'SF2025' + (100001 + idx) : undefined,
      risk: idx === 0 ? 'high' : idx === 1 ? 'medium' : 'low',
      note: idx === 0 ? '样书数量与申请不符，待确认' : '正常调拨',
      history,
    }
  })
  return seeded
}

export function seedReceipts(returns: ReturnApplication[]): SampleReceipt[] {
  return returns.slice(0, 4).map((r, idx) => {
    const statuses: Array<SampleReceipt['status']> = ['pending', 'submitted', 'missing', 'confirmed']
    const status = statuses[idx % statuses.length]
    const line = r.lines[0]
    return {
      id: uid('RC'),
      returnApplicationId: r.id,
      channel: r.channelName,
      bookTitle: line.title,
      qty: Math.min(line.returnedQty, 5),
      status,
      submittedAt: status === 'submitted' || status === 'confirmed' ? fmt(new Date()) : undefined,
      confirmedAt: status === 'confirmed' ? fmt(new Date()) : undefined,
      note: status === 'missing' ? '样书回执丢失，需渠道补寄或书面说明' : '正常流程',
    }
  })
}

export function seedReconciliation(returns: ReturnApplication[]): ReconciliationRecord[] {
  return returns.slice(0, 5).map((r, idx) => {
    const line = r.lines[0]
    const expected = line.returnedQty
    const actual = idx === 1 ? expected - 2 : idx === 3 ? expected + 1 : expected
    const status: ReconciliationRecord['status'] =
      expected === actual ? 'matched' : idx === 2 ? 'pending' : 'mismatch'
    return {
      id: uid('REC'),
      month: '2026-05',
      channel: r.channelName,
      bookTitle: line.title,
      expectedReturn: expected,
      actualReturn: actual,
      delta: actual - expected,
      caliber: status === 'mismatch' ? '退货口径前后不一' : '铺货台账一致',
      status,
      lastCheckedAt: fmt(new Date()),
      checker: '财务对接·孙雯',
    }
  })
}
