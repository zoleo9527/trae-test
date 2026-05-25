
const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待处理' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: '进行中' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: '已完成' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: '已取消' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '已驳回' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: '已确认' },
  normal: { bg: 'bg-green-100', text: 'text-green-700', label: '正常' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '预警' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', label: '逾期' },
  bad_debt: { bg: 'bg-gray-200', text: 'text-gray-700', label: '坏账' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', label: '已付款' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: '处理中' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: '已解决' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: '失败' }
};

export default function StatusBadge({ status }) {
  const config = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
