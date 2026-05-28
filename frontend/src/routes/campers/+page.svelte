<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Camper, type TimelineEvent } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';
  import Timeline from '../../lib/components/Timeline.svelte';

  let campers: Camper[] = [];
  let selectedCamper: Camper | null = null;
  let timeline: TimelineEvent[] = [];
  let loading = true;
  let detailLoading = false;
  let error: string | null = null;

  let newCamper = {
    name: '',
    gender: '男' as string,
    age: 10,
    group_name: '',
    emergency_contact: '',
    emergency_phone: '',
    health_notes: '',
    room_id: null as string | null,
    status: 'active' as const,
  };

  let showCreateForm = false;
  let activeTab: 'info' | 'timeline' = 'info';

  $: selectedId = selectedCamper?.id || null;
  $: canEdit = auth.hasRole(['director', 'teacher']);

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  async function loadCampers() {
    try {
      campers = await api.getCampers();
    } catch (err) {
      error = err instanceof Error ? err.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  async function selectCamper(camper: Camper) {
    selectedCamper = camper;
    detailLoading = true;
    try {
      timeline = await api.getCamperTimeline(camper.id);
    } catch (err) {
      console.error('加载时间线失败', err);
    } finally {
      detailLoading = false;
    }
  }

  async function handleCreate(e: Event) {
    e.preventDefault();
    try {
      const camper = await api.createCamper(newCamper);
      campers = [camper, ...campers];
      showCreateForm = false;
      newCamper = {
        name: '',
        gender: '男',
        age: 10,
        group_name: '',
        emergency_contact: '',
        emergency_phone: '',
        health_notes: '',
        room_id: null,
        status: 'active',
      };
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    }
  }

  onMount(() => {
    loadCampers();
  });
</script>

<div class="h-[calc(100vh-4rem)] -mx-8 -my-8">
  <DualPanel
    leftTitle="营员列表"
    selectedId={selectedId}
    showCreate={canEdit}
    createLabel="添加营员"
  >
    <div slot="list">
      {#if loading}
        <div class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      {:else if error}
        <div class="p-4 text-red-600 text-sm">{error}</div>
      {:else if campers.length === 0}
        <div class="text-center py-12 text-gray-400">
          <p class="text-3xl mb-2">👥</p>
          <p class="text-sm">暂无营员</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-100">
          {#each campers as camper}
            <button
              on:click={() => selectCamper(camper)}
              class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors {selectedCamper?.id === camper.id ? 'bg-blue-50' : ''}"
            >
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                  {camper.name.charAt(0)}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 truncate">{camper.name}</span>
                    <span class="text-xs text-gray-400">{camper.gender} · {camper.age}岁</span>
                  </div>
                  <p class="text-sm text-gray-500 truncate">{camper.group_name || '-'}</p>
                  <div class="mt-2">
                    <StatusBadge status={camper.status} />
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div slot="detail">
      {#if selectedCamper}
        <div class="h-full flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {selectedCamper.name.charAt(0)}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">{selectedCamper.name}</h2>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-sm text-gray-500">{selectedCamper.gender} · {selectedCamper.age}岁</span>
                    <StatusBadge status={selectedCamper.status} />
                  </div>
                </div>
              </div>
            </div>
            <div class="flex gap-1 mt-4 border-b border-gray-200">
              <button
                on:click={() => activeTab = 'info'}
                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'info' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}"
              >
                基本信息
              </button>
              <button
                on:click={() => activeTab = 'timeline'}
                class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'timeline' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'}"
              >
                时间线
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            {#if activeTab === 'info'}
              <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-white p-4 rounded-lg border border-gray-100">
                    <p class="text-xs text-gray-500 mb-1">组别</p>
                    <p class="font-medium text-gray-900">{selectedCamper.group_name || '-'}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg border border-gray-100">
                    <p class="text-xs text-gray-500 mb-1">紧急联系人</p>
                    <p class="font-medium text-gray-900">{selectedCamper.emergency_contact || '-'}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg border border-gray-100">
                    <p class="text-xs text-gray-500 mb-1">紧急联系电话</p>
                    <p class="font-medium text-gray-900">{selectedCamper.emergency_phone || '-'}</p>
                  </div>
                  <div class="bg-white p-4 rounded-lg border border-gray-100">
                    <p class="text-xs text-gray-500 mb-1">房间</p>
                    <p class="font-medium text-gray-900">{selectedCamper.room?.name || selectedCamper.room_id || '未分配'}</p>
                  </div>
                </div>

                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">健康注意事项</p>
                  <p class="font-medium text-gray-900">{selectedCamper.health_notes || '无'}</p>
                </div>
              </div>
            {:else}
              {#if detailLoading}
                <div class="flex items-center justify-center py-12">
                  <div class="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              {:else}
                <Timeline events={timeline} />
              {/if}
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <div slot="create-form" let:handleCloseCreate>
      <form on:submit={handleCreate} class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input
              type="text"
              bind:value={newCamper.name}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">性别 *</label>
            <select
              bind:value={newCamper.gender}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">年龄 *</label>
            <input
              type="number"
              bind:value={newCamper.age}
              required
              min="5"
              max="18"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">组别</label>
            <input
              type="text"
              bind:value={newCamper.group_name}
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="如：向日葵班"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">紧急联系人 *</label>
            <input
              type="text"
              bind:value={newCamper.emergency_contact}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">紧急联系电话 *</label>
            <input
              type="tel"
              bind:value={newCamper.emergency_phone}
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">健康注意事项</label>
          <textarea
            bind:value={newCamper.health_notes}
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="无特殊情况请填'无'"
          />
        </div>
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            on:click={handleCloseCreate}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            添加
          </button>
        </div>
      </form>
    </div>
  </DualPanel>
</div>
