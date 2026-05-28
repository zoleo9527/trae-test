<script lang="ts">
  export let status: string;
  export let customColors: Record<string, string> = {};

  const defaultColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    checked_in: 'bg-blue-100 text-blue-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    excused: 'bg-gray-100 text-gray-800',
    resolved: 'bg-green-100 text-green-800',
    unresolved: 'bg-red-100 text-red-800',
    available: 'bg-green-100 text-green-800',
    full: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-orange-100 text-orange-800',
    fulfilled: 'bg-green-100 text-green-800',
  };

  const defaultLabels: Record<string, string> = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已驳回',
    completed: '已完成',
    active: '活跃',
    checked_in: '已入住',
    checked_out: '已退房',
    cancelled: '已取消',
    present: '出勤',
    absent: '缺勤',
    late: '迟到',
    excused: '请假',
    resolved: '已解决',
    unresolved: '未解决',
    available: '可用',
    full: '已满',
    maintenance: '维修中',
    fulfilled: '已完成',
  };

  $: colorClass = customColors[status] || defaultColors[status] || 'bg-gray-100 text-gray-800';
  $: label = defaultLabels[status] || status;
</script>

<span
  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {colorClass}"
>
  {label}
</span>
