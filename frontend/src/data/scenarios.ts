export interface Scenario {
  id: string
  name: string
  description: string
  orderIds: string[]
  flowType: 'normal' | 'change' | 'exception' | 'refund'
}

export const scenarios: Scenario[] = [
  {
    id: 'SCN-001',
    name: '正常流程',
    description: '订单正常流转：下单 → 确认 → 排程 → 生产 → 取货完成，无改单、无异常',
    orderIds: ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004', 'ORD-005', 'ORD-006', 'ORD-013'],
    flowType: 'normal',
  },
  {
    id: 'SCN-002',
    name: '改单流程',
    description: '订单发生变更：下单 → 改单申请 → 变更推送排程 → 调整生产 → 完成',
    orderIds: ['ORD-007', 'ORD-008', 'ORD-014'],
    flowType: 'change',
  },
  {
    id: 'SCN-003',
    name: '异常流程',
    description: '订单出现异常：订单 → 品质/做错异常 → 开重做工单 → 重做排程 → 重新取货',
    orderIds: ['ORD-009', 'ORD-010'],
    flowType: 'exception',
  },
  {
    id: 'SCN-004',
    name: '退款流程',
    description: '异常升级退款：订单 → 异常 → 重做失败 → 开退款工单 → 全链路溯源 → 退款完成',
    orderIds: ['ORD-011', 'ORD-012'],
    flowType: 'refund',
  },
]
