<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type MedicalRecord, type MedicalFollowUp } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let records: MedicalRecord[] = [];
  let selectedRecord: MedicalRecord | null = null;
  let loading = true;
  let error: string | null = null;
  let followupContent = '';
  let showFollowupModal = false;

  $: selectedId = selectedRecord?.id || null;
  $: canHandle = auth.hasRole(['director', 'teacher', 'logistics']);
  $: unresolvedRecords = records.filter(r => r.status !== 'resolved');
  $: resolvedRecords = records.filter(r => r.status === 'resolved');

  let filter = 'all';

  const filterOptions = [
    { key: 'all', label: '全部' },
    { key: 'unresolved', label: '未解决' },
    { key: 'resolved', label: '已解决' },
  ];

  $: filteredRecords = filter === 'all' ? records :
    filter === 'unresolved' ? unresolvedRecords : resolvedRecords;

  function getFilterCount(key: string): number {
    switch (key) {
      case 'all': return records.length;
      case 'unresolved': return unresolvedRecords.length;
      case 'resolved': return resolvedRecords.length;
      default: return 0;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }

  function getStatus(record: MedicalRecord): string {
    return record.status;
  }

  function getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
    };
    return labels[severity] || severity;
  }

  function getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-700 border-green-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      high: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[severity] || colors.medium;
  }

  function getCamperName(record: MedicalRecord): string {
    return record.camper?.name || '未知';
  }

  async function loadRecords() {
    try {
      records = await api.getMedicalRecords();
    } catch (err) {
      error = err instanceof Error ? err.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  function selectRecord(record: MedicalRecord) {
    selectedRecord = record;
  }

  async function handleResolve() {
    if (!selectedRecord || !canHandle) return;
    try {
      const updated = await api.resolveMedical(selectedRecord.id);
      records = records.map(r => r.id === updated.id ? updated : r);
      selectedRecord = updated;
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleFollowup() {
    if (!selectedRecord || !canHandle || !followupContent.trim()) return;
    try {
      const updated = await api.addFollowup(selectedRecord.id, followupContent);
      records = records.map(r => r.id === updated.id ? updated : r);
      selectedRecord = updated;
      showFollowupModal = false;
      followupContent = '';
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  }

  onMount(() => {
    loadRecords();
  });
</script>

<div class="h-[calc(100vh-4rem)] -mx-8 -my-8">
  <DualPanel
    leftTitle="医疗记录"
    selectedId={selectedId}
  >
    <div slot="list">
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div class="flex gap-2">
          {#each filterOptions as option}
            <button
              on:click={() => filter = option.key}
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors {filter === option.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}"
            >
              {option.label}
              <span class="ml-1">{getFilterCount(option.key)}</span>
            </button>
          {/each}
        </div>
      </div>

      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      {:else if error}
        <div class="p-4 text-red-600 text-sm">{error}</div>
      {:else if filteredRecords.length === 0}
        <div class="text-center py-12 text-gray-400">
          <p class="text-3xl mb-2">🏥</p>
          <p class="text-sm">暂无医疗记录</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-100">
          {#each filteredRecords as record}
            <button
              on:click={() => selectRecord(record)}
              class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors {selectedRecord?.id === record.id ? 'bg-blue-50' : ''}"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{getCamperName(record)}</span>
                    <StatusBadge status={getStatus(record)} />
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full border {getSeverityColor(record.severity)}">
                      {getSeverityLabel(record.severity)}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">{record.type}</p>
                  <p class="text-xs text-gray-400 mt-1 line-clamp-1">{record.description}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-xs text-gray-400">{formatDate(record.reported_by ? '' : '')}</p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div slot="detail">
      {#if selectedRecord}
        <div class="h-full flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{getCamperName(selectedRecord)}</h2>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-500">{selectedRecord.type}</span>
                  <StatusBadge status={getStatus(selectedRecord)} />
                  <span class="px-2 py-0.5 text-xs font-medium rounded-full border {getSeverityColor(selectedRecord.severity)}">
                    {getSeverityLabel(selectedRecord.severity)}
                  </span>
                </div>
              </div>
              {#if canHandle && selectedRecord.status !== 'resolved'}
                <div class="flex gap-2">
                  <button
                    on:click={handleResolve}
                    class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    ✓ 标记解决
                  </button>
                  <button
                    on:click={() => showFollowupModal = true}
                    class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📝 添加随访
                  </button>
                </div>
              {/if}
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">填报人</p>
                  <p class="font-medium text-gray-900">{selectedRecord.reporter?.display_name || selectedRecord.reported_by}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">严重程度</p>
                  <p class="font-medium text-gray-900">{getSeverityLabel(selectedRecord.severity)}</p>
                </div>
              </div>

              <div class="bg-white p-4 rounded-lg border border-gray-100">
                <p class="text-xs text-gray-500 mb-1">描述</p>
                <p class="font-medium text-gray-900">{selectedRecord.description}</p>
              </div>

              <div class="bg-white p-4 rounded-lg border border-gray-100">
                <p class="text-xs text-gray-500 mb-1">治疗方案</p>
                <p class="font-medium text-gray-900">{selectedRecord.treatment}</p>
              </div>

              {#if selectedRecord.follow_ups && selectedRecord.follow_ups.length > 0}
                <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
                  <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 class="font-medium text-gray-900">随访记录</h3>
                  </div>
                  <div class="divide-y divide-gray-100">
                    {#each selectedRecord.follow_ups as followup}
                      <div class="px-4 py-3">
                        <div class="flex items-start justify-between gap-4">
                          <p class="text-sm text-gray-900">{followup.content}</p>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">
                          {followup.author?.display_name || followup.author_id}
                        </p>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if selectedRecord.status === 'resolved'}
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p class="text-sm font-medium text-green-800">已解决</p>
                  <p class="text-xs text-green-600 mt-1">
                    解决人：{selectedRecord.resolver?.display_name || selectedRecord.resolved_by || '-'}
                  </p>
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </DualPanel>
</div>

{#if showFollowupModal && selectedRecord}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">添加随访记录</h3>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-600 mb-4">为 {getCamperName(selectedRecord)} 添加随访记录：</p>
        <textarea
          bind:value={followupContent}
          rows="4"
          placeholder="请输入随访内容..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div class="flex justify-end gap-3 mt-4">
          <button
            on:click={() => { showFollowupModal = false; followupContent = ''; }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            on:click={handleFollowup}
            disabled={!followupContent.trim()}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
