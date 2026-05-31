const formatCurrency = (amount, currency = "CNY") => {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency
  }).format(amount);
};
const getStatusText = (status) => {
  const statusMap = {
    draft: "\u8349\u7A3F",
    pending: "\u5F85\u5BA1\u6838",
    approved: "\u5DF2\u6279\u51C6",
    rejected: "\u5DF2\u62D2\u7EDD",
    delivered: "\u5DF2\u53D1\u8D27",
    completed: "\u5DF2\u5B8C\u6210",
    cancelled: "\u5DF2\u53D6\u6D88",
    normal: "\u6B63\u5E38",
    late: "\u8FDF\u5230",
    early_leave: "\u65E9\u9000",
    absent: "\u7F3A\u52E4",
    open: "\u672A\u5904\u7406",
    in_progress: "\u5904\u7406\u4E2D",
    resolved: "\u5DF2\u89E3\u51B3",
    excellent: "\u4F18\u79C0",
    good: "\u826F\u597D",
    pass: "\u5408\u683C",
    fail: "\u4E0D\u5408\u683C",
    scheduled: "\u5DF2\u6392\u671F",
    active: "\u8FDB\u884C\u4E2D",
    expiring: "\u5373\u5C06\u5230\u671F",
    ended: "\u5DF2\u7ED3\u675F"
  };
  return statusMap[status] || status;
};
const getRoleText = (role) => {
  const roleMap = {
    project_manager: "\u9879\u76EE\u4E3B\u7BA1",
    scheduling_specialist: "\u6392\u73ED\u4E13\u5458",
    quality_inspector: "\u8D28\u68C0\u5458"
  };
  return roleMap[role] || role;
};
const getCategoryText = (category) => {
  const categoryMap = {
    detergent: "\u6E05\u6D01\u5242",
    tool: "\u6E05\u6D01\u5DE5\u5177",
    disposable: "\u4E00\u6B21\u6027\u7528\u54C1",
    protective: "\u9632\u62A4\u7528\u54C1"
  };
  return categoryMap[category] || category;
};
const getTaskTypeText = (type) => {
  const typeMap = {
    daily: "\u65E5\u5E38\u6E05\u6D01",
    deep: "\u6DF1\u5EA6\u6E05\u6D01",
    special: "\u4E13\u9879\u6E05\u6D01"
  };
  return typeMap[type] || type;
};
const getAlertTypeText = (type) => {
  const typeMap = {
    missing_punch: "\u6F0F\u6253\u5361",
    rectification: "\u6574\u6539\u901A\u77E5",
    low_stock: "\u5E93\u5B58\u9884\u8B66",
    contract_expiry: "\u5408\u540C\u5230\u671F",
    overdue_task: "\u4EFB\u52A1\u903E\u671F"
  };
  return typeMap[type] || type;
};
const getRectificationStatusText = (status) => {
  const statusMap = {
    pending: "\u5F85\u5904\u7406",
    in_progress: "\u8FDB\u884C\u4E2D",
    completed: "\u5DF2\u5B8C\u6210",
    overdue: "\u5DF2\u903E\u671F"
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
    excellent: "\u4F18\u79C0",
    good: "\u826F\u597D",
    pass: "\u5408\u683C",
    fail: "\u4E0D\u5408\u683C"
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

export { getCategoryText as a, getOverallStatusColor as b, getOverallStatusText as c, getRectificationStatusColor as d, getRectificationStatusText as e, formatCurrency as f, getAlertTypeText as g, getRoleText as h, getStatusText as i, getTaskTypeText as j };
//# sourceMappingURL=formatters-B147ECSY.mjs.map
