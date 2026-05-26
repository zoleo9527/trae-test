import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { initialData } from '@/data/mock'
import type { Database, NoteItem, Order, Refund, Role, Transfer, Rx, Job, EyeRx, Repair } from '@/types'

export const useAppStore = defineStore('app', () => {
  const db = ref<Database>(JSON.parse(JSON.stringify(initialData)))
  const currentRole = ref<Role>('manager')
  const currentActorId = ref<string>('a1')
  const selectedOrderId = ref<string>('o1')
  const selectedRefundId = ref<string>('rf1')

  const currentActor = computed(() => db.value.actors.find(a => a.id === currentActorId.value))

  const roleOrder: Role[] = ['manager', 'optometrist', 'workshop', 'service']

  function switchRole(role: Role) {
    currentRole.value = role
    const actor = db.value.actors.find(a => a.role === role)
    if (actor) currentActorId.value = actor.id
  }

  const orders = computed(() => db.value.orders)
  const customers = computed(() => db.value.customers)
  const packages = computed(() => db.value.packages)

  function orderById(id: string) {
    return db.value.orders.find(o => o.id === id)
  }
  function customerOf(order: Order) {
    return db.value.customers.find(c => c.id === order.customerId)
  }
  function pkgOf(order: Order) {
    return db.value.packages.find(p => p.id === order.packageId)
  }
  function rxOf(orderId: string) {
    return db.value.rxList.find(r => r.orderId === orderId)
  }
  function jobOf(orderId: string) {
    return db.value.jobs.find(j => j.orderId === orderId)
  }
  function transfersOf(orderId: string) {
    return db.value.transfers.filter(t => t.orderId === orderId)
  }
  function repairsOf(orderId: string) {
    return db.value.repairs.filter(r => r.orderId === orderId)
  }
  function refundsOf(orderId: string) {
    return db.value.refunds.filter(r => r.orderId === orderId)
  }
  function notesOf(orderId: string) {
    return db.value.notes
      .filter(n => n.orderId === orderId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  function addNote(note: Omit<NoteItem, 'id' | 'createdAt'>) {
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    db.value.notes.push({
      id: 'n' + (db.value.notes.length + 1),
      createdAt: iso,
      ...note,
    })
  }

  function pad(n: number) {
    return n < 10 ? '0' + n : String(n)
  }

  function updateRefund(id: string, patch: Partial<Refund>) {
    const r = db.value.refunds.find(x => x.id === id)
    if (r) Object.assign(r, patch)
  }

  function markTransferLost(id: string) {
    const t = db.value.transfers.find(x => x.id === id)
    if (t) {
      t.status = 'lost'
      t.lost = true
      t.lostConfirmedBy = currentActor.value?.name ?? '加工'
    }
  }

  function updateTransfer(id: string, patch: Partial<Transfer>) {
    const t = db.value.transfers.find(x => x.id === id)
    if (t) Object.assign(t, patch)
  }

  function createRefund(orderId: string, amount: number, reason: string) {
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const refund: Refund = {
      id: 'rf' + (db.value.refunds.length + 1),
      orderId,
      amount,
      reason,
      status: 'reviewing',
      requestedBy: currentActor.value?.name ?? '售后',
      requestedAt: iso,
    }
    db.value.refunds.push(refund)
    addNote({
      orderId,
      kind: 'supplement',
      role: currentActor.value?.role ?? 'service',
      actor: currentActor.value?.name ?? '售后',
      content: `发起退款申请：¥${amount}，原因：${reason}`,
    })
    return refund
  }

  function updateJobStage(jobId: string, stage: Job['stage']) {
    const job = db.value.jobs.find(j => j.id === jobId)
    if (!job) return
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    job.stage = stage
    job.updatedAt = iso
    job.assignee = currentActor.value?.name ?? job.assignee
    addNote({
      orderId: job.orderId,
      kind: 'note',
      role: 'workshop',
      actor: currentActor.value?.name ?? '加工',
      content: `加工进度更新：${stageLabel(stage)}`,
    })
    const order = orderById(job.orderId)
    if (order) {
      if (stage === 'done') {
        order.status = 'delivered'
      } else if (stage === 'quality') {
        order.status = 'quality_check'
      } else if (stage !== 'pending') {
        order.status = 'in_workshop'
      }
    }
  }

  function stageLabel(s: Job['stage']) {
    const map: Record<string, string> = {
      pending: '待加工',
      cutting: '割片',
      edging: '磨边',
      quality: '质检',
      done: '完成',
    }
    return map[s] ?? s
  }

  function createRepair(orderId: string, reason: string, owner: string, eta: string) {
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const repair: Repair = {
      id: 'r' + (db.value.repairs.length + 1),
      orderId,
      reason,
      owner,
      eta,
      status: 'reported',
      createdAt: iso,
    }
    db.value.repairs.push(repair)
    addNote({
      orderId,
      kind: 'evidence',
      role: currentActor.value?.role ?? 'workshop',
      actor: currentActor.value?.name ?? '加工',
      content: `登记返修：${reason}，责任：${owner}，预计 ${eta}`,
    })
    return repair
  }

  function updateRepairStatus(id: string, status: Repair['status'], note?: string) {
    const repair = db.value.repairs.find(r => r.id === id)
    if (!repair) return
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    repair.status = status
    if (status === 'completed') {
      repair.completedAt = iso
    }
    if (note) {
      repair.note = note
    }
    addNote({
      orderId: repair.orderId,
      kind: 'note',
      role: currentActor.value?.role ?? 'workshop',
      actor: currentActor.value?.name ?? '加工',
      content: `返修状态更新：${repairStatusLabel(status)}${note ? '，备注：' + note : ''}`,
    })
  }

  function repairStatusLabel(s: Repair['status']) {
    const map: Record<string, string> = {
      reported: '已登记',
      factory: '返厂中',
      returned: '已返回',
      completed: '已完成',
    }
    return map[s] ?? s
  }

  function saveRx(orderId: string, rx: Omit<Rx, 'orderId' | 'measuredAt'>) {
    const existing = db.value.rxList.find(r => r.orderId === orderId)
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    if (existing) {
      Object.assign(existing, rx, { measuredAt: iso })
    } else {
      db.value.rxList.push({
        orderId,
        ...rx,
        measuredAt: iso,
      })
    }
    addNote({
      orderId,
      kind: 'supplement',
      role: currentActor.value?.role ?? 'optometrist',
      actor: currentActor.value?.name ?? '验光师',
      content: `验光数据已${existing ? '更新' : '录入'}：OD ${rx.od.sphere}/${rx.od.cylinder}×${rx.od.axis}　OS ${rx.os.sphere}/${rx.os.cylinder}×${rx.os.axis}　PD ${rx.pd}`,
    })
  }

  function createJob(orderId: string) {
    const existing = db.value.jobs.find(j => j.orderId === orderId)
    if (existing) return existing
    const now = new Date()
    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    const job: Job = {
      id: 'j' + (db.value.jobs.length + 1),
      orderId,
      stage: 'pending',
      updatedAt: iso,
      assignee: currentActor.value?.name ?? '加工跟单',
    }
    db.value.jobs.push(job)
    addNote({
      orderId,
      kind: 'note',
      role: 'workshop',
      actor: currentActor.value?.name ?? '系统',
      content: '订单已进入加工队列，待割片。',
    })
    return job
  }

  function redeemOrder(orderId: string) {
    const o = orderById(orderId)
    if (!o) return
    o.status = 'redeemed'
    addNote({
      orderId,
      kind: 'note',
      role: currentActor.value?.role ?? 'optometrist',
      actor: currentActor.value?.name ?? '验光师',
      content: '套餐已核销，进入加工流程。',
    })
    createJob(orderId)
  }

  return {
    db,
    currentRole,
    currentActorId,
    currentActor,
    selectedOrderId,
    selectedRefundId,
    roleOrder,
    switchRole,
    orders,
    customers,
    packages,
    orderById,
    customerOf,
    pkgOf,
    rxOf,
    jobOf,
    transfersOf,
    repairsOf,
    refundsOf,
    notesOf,
    addNote,
    saveRx,
    createJob,
    redeemOrder,
    createRefund,
    updateRefund,
    markTransferLost,
    updateTransfer,
    updateJobStage,
    stageLabel,
    createRepair,
    updateRepairStatus,
    repairStatusLabel,
  }
})

export const roleLabel: Record<Role, string> = {
  manager: '店经理',
  optometrist: '验光师',
  workshop: '加工跟单',
  service: '售后专员',
}

export const statusLabel: Record<string, string> = {
  pending: '待核销',
  redeemed: '已核销',
  in_workshop: '加工中',
  quality_check: '待质检',
  delivered: '已交付',
  refunded: '已退款',
}
