import { computed } from 'vue'
import { useAppStore, roleLabel } from '@/store/app'
import type { Transfer, Refund } from '@/types'

export function useEvidence() {
  const store = useAppStore()

  function timelineFor(orderId: string) {
    const items: Array<{
      id: string
      time: string
      type: string
      color: string
      title: string
      desc: string
      actor?: string
      attach?: string
    }> = []

    const o = store.orderById(orderId)
    if (!o) return items

    const customer = store.customerOf(o)
    const pkg = store.pkgOf(o)

    items.push({
      id: 'o-' + o.id,
      time: o.createdAt,
      type: 'order',
      color: 'moss',
      title: '订单创建',
      desc: `${customer?.name ?? ''} · ${pkg?.name ?? ''} · ¥${pkg?.price ?? 0}`,
      actor: o.salesperson,
    })

    const rx = store.rxOf(orderId)
    if (rx) {
      items.push({
        id: 'rx-' + rx.orderId,
        time: rx.measuredAt,
        type: 'rx',
        color: 'amber',
        title: '验光数据录入',
        desc: `OD ${rx.od.sphere}/${rx.od.cylinder}×${rx.od.axis}　OS ${rx.os.sphere}/${rx.os.cylinder}×${rx.os.axis}　PD ${rx.pd}`,
        actor: rx.measuredBy,
      })
    }

    for (const t of store.transfersOf(orderId)) {
      items.push({
        id: 't-' + t.id,
        time: t.sentAt,
        type: 'transfer',
        color: t.lost ? 'rose' : 'sky',
        title: t.lost ? '镜片调拨丢失' : '镜片调拨',
        desc: `${t.fromStore} → ${t.toStore}　${t.logistics} ${t.trackingNo}`,
        actor: transferStatusLabel(t.status),
      })
    }

    for (const r of store.repairsOf(orderId)) {
      items.push({
        id: 'r-' + r.id,
        time: r.createdAt,
        type: 'repair',
        color: 'violet',
        title: '返修登记：' + r.reason,
        desc: `责任：${r.owner}　预计返还：${r.eta}`,
      })
    }

    for (const rf of store.refundsOf(orderId)) {
      items.push({
        id: 'rf-' + rf.id,
        time: rf.requestedAt,
        type: 'refund',
        color: refundStatusColor(rf.status),
        title: '退款申请：' + refundStatusLabel(rf.status),
        desc: `¥${rf.amount}　原因：${rf.reason}`,
        actor: rf.requestedBy,
      })
    }

    for (const n of store.notesOf(orderId)) {
      items.push({
        id: 'note-' + n.id,
        time: n.createdAt,
        type: 'note',
        color:
          n.kind === 'reject' ? 'rose'
          : n.kind === 'evidence' ? 'sky'
          : n.kind === 'supplement' ? 'amber'
          : 'slate',
        title: kindTitle(n.kind),
        desc: n.content,
        actor: `${n.actor}（${roleLabel[n.role]}）`,
        attach: n.attach,
      })
    }

    items.sort((a, b) => a.time.localeCompare(b.time))
    return items
  }

  function kindTitle(k: NoteKind) {
    switch (k) {
      case 'reject': return '驳回说明'
      case 'supplement': return '补录说明'
      case 'evidence': return '证据附件'
      default: return '备注'
    }
  }

  function transferStatusLabel(s: Transfer['status']) {
    const map: Record<string, string> = {
      sent: '已发出',
      in_transit: '运输中',
      received: '已签收',
      lost: '已丢失',
    }
    return map[s] ?? s
  }

  function refundStatusLabel(s: Refund['status']) {
    const map: Record<string, string> = {
      requested: '已申请',
      reviewing: '审核中',
      approved: '已通过',
      rejected: '已驳回',
    }
    return map[s] ?? s
  }

  function refundStatusColor(s: Refund['status']) {
    const map: Record<string, string> = {
      requested: 'slate',
      reviewing: 'amber',
      approved: 'moss',
      rejected: 'rose',
    }
    return map[s] ?? 'slate'
  }

  type NoteKind = 'note' | 'reject' | 'supplement' | 'evidence'

  return { timelineFor }
}
