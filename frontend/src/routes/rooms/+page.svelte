<script lang="ts">
  import { onMount } from 'svelte';
  import { api, type Room, type Camper } from '../../lib/api/client';
  import { auth } from '../../lib/stores/auth';
  import DualPanel from '../../lib/components/DualPanel.svelte';
  import StatusBadge from '../../lib/components/StatusBadge.svelte';

  let rooms: Room[] = [];
  let campers: Camper[] = [];
  let selectedRoom: Room | null = null;
  let loading = true;
  let submitting = false;
  let error: string | null = null;
  let selectedCamperId = '';
  let showAssignModal = false;
  let showCreateModal = false;

  let newRoomName = '';
  let newBuilding = '';
  let newCapacity = 1;

  $: selectedId = selectedRoom?.id || null;
  $: canManage = auth.hasRole(['director', 'logistics']);
  $: availableCampers = campers.filter(c => !c.room_id && c.status === 'active');

  function getCurrentOccupancy(room: Room): number {
    return room.campers?.length || 0;
  }

  function getRoomStatus(room: Room): string {
    const occupancy = getCurrentOccupancy(room);
    if (occupancy >= room.capacity) return 'full';
    if (occupancy > 0) return 'available';
    return 'available';
  }

  async function loadData() {
    try {
      const [roomsData, campersData] = await Promise.all([
        api.getRooms(),
        api.getCampers(),
      ]);
      rooms = roomsData;
      campers = campersData;
    } catch (err) {
      error = err instanceof Error ? err.message : '加载失败';
    } finally {
      loading = false;
    }
  }

  function selectRoom(room: Room) {
    selectedRoom = room;
  }

  async function handleAssign() {
    if (!selectedRoom || !selectedCamperId || !canManage) return;
    try {
      const updated = await api.assignRoom(selectedRoom.id, selectedCamperId);
      rooms = rooms.map(r => r.id === updated.id ? updated : r);
      selectedRoom = updated;
      showAssignModal = false;
      selectedCamperId = '';
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '分配失败');
    }
  }

  async function handleUnassign(camperId: string) {
    if (!selectedRoom || !canManage) return;
    if (!confirm('确定要取消该营员的房间分配吗？')) return;
    try {
      const updated = await api.unassignRoom(selectedRoom.id, camperId);
      rooms = rooms.map(r => r.id === updated.id ? updated : r);
      selectedRoom = updated;
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleCreate() {
    if (!newRoomName || !newBuilding || newCapacity <= 0) return;
    submitting = true;
    try {
      await api.createRoom({
        name: newRoomName,
        building: newBuilding,
        capacity: newCapacity,
      });
      await loadData();
      showCreateModal = false;
      resetCreateForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败');
    } finally {
      submitting = false;
    }
  }

  function resetCreateForm() {
    newRoomName = '';
    newBuilding = '';
    newCapacity = 1;
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="h-[calc(100vh-4rem)] -mx-8 -my-8">
  <DualPanel
    leftTitle="房间列表"
    selectedId={selectedId}
  >
    <div slot="list">
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-500">
            共 {rooms.length} 个房间
          </div>
          {#if canManage}
            <button
              on:click={() => showCreateModal = true}
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 新增房间
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
      {:else if rooms.length === 0}
        <div class="text-center py-12 text-gray-400">
          <p class="text-3xl mb-2">🏠</p>
          <p class="text-sm">暂无房间</p>
        </div>
      {:else}
        <div class="divide-y divide-gray-100">
          {#each rooms as room}
            <button
              on:click={() => selectRoom(room)}
              class="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors {selectedRoom?.id === room.id ? 'bg-blue-50' : ''}"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900">{room.name}</span>
                    <StatusBadge status={getRoomStatus(room)} />
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    {room.building}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {getCurrentOccupancy(room)}/{room.capacity}人
                  </p>
                </div>
                <div class="text-right flex-shrink-0">
                  <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-blue-500 transition-all"
                      style="width: {(getCurrentOccupancy(room) / room.capacity) * 100}%"
                    />
                  </div>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <div slot="detail">
      {#if selectedRoom}
        <div class="h-full flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{selectedRoom.name}</h2>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-sm text-gray-500">
                    {selectedRoom.building}
                  </span>
                  <StatusBadge status={getRoomStatus(selectedRoom)} />
                </div>
              </div>
              {#if canManage && getCurrentOccupancy(selectedRoom) < selectedRoom.capacity}
                <button
                  on:click={() => showAssignModal = true}
                  class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + 分配营员
                </button>
              {/if}
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">容量</p>
                  <p class="font-medium text-gray-900">{getCurrentOccupancy(selectedRoom)} / {selectedRoom.capacity} 人</p>
                  <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                      class="h-full bg-blue-500 transition-all"
                      style="width: {(getCurrentOccupancy(selectedRoom) / selectedRoom.capacity) * 100}%"
                    />
                  </div>
                </div>
                <div class="bg-white p-4 rounded-lg border border-gray-100">
                  <p class="text-xs text-gray-500 mb-1">剩余床位</p>
                  <p class="font-medium text-gray-900">{selectedRoom.capacity - getCurrentOccupancy(selectedRoom)} 个</p>
                </div>
              </div>

              <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div class="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 class="font-medium text-gray-900">入住营员</h3>
                </div>
                {#if getCurrentOccupancy(selectedRoom) === 0}
                  <div class="p-8 text-center text-gray-400">
                    <p class="text-2xl mb-2">🛏️</p>
                    <p class="text-sm">暂无入住营员</p>
                  </div>
                {:else}
                  <div class="divide-y divide-gray-100">
                    {#each selectedRoom.campers || [] as camper}
                      <div class="px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {camper.name.charAt(0)}
                          </div>
                          <div>
                            <p class="font-medium text-gray-900">{camper.name}</p>
                            <p class="text-xs text-gray-500">{camper.gender} · {camper.age}岁 · {camper.group_name || '-'}</p>
                          </div>
                        </div>
                        {#if canManage}
                          <button
                            on:click={() => handleUnassign(camper.id)}
                            class="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            取消分配
                          </button>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
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
        <h3 class="text-lg font-semibold text-gray-800">新增房间</h3>
      </div>
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">房间名称 <span class="text-red-500">*</span></label>
          <input
            type="text"
            bind:value={newRoomName}
            placeholder="如 A-101"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">楼栋 <span class="text-red-500">*</span></label>
          <input
            type="text"
            bind:value={newBuilding}
            placeholder="如 A栋"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">容量 <span class="text-red-500">*</span></label>
          <input
            type="number"
            bind:value={newCapacity}
            min="1"
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
            disabled={!newRoomName || !newBuilding || newCapacity <= 0 || submitting}
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

{#if showAssignModal && selectedRoom}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" on:click|self={() => { showAssignModal = false; selectedCamperId = ''; }}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">分配营员到 {selectedRoom.name}</h3>
      </div>
      <div class="p-6">
        {#if availableCampers.length === 0}
          <div class="text-center py-8 text-gray-400">
            <p class="text-2xl mb-2">👥</p>
            <p class="text-sm">暂无待分配的营员</p>
          </div>
        {:else}
          <label class="block text-sm font-medium text-gray-700 mb-2">选择营员</label>
          <select
            bind:value={selectedCamperId}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">请选择营员</option>
            {#each availableCampers as camper}
              <option value={camper.id}>{camper.name} ({camper.gender} · {camper.age}岁)</option>
            {/each}
          </select>
        {/if}
        <div class="flex justify-end gap-3 mt-6">
          <button
            on:click={() => { showAssignModal = false; selectedCamperId = ''; }}
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            on:click={handleAssign}
            disabled={!selectedCamperId}
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
