export const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  negotiating: '协商中',
  reviewing: '复核中',
  approved: '已批准',
  completed: '已完成',
  closed: '已关闭',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9500',
  negotiating: '#5856d6',
  reviewing: '#007aff',
  approved: '#34c759',
  completed: '#8e8e93',
  closed: '#636366',
};

export const CATEGORY_LABELS: Record<string, string> = {
  refund: '退款',
  compensation: '赔付',
  rework: '返工',
  complaint: '投诉',
};

export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  mixed_roll: '胶卷混号',
  wrong_version: '版本错发',
  quality_issue: '质量问题',
  delay: '交付延迟',
  other: '其他',
};

export const ROLE_LABELS: Record<string, string> = {
  owner: '店主',
  printer: '冲印师',
  customer_service: '客服',
};

export const NOTE_TYPE_LABELS: Record<string, string> = {
  internal: '内部',
  customer: '客户',
  negotiation: '协商',
  review: '复核',
};

export const COMPENSATION_TYPE_LABELS: Record<string, string> = {
  full_refund: '全额退款',
  partial_refund: '部分退款',
  rework: '免费返工',
  discount: '优惠券',
  other: '其他',
};

export const DEMO_USERS = [
  { username: 'owner', name: '李明', role: 'owner', avatar: '👨‍💼', desc: '查看全部，审批赔付' },
  { username: 'printer1', name: '张伟', role: 'printer', avatar: '🧑‍🔬', desc: '处理冲印问题' },
  { username: 'cs1', name: '刘洋', role: 'customer_service', avatar: '👨‍💻', desc: '登记协商，提交复核' },
];
