<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type DashboardStats, type TodoItem } from '../../lib/api/client';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let stats: DashboardStats | null = null;
  let todos: TodoItem[] = [];
  let loading = true;
  let error: string | null = null;

  const statCards = [
    { key: 'pendingCount', label: '待处理', icon: '⏳', color: 'from-yellow-400 to-orange-500', bgColor: 'bg-yellow-50' },
    { key: 'rejectedCount', label: '已驳回', icon: '❌', color: 'from-red-400 to-red-600', bgColor: 'bg-red-50' },
    { key: 'reviewNeededCount', label: '需回查', icon: '🔍', color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50' },
    { key: 'totalCampers', label: '营员总数', icon: '👥', color: 'from-green-400 to-emerald-500', bgColor: 'bg-green-50' },
    { key: 'todayAttendanceRate', label: '出勤率', icon: '📊', color: 'from-purple-400 to-pink-500', bgColor: 'bg-purple-50', isPercent: true },
  ];

  function getStatValue(key: string, isPercent: boolean | undefined): string | number {
    if (!stats) return '';
    const value = stats[key as keyof DashboardStats] as number;
    return isPercent ? `${value.toFixed(1)}%` : value;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      fulfilled: 'bg-green-100 text-green-700 border-green-200',
      completed: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[status] || colors.pending;
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待处理',
      approved: '已通过',
      rejected: '已驳回',
      fulfilled: '已完成',
      completed: '已完成',
    };
    return labels[status] || status;
  }

  function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      attendance: '✅',
      medical: '🏥',
      supply: '📦',
      feedback: '💬',
      room: '🏠',
      camper: '👤',
    };
    return icons[type] || '📌';
  }

  onMount(async () => {
    try {
      const [statsData, todosData] = await Promise.all([
        api.getDashboardStats(),
        api.getTodoList(),
      ]);
      stats = statsData;
      todos = todosData;
    } catch (err) {
      error = err instanceof Error ? err.message : '加载数据失败';
    } finally {
      loading = false;
    }
  });
</script>

<div class="space-y-8">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">首页看板</h1>
      <p class="mt-1 text-sm text-gray-500">欢迎回来，这是您今天的工作概览</p>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-16">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p class="text-gray-500">加载中...</p>
      </div>
    </div>
  {:else if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      {error}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {#each statCards as card}
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          <div class="h-2 bg-gradient-to-r {card.color}" />
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 {card.bgColor} rounded-xl flex items-center justify-center text-2xl">
                {card.icon}
              </div>
            </div>
            <p class="text-3xl font-bold text-gray-900">
              {#if stats}
                {getStatValue(card.key, card.isPercent)}
              {/if}
            </p>
            <p class="mt-1 text-sm text-gray-500">{card.label}</p>
          </div>
        </div>
      {/each}
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📋</span>
          待办事项
          <span class="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {todos.length}
          </span>
        </h2>
      </div>
      <div class="divide-y divide-gray-100">
        {#if todos.length === 0}
          <div class="py-12 text-center text-gray-400">
            <p class="text-4xl mb-2">🎉</p>
            <p class="text-sm">暂无待办事项</p>
          </div>
        {:else}
          {#each todos as todo}
            <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {getTypeIcon(todo.type)}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3">
                    <h3 class="font-medium text-gray-900 truncate">{todo.title}</h3>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full border {getStatusColor(todo.status)}">
                      {getStatusLabel(todo.status)}
                    </span>
                  </div>
                  <p class="mt-1 text-sm text-gray-500 line-clamp-2">{todo.description}</p>
                  <p class="mt-2 text-xs text-gray-400">{formatDate(todo.created_at)}</p>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
