<script>
  import { onMount } from 'svelte';
  import { packageAPI } from '$lib/api';
  import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-svelte';

  let packages = [];
  let loading = true;
  let showForm = false;
  let editing = null;
  let form = { name: '', duration: 30, price: 0, original_price: 0, description: '' };

  async function loadData() {
    loading = true;
    try {
      packages = await packageAPI.list();
    } finally {
      loading = false;
    }
  }

  function openCreate() {
    editing = null;
    form = { name: '', duration: 30, price: 0, original_price: 0, description: '' };
    showForm = true;
  }

  function openEdit(pkg) {
    editing = pkg;
    form = { ...pkg };
    showForm = true;
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await packageAPI.update(editing.id, form);
      } else {
        await packageAPI.create(form);
      }
      showForm = false;
      loadData();
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleDelete(id) {
    if (confirm('确定删除此套餐？')) {
      await packageAPI.delete(id);
      loadData();
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button on:click={loadData} class="btn-secondary flex items-center gap-2">
        <RefreshCw class="w-4 h-4" />
        刷新
      </button>
    </div>
    <button on:click={openCreate} class="btn-primary flex items-center gap-2">
      <Plus class="w-4 h-4" />
      新增套餐
    </button>
  </div>

  {#if showForm}
    <div class="card p-6">
      <h3 class="text-lg font-semibold mb-4">{editing ? '编辑' : '新增'}套餐</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">套餐名称</label>
          <input type="text" bind:value={form.name} class="input" placeholder="如：年度会员" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">有效期（天）</label>
          <input type="number" bind:value={form.duration} class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">售价</label>
          <input type="number" bind:value={form.price} step="0.01" class="input" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">原价</label>
          <input type="number" bind:value={form.original_price} step="0.01" class="input" />
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">描述</label>
        <textarea bind:value={form.description} class="input" rows="3" />
      </div>
      <div class="flex gap-3">
        <button on:click={handleSubmit} class="btn-primary">保存</button>
        <button on:click={() => (showForm = false)} class="btn-secondary">取消</button>
      </div>
    </div>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {#if loading}
      {#each Array(4) as _}
        <div class="card p-6 animate-pulse">
          <div class="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      {/each}
    {:else}
      {#each packages as pkg}
        <div class="card p-6 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-semibold text-gray-900">{pkg.name}</h3>
            <div class="flex gap-1">
              <button on:click={() => openEdit(pkg)} class="p-1.5 hover:bg-gray-100 rounded">
                <Edit2 class="w-4 h-4 text-gray-400" />
              </button>
              <button on:click={() => handleDelete(pkg.id)} class="p-1.5 hover:bg-gray-100 rounded">
                <Trash2 class="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <p class="text-sm text-gray-500 mb-4">{pkg.duration} 天有效期</p>
          <p class="text-sm text-gray-500 mb-4 line-clamp-2">{pkg.description}</p>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-primary-600">¥{pkg.price}</span>
            {#if pkg.original_price > pkg.price}
              <span class="text-sm text-gray-400 line-through">¥{pkg.original_price}</span>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
