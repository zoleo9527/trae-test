export const STATUS_MAP = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
  shipped: { label: '已发货', color: 'bg-blue-100 text-blue-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  returned: { label: '已退货', color: 'bg-orange-100 text-orange-800' },
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-800' },
  lost: { label: '已丢失', color: 'bg-red-100 text-red-800' },
}

export const RECEIPT_STATUS_MAP = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-800' },
  lost: { label: '回执丢失', color: 'bg-red-100 text-red-800' },
}

export const EXCEPTION_TYPE_MAP = {
  receipt_lost: { label: '回执丢失', color: 'bg-red-100 text-red-800' },
  quantity_discrepancy: { label: '数量差异', color: 'bg-orange-100 text-orange-800' },
  payment_mismatch: { label: '金额不符', color: 'bg-purple-100 text-purple-800' },
}

export const EXCEPTION_STATUS_MAP = {
  open: { label: '待处理', color: 'bg-red-100 text-red-800' },
  processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-800' },
}

export const RETURN_TYPE_MAP = {
  normal: { label: '正常退货', color: 'bg-gray-100 text-gray-800' },
  damaged: { label: '破损退货', color: 'bg-red-100 text-red-800' },
  expired: { label: '过期退货', color: 'bg-orange-100 text-orange-800' },
}

export const PAYMENT_METHOD_MAP = {
  bank_transfer: '银行转账',
  alipay: '支付宝',
  wechat: '微信支付',
  cash: '现金',
}

export const ROLE_MAP = {
  admin: '系统管理员',
  channel_manager: '渠道经理',
  distribution_specialist: '发行专员',
  finance: '财务对接',
}
