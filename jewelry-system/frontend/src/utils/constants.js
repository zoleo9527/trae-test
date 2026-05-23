export const ROLE_LABELS = {
  store_manager: '店长',
  sales_associate: '导购',
  after_sales: '售后专员'
};

export const TRANSFER_STATUS = {
  pending: { label: '待审批', color: 'orange' },
  approved: { label: '已批准', color: 'blue' },
  rejected: { label: '已拒绝', color: 'red' },
  shipped: { label: '已发货', color: 'cyan' },
  received: { label: '已收货', color: 'purple' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' }
};

export const INVENTORY_STATUS = {
  draft: { label: '草稿', color: 'default' },
  submitted: { label: '已提交', color: 'orange' },
  reviewing: { label: '复核中', color: 'blue' },
  confirmed: { label: '已确认', color: 'purple' },
  resolved: { label: '已处理', color: 'green' }
};

export const DIFFERENCE_TYPE = {
  surplus: { label: '盘盈', color: 'green' },
  shortage: { label: '盘亏', color: 'red' },
  none: { label: '正常', color: 'default' }
};

export const DISPOSITION_TYPE = {
  transfer_related: '调货相关',
  sale_unrecorded: '未入账销售',
  loss: '丢失',
  damage: '损坏',
  found: '找回',
  other: '其他'
};

export const COMPENSATION_STATUS = {
  pending: { label: '待处理', color: 'orange' },
  paid: { label: '已赔付', color: 'green' },
  waived: { label: '已豁免', color: 'blue' },
  in_progress: { label: '处理中', color: 'cyan' }
};

export const PRIORITY = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急'
};

export const PRODUCT_STATUS = {
  in_stock: { label: '在库', color: 'green' },
  allocated: { label: '已分配', color: 'orange' },
  sold: { label: '已售出', color: 'blue' },
  transferred: { label: '调货中', color: 'cyan' },
  repairing: { label: '返修中', color: 'purple' },
  lost: { label: '丢失', color: 'red' }
};

export const REPAIR_STATUS = {
  received: { label: '已收单', color: 'orange' },
  in_progress: { label: '处理中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  picked_up: { label: '已取货', color: 'purple' },
  cancelled: { label: '已取消', color: 'default' }
};

export const REPAIR_TYPE = {
  resize: '改圈',
  polish: '抛光翻新',
  repair: '维修',
  remake: '重做',
  modify: '改款'
};
