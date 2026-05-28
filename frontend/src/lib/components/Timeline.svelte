<script lang="ts">
  import type { TimelineEvent } from '../api/client';

  export let events: TimelineEvent[] = [];

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      checkin: '✅',
      checkout: '🚪',
      attendance: '📋',
      medical: '🏥',
      room: '🏠',
      note: '📝',
      default: '📌',
    };
    return icons[type] || icons.default;
  }

  function getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      checkin: 'bg-green-500',
      checkout: 'bg-gray-500',
      attendance: 'bg-blue-500',
      medical: 'bg-red-500',
      room: 'bg-purple-500',
      note: 'bg-yellow-500',
      default: 'bg-gray-400',
    };
    return colors[type] || colors.default;
  }

  function getOperatorName(event: TimelineEvent): string {
    return event.operator?.display_name || event.operator_id || '未知';
  }
</script>

<div class="space-y-4">
  {#if events.length === 0}
    <div class="text-center py-8 text-gray-400">
      <p class="text-3xl mb-2">📭</p>
      <p class="text-sm">暂无时间线记录</p>
    </div>
  {:else}
    <div class="relative">
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div class="space-y-6">
        {#each events as event}
          <div class="relative pl-10">
            <div class="absolute left-2.5 w-3 h-3 rounded-full {getTypeColor(event.event_type)} border-2 border-white shadow" />
            <div class="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{getTypeIcon(event.event_type)}</span>
                  <h4 class="font-medium text-gray-900">{event.event_title}</h4>
                </div>
                <span class="text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(event.created_at)}
                </span>
              </div>
              {#if event.event_description}
                <p class="mt-2 text-sm text-gray-600">{event.event_description}</p>
              {/if}
              <p class="mt-2 text-xs text-gray-400">操作人：{getOperatorName(event)}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
