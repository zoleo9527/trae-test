<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api, type Attendance, type Camper } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let records: Attendance[] = [];
  let campers: Camper[] = [];
  let selectedRecord: Attendance | null = null;
  let loading = true;
  let submitting = false;
  let error: string | null = null;
  let rejectReason = '';
  let showRejectModal = false;
  let showCreateModal = false;

  let newCamperId = '';
  let newDate = new Date().toISOString().split('T')[0];
  let newSession = '上午';
  let newStatus: 'present' | 'absent' | 'late' = 'present';
  let newRemark = '';

  $: selectedId = selectedRecord?.id || null;
  $: canApprove = auth.hasRole(['director']);
  $: canCreate = auth.hasRole(['director', 'teacher']);
  $: pendingRecords = records.filter(r => r.approval_status === 'pending');
  $: approvedRecords = records.filter(r => r.approval_status === 'approved');
  $: rejectedRecords = records.filter(r => r.approval_status === 'rejected');

  let filter = 'all';

  const filterOptions = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审批' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已驳回' },
  ];

  const sessionOptions = ['上午', '下午', '晚间'];
  const statusOptions = [
    { value: 'present', label: '出勤' },
    { value: 'absent', label: '缺勤' },
    { value: 'late', label: '迟到' },
  ];

  $: filteredRecords = filter === 'all' ? records :
    filter === 'pending' ? pendingRecords :
    filter === 'approved' ? approvedRecords : rejectedRecords;

  function getFilterCount(key: string): number {
    switch (key) {
      case 'all': return records.length;
      case 'pending': return pendingRecords.length;
      case 'approved': return approvedRecords.length;
      case 'rejected': return rejectedRecords.length;
      default: return 0;
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN');
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      present: '出勤',
      absent: '缺勤',
      late: '迟到',
    };
    return labels[status] || status;
  }

  function getApprovalStatus(record: Attendance): string {
    return record.approval_status;
  }

  function getCamperName(record: Attendance): string {
    return record.camper?.name || '未知';
  }

  async function loadRecords() {
    try {
      records = await api.getAttendance();
    } catch (err) {
      error = err instanceof Error ? err.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  async function loadCampers() {
    try {
      campers = await api.getCampers();
    } catch (err) {
      console.error('加载营员列表失败:', err);
    }
  }

  function selectRecord(record: Attendance) {
    selectedRecord = record;
  }

  async function handleApprove() {
    if (!selectedRecord || !canApprove) return;
    try {
      const updated = await api.approveAttendance(selectedRecord.id);
      records = records.map(r => r.id === updated.id ? updated : r);
      selectedRecord = updated;
    } catch (err) {
      alert(err instanceof Error ? err.message : '审批失败');
    }
  }

  async function handleReject() {
    if (!selectedRecord || !canApprove || !rejectReason.trim()) return;
    try {
      const updated = await api.rejectAttendance(selectedRecord.id, rejectReason);
      records = records.map(r => r.id === updated.id ? updated : r);
      selectedRecord = updated;
      showRejectModal = false;
      rejectReason = '';
    } catch (err) {
      alert(err instanceof Error ? err.message : '驳回失败');
    }
  }

  async function handleCreate() {
    if (!newCamperId || !newDate || !newSession || !newStatus) return;
    submitting = true;
    try {
      const newRecord = await api.createAttendance({
        camper_id: newCamperId,
        date: newDate,
        session: newSession,
        status: newStatus,
        remark: newRemark,
      });
      await loadRecords();
      selectedRecord = records.find(r => r.id === newRecord.id) || newRecord;
      showCreateModal = false;
      resetCreateForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      submitting = false;
    }
  }

  function resetCreateForm() {
    newCamperId = '';
    newDate = new Date().toISOString().split('T')[0];
    newSession = '上午';
    newStatus = 'present';
    newRemark = '';
  }

  const statusToFilterMap: Record<string, string> = {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
  };

  onMount(async () => {
    await loadRecords();
    loadCampers();
    const params = $page.url.searchParams;
    const status = params.get('status');
    const id = params.get('id');
    if (status && statusToFilterMap[status]) {
      filter = statusToFilterMap[status];
    }
    if (id && records.length > 0) {
      const target = records.find(r => r.id === id);
      if (target) selectedRecord = target;
    }
  });
</script>

<div class="h-[calc(100vh-4rem)] -mx-8 -my-8">
  <DualPanel
    leftTitle="考勤记录"
    selectedId={selectedId}
  >
    <div slot="list">
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center justify-between gap-4">
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
          {#if canCreate}
            <button
              on:click={() => showCreateModal = true}
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              + 新增考勤
            </button>
          {/if}
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
          <p class="text-3xl mb-2">✅</p>
          <p class="text-sm">暂无考勤记录</p>
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
                    <StatusBadge status={getApprovalStatus(record)} />
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    {formatDate(record.date)} · {record.session} · {getStatusLabel(record.status)}
                  </p>
                  {#if record.remark}
                    <p class="text-xs text-gray-400 mt-1 line-clamp-1">{record.remark}</p>
                  {/if}
                </div>
                <div class="text-right flex-shrink-0">
                  <StatusBadge status={record.status} />
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
                  <span class="text-sm text-gray-500">{formatDate(selectedRecord.date)} · {selectedRecord.session}</span>
                  <StatusBadge status={getApprovalStatus(selectedRecord)} />
                </div>
              </div>
              {#if selectedRecord.approval_status === 'pending'}
                <div class="flex gap-2">
                  {#if canApprove}
                    <button
                      on:click={handleApprove}
                      class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ✓ 通过
                    </button>
                    <button
                      on:click={() => showRejectModal = true}
                      class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ✕ 驳回
                    </button>
                  {:else}
                    <button
                      disabled
                      title="仅营地主任可审批考勤"
                      class="px-4 py-2 text-sm bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      ✓ 通过
                    </button>
                    <button
                      disabled
                      title="仅营地主任可驳回考勤"
                      class="px-4 py-2 text-sm bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    >
                      ✕ 驳回
                    </button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">考勤状态</p>
                  <p class="font-medium text-gray-900">{getStatusLabel(selectedRecord.status)}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">时段</p>
                  <p class="font-medium text-gray-900">{selectedRecord.session}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">填报人</p>
                  <p class="font-medium text-gray-900">{selectedRecord.submitter?.display_name || selectedRecord.submitted_by}</p>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">审核人</p>
                  <p class="font-medium text-gray-900">{selectedRecord.reviewer?.display_name || selectedRecord.reviewed_by || '-'}</p>
                </div>
              </div>

              {#if selectedRecord.remark}
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">备注</p>
                  <p class="font-medium text-gray-900">{selectedRecord.remark}</p>
                </div>
              {/if}

              {#if selectedRecord.approval_status === 'approved'}
                <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p class="text-sm font-medium text-green-800">已通过</p>
                  <p class="text-xs text-green-600 mt-1">
                    审批人：{selectedRecord.reviewer?.display_name || selectedRecord.reviewed_by || '-'}
                  </p>
                </div>
              {/if}

              {#if selectedRecord.approval_status === 'rejected'}
                <div class="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p class="text-sm font-medium text-red-800">已驳回</p>
                  <p class="text-xs text-red-600 mt-1">
                    驳回人：{selectedRecord.reviewer?.display_name || selectedRecord.reviewed_by || '-'}
                  </p>
                  {#if selectedRecord.rejection_reason}
                    <p class="text-xs text-red-600 mt-2">
                      驳回原因：{selectedRecord.rejection_reason}
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </DualPanel>
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click|self={() => { showCreateModal = false; resetCreateForm(); }}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">新增考勤记录</h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择营员 <span class="text-red-500">*</span></label>
          <select
            bind:value={newCamperId}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择营员</option>
            {#each campers as camper}
              <option value={camper.id}>{camper.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">日期 <span class="text-red-500">*</span></label>
          <input
            type="date"
            bind:value={newDate}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">时段 <span class="text-red-500">*</span></label>
          <select
            bind:value={newSession}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {#each sessionOptions as session}
              <option value={session}>{session}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状态 <span class="text-red-500">*</span></label>
          <select
            bind:value={newStatus}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {#each statusOptions as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            bind:value={newRemark}
            rows="3"
            placeholder="请输入备注（可选）"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            on:click={() => { showCreateModal = false; resetCreateForm(); }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            on:click={handleCreate}
            disabled={!newCamperId || !newDate || !newSession || !newStatus || submitting}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {#if submitting}
              <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            {/if}
            {submitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showRejectModal && selectedRecord}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click|self={() => { showRejectModal = false; rejectReason = ''; }}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">驳回考勤记录</h3>
      </div>
      <div class="p-6">
        <p class="text-sm text-gray-600 mb-4">确定要驳回 {getCamperName(selectedRecord)} 的考勤记录吗？请填写驳回原因：</p>
        <textarea
          bind:value={rejectReason}
          rows="4"
          placeholder="请输入驳回原因..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <div class="flex justify-end gap-3 mt-4">
          <button
            on:click={() => { showRejectModal = false; rejectReason = ''; }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            on:click={handleReject}
            disabled={!rejectReason.trim()}
            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
