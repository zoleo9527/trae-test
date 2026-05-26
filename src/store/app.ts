import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { initialData } from '@/data/mock'
import type { Database, NoteItem, Order, Refund, Role, Transfer } from '@/types'

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

  function redeemOrder(orderId: string) {
    const o = orderById(orderId)
    if (!o) return
    o.status = 'redeemed'
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
    }
  }

  function updateTransfer(id: string, patch: Partial<Transfer>) {
    const t = db.value.transfers.find(x => x.id === id)
    if (t) Object.assign(t, patch)
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
    redeemOrder,
    updateRefund,
    markTransferLost,
    updateTransfer,
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
