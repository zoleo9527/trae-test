export const ROLES = {
  MANAGER: 'manager',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  FINANCE: 'finance',
  PURCHASE: 'purchase'
}

export const ROLE_NAMES = {
  [ROLES.MANAGER]: '业务经理',
  [ROLES.SALES]: '销售员',
  [ROLES.WAREHOUSE]: '库管员',
  [ROLES.FINANCE]: '财务',
  [ROLES.PURCHASE]: '采购员'
}

export const ROLE_PERMISSIONS = {
  [ROLES.MANAGER]: ['dashboard', 'weighing', 'coldroom', 'grading', 'customers', 'credit', 'collection', 'loss', 'complaints', 'users'],
  [ROLES.SALES]: ['dashboard', 'weighing', 'customers', 'credit', 'collection', 'complaints'],
  [ROLES.WAREHOUSE]: ['dashboard', 'weighing', 'coldroom', 'grading', 'loss'],
  [ROLES.FINANCE]: ['dashboard', 'credit', 'collection', 'customers'],
  [ROLES.PURCHASE]: ['dashboard', 'weighing', 'coldroom', 'customers']
}

export const DEFAULT_USERS = [
  { id: 1, name: '张经理', role: ROLES.MANAGER, phone: '13800138001' },
  { id: 2, name: '李销售', role: ROLES.SALES, phone: '13800138002' },
  { id: 3, name: '王库管', role: ROLES.WAREHOUSE, phone: '13800138003' },
  { id: 4, name: '赵财务', role: ROLES.FINANCE, phone: '13800138004' },
  { id: 5, name: '孙采购', role: ROLES.PURCHASE, phone: '13800138005' }
]

export const FRUIT_TYPES = [
  { id: 1, name: '苹果', unit: '斤', shelfLife: 30 },
  { id: 2, name: '橙子', unit: '斤', shelfLife: 45 },
  { id: 3, name: '香蕉', unit: '斤', shelfLife: 7 },
  { id: 4, name: '葡萄', unit: '斤', shelfLife: 15 },
  { id: 5, name: '西瓜', unit: '斤', shelfLife: 20 },
  { id: 6, name: '草莓', unit: '盒', shelfLife: 5 },
  { id: 7, name: '芒果', unit: '斤', shelfLife: 10 },
  { id: 8, name: '梨', unit: '斤', shelfLife: 40 }
]

export const GRADING_LEVELS = [
  { id: 'A', name: 'A级', description: '精品', multiplier: 1.3 },
  { id: 'B', name: 'B级', description: '优质', multiplier: 1.1 },
  { id: 'C', name: 'C级', description: '普通', multiplier: 1.0 },
  { id: 'D', name: 'D级', description: '次等', multiplier: 0.7 }
]

export const CREDIT_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  OVERDUE: 'overdue',
  BAD_DEBT: 'bad_debt'
}

export const CREDIT_STATUS_NAMES = {
  [CREDIT_STATUS.NORMAL]: '正常',
  [CREDIT_STATUS.WARNING]: '预警',
  [CREDIT_STATUS.OVERDUE]: '逾期',
  [CREDIT_STATUS.BAD_DEBT]: '坏账'
}

export const COLLECTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

export const COLLECTION_STATUS_NAMES = {
  [COLLECTION_STATUS.PENDING]: '待催办',
  [COLLECTION_STATUS.IN_PROGRESS]: '催办中',
  [COLLECTION_STATUS.COMPLETED]: '已回款',
  [COLLECTION_STATUS.FAILED]: '催办失败'
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered',
  PAID: 'paid',
  CANCELLED: 'cancelled'
}

export const ORDER_STATUS_NAMES = {
  [ORDER_STATUS.PENDING]: '待确认',
  [ORDER_STATUS.CONFIRMED]: '已确认',
  [ORDER_STATUS.DELIVERED]: '已送达',
  [ORDER_STATUS.PAID]: '已付款',
  [ORDER_STATUS.CANCELLED]: '已取消'
}

export const TASK_PRIORITY = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

export const TASK_PRIORITY_NAMES = {
  [TASK_PRIORITY.URGENT]: '紧急',
  [TASK_PRIORITY.HIGH]: '高',
  [TASK_PRIORITY.MEDIUM]: '中',
  [TASK_PRIORITY.LOW]: '低'
}
