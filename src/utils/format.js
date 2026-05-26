export const ROLE_NAMES = {
  manager: '经销负责人',
  sales: '业务员',
  warehouse: '仓管'
};

export const STOCK_TAKE_STATUS = {
  pending: { label: '待执行', class: 'badge-gray' },
  in_progress: { label: '进行中', class: 'badge-info' },
  completed: { label: '已完成', class: 'badge-success' },
  cancelled: { label: '已取消', class: 'badge-gray' }
};

export const STOCK_TAKE_TYPES = {
  periodic: '定期盘点',
  special: '专项盘点',
  spot_check: '抽样盘点'
};

export const CHECK_RESULTS = {
  pending: { label: '待盘点', class: 'badge-gray' },
  normal: { label: '账实相符', class: 'badge-success' },
  shortage: { label: '盘亏', class: 'badge-danger' },
  overage: { label: '盘盈', class: 'badge-warning' }
};

export const LOSS_STATUS = {
  pending: { label: '待审核', class: 'badge-warning' },
  reviewed: { label: '已审核', class: 'badge-info' },
  approved: { label: '已审批', class: 'badge-success' },
  rejected: { label: '已驳回', class: 'badge-danger' }
};

export const LOSS_TYPES = {
  inventory_shortage: '盘点盘亏',
  damage: '破损报废',
  tasting: '试饮消耗',
  sample: '样品赠送',
  expired: '过期报废',
  other: '其他损耗'
};

export const RESPONSIBILITY_TYPES = {
  company: { label: '公司承担', class: 'badge-info' },
  warehouse: { label: '仓储责任', class: 'badge-warning' },
  sales: { label: '业务责任', class: 'badge-warning' },
  third_party: { label: '第三方责任', class: 'badge-gray' },
  personal: { label: '个人承担', class: 'badge-danger' }
};

export const PRICE_TYPES = {
  base: '基础定价',
  promotion: '促销价',
  wholesale: '批发价',
  vip: 'VIP价'
};

export const ADJUST_TYPES = {
  permanent: '永久调整',
  activity: '活动调整',
  seasonal: '季节调整'
};

export const STOCK_OUT_TYPES = {
  sale: '销售出库',
  transfer: '调拨出库',
  tasting: '试饮出库',
  sample: '样品出库',
  return: '退货出库'
};

export const STOCK_OUT_STATUS = {
  pending: { label: '待审核', class: 'badge-warning' },
  approved: { label: '已审核', class: 'badge-info' },
  completed: { label: '已出库', class: 'badge-success' },
  cancelled: { label: '已取消', class: 'badge-gray' }
};

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return new Intl.NumberFormat('zh-CN').format(num);
}

export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm');
}

export function formatRelativeTime(date) {
  if (!date) return '-';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return formatDate(date);
}

export function truncateText(text, maxLength = 20) {
  if (!text) return '-';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
