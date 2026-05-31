const formatCurrency = (amount, currency = "CNY") => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency
  }).format(amount);
};
const getStatusText = (status) => {
  const statusMap = {
    draft: "草稿",
    pending: "待审核",
    approved: "已批准",
    rejected: "已拒绝",
    delivered: "已发货",
    completed: "已完成",
    cancelled: "已取消",
    normal: "正常",
    late: "迟到",
    early_leave: "早退",
    absent: "缺勤",
    open: "未处理",
    in_progress: "处理中",
    resolved: "已解决",
    excellent: "优秀",
    good: "良好",
    pass: "合格",
    fail: "不合格",
    scheduled: "已排期",
    active: "进行中",
    expiring: "即将到期",
    ended: "已结束"
  };
  return statusMap[status] || status;
};
const getRoleText = (role) => {
  const roleMap = {
    project_manager: "项目主管",
    scheduling_specialist: "排班专员",
    quality_inspector: "质检员"
  };
  return roleMap[role] || role;
};
const getCategoryText = (category) => {
  const categoryMap = {
    detergent: "清洁剂",
    tool: "清洁工具",
    disposable: "一次性用品",
    protective: "防护用品"
  };
  return categoryMap[category] || category;
};
const getTaskTypeText = (type) => {
  const typeMap = {
    daily: "日常清洁",
    deep: "深度清洁",
    special: "专项清洁"
  };
  return typeMap[type] || type;
};
const getAlertTypeText = (type) => {
  const typeMap = {
    missing_punch: "漏打卡",
    rectification: "整改通知",
    low_stock: "库存预警",
    contract_expiry: "合同到期",
    overdue_task: "任务逾期"
  };
  return typeMap[type] || type;
};
const getRectificationStatusText = (status) => {
  const statusMap = {
    pending: "待处理",
    in_progress: "进行中",
    completed: "已完成",
    overdue: "已逾期"
  };
  return statusMap[status] || status;
};
const getRectificationStatusColor = (status) => {
  const colorMap = {
    pending: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    overdue: "bg-red-100 text-red-700"
  };
  return colorMap[status] || "bg-gray-100 text-gray-700";
};
const getOverallStatusText = (status) => {
  const statusMap = {
    excellent: "优秀",
    good: "良好",
    pass: "合格",
    fail: "不合格"
  };
  return statusMap[status] || status;
};
const getOverallStatusColor = (status) => {
  const colorMap = {
    excellent: "bg-green-100 text-green-700",
    good: "bg-blue-100 text-blue-700",
    pass: "bg-yellow-100 text-yellow-700",
    fail: "bg-red-100 text-red-700"
  };
  return colorMap[status] || "bg-gray-100 text-gray-700";
};
export {
  getCategoryText as a,
  getOverallStatusColor as b,
  getOverallStatusText as c,
  getRectificationStatusColor as d,
  getRectificationStatusText as e,
  formatCurrency as f,
  getAlertTypeText as g,
  getRoleText as h,
  getStatusText as i,
  getTaskTypeText as j
};
//# sourceMappingURL=formatters-B147ECSY.js.map
