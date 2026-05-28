<script lang="ts">
  export let leftTitle: string;
  export let selectedId: string | null = null;
  export let showCreate: boolean = false;
  export let createDisabled: boolean = false;
  export let createDisabledTitle: string = '';
  export let createLabel: string = '新建';

  let showCreateModal = false;

  function handleCreate() {
    showCreateModal = true;
  }

  function handleCloseCreate() {
    showCreateModal = false;
  }
</script>

<div class="flex h-full min-h-0">
  <div class="w-96 border-r border-gray-200 bg-white flex flex-col min-h-0">
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-800">{leftTitle}</h2>
      {#if showCreate}
        {#if createDisabled}
          <button
            disabled
            title={createDisabledTitle}
            class="px-3 py-1.5 text-sm bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            + {createLabel}
          </button>
        {:else}
          <button
            on:click={handleCreate}
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + {createLabel}
          </button>
        {/if}
      {/if}
    </div>
    <div class="flex-1 overflow-y-auto min-h-0">
      <slot name="list" />
    </div>
  </div>

  <div class="flex-1 bg-gray-50 flex flex-col min-h-0">
    {#if selectedId}
      <slot name="detail" />
    {:else}
      <div class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <p class="text-4xl mb-2">👈</p>
          <p class="text-sm">请从左侧列表选择一项查看详情</p>
        </div>
      </div>
    {/if}
  </div>
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 class="text-lg font-semibold text-gray-800">{createLabel}</h3>
        <button
          on:click={handleCloseCreate}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      </div>
      <slot name="create-form" {handleCloseCreate} />
    </div>
  </div>
{/if}
