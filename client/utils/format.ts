export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDateTime = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (dateStr: string | Date): string => {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getMemberTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    diamond: '钻石会员',
  };
  return labels[type] || type;
};

export const getMemberTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    normal: 'badge-gray',
    silver: 'badge bg-gray-400 text-white',
    gold: 'badge bg-yellow-500 text-white',
    diamond: 'badge-gold text-white',
  };
  return colors[type] || 'badge-gray';
};

export const getBookingStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    booked: '已预约',
    checked_in: '已到场',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未到场',
  };
  return labels[status] || status;
};

export const getBookingStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    booked: 'badge-blue',
    checked_in: 'badge-yellow',
    completed: 'badge-green',
    cancelled: 'badge-gray',
    no_show: 'badge-red',
  };
  return colors[status] || 'badge-gray';
};

export const getExceptionStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  };
  return labels[status] || status;
};

export const getExceptionStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'badge-yellow',
    processing: 'badge-blue',
    resolved: 'badge-green',
    closed: 'badge-gray',
  };
  return colors[status] || 'badge-gray';
};

export const getReconciliationStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: '待审核',
    reviewing: '审核中',
    approved: '已通过',
    adjusted: '已调账',
  };
  return labels[status] || status;
};

export const getReconciliationStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'badge-yellow',
    reviewing: 'badge-blue',
    approved: 'badge-green',
    adjusted: 'badge bg-purple-100 text-purple-800',
  };
  return colors[status] || 'badge-gray';
};

export const getReturnStatusLabel = (status: string | null): string => {
  if (!status) return '未归还';
  const labels: Record<string, string> = {
    normal: '正常归还',
    damaged: '损坏归还',
    lost: '遗失',
  };
  return labels[status] || status;
};

export const getReturnStatusColor = (status: string | null): string => {
  if (!status) return 'badge-yellow';
  const colors: Record<string, string> = {
    normal: 'badge-green',
    damaged: 'badge-red',
    lost: 'badge bg-purple-100 text-purple-800',
  };
  return colors[status] || 'badge-gray';
};

export const getBayStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    available: '空闲',
    booked: '已预约',
    checked_in: '使用中',
    maintenance: '维护中',
    closed: '关闭',
  };
  return labels[status] || status;
};

export const getBayStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    available: 'bg-green-500',
    booked: 'bg-blue-500',
    checked_in: 'bg-yellow-500',
    maintenance: 'bg-red-500',
    closed: 'bg-gray-400',
  };
  return colors[status] || 'bg-gray-400';
};

export const getExceptionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    billing_dispute: '账单争议',
    equipment_damage: '器材损坏',
    booking_error: '预约错误',
    service_complaint: '服务投诉',
    other: '其他',
  };
  return labels[type] || type;
};
