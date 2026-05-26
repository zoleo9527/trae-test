<script lang="ts">
  import { api } from '$lib/api';
  import { onMount } from 'svelte';

  let fuels: any[] = [];
  let loading = true;
  let error: string | null = null;
  let showCreateForm = false;

  let newFuel = {
    application_id: '',
    vehicle_no: '',
    liters: '',
    cost: '',
    note: ''
  };

  onMount(async () => {
    try {
      fuels = await api.getFuels();
    } catch (e: any) {
      error = e.message;
    }
    loading = false;
  });

  async function refresh() {
    loading = true;
    fuels = await api.getFuels();
    loading = false;
  }

  async function createFuel() {
    try {
      await api.postFuel({
        ...newFuel,
        application_id: newFuel.application_id ? parseInt(newFuel.application_id) : null,
        liters: parseFloat(newFuel.liters),
        cost: parseFloat(newFuel.cost)
      });
      newFuel = { application_id: '', vehicle_no: '', liters: '', cost: '', note: '' };
      showCreateForm = false;
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  }
</script>

<div class="fuels-page">
  <div class="page-header">
    <div>
      <h2>油料记录</h2>
      <p class="subtitle">农机作业油料消耗登记</p>
    </div>
    <button class="btn-primary" on:click={() => showCreateForm = !showCreateForm}>
      {showCreateForm ? '取消' : '⛽ 新增记录'}
    </button>
  </div>

  {#if showCreateForm}
    <div class="form-card">
      <h3>新增油料记录</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>关联申报ID（可选）</label>
          <input type="number" bind:value={newFuel.application_id} placeholder="留空表示通用加油" />
        </div>
        <div class="form-group">
          <label>车牌号</label>
          <input type="text" bind:value={newFuel.vehicle_no} placeholder="如：鲁H-12345" />
        </div>
        <div class="form-group">
          <label>加油量（升）</label>
          <input type="number" bind:value={newFuel.liters} placeholder="请输入" />
        </div>
        <div class="form-group">
          <label>金额（元）</label>
          <input type="number" bind:value={newFuel.cost} placeholder="请输入" />
        </div>
        <div class="form-group full-width">
          <label>备注</label>
          <input type="text" bind:value={newFuel.note} placeholder="可选" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" on:click={() => showCreateForm = false}>取消</button>
        <button class="btn-primary" on:click={createFuel}>保存</button>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="list">
      {#each fuels as f}
        <div class="fuel-card">
          <div class="card-main">
            <div class="card-left">
              <span class="vehicle">{f.vehicle_no || '未登记车辆'}</span>
              {#if f.app_code}
                <span class="app-code">关联：{f.app_code}</span>
              {/if}
            </div>
            <div class="card-right">
              <span class="liters">{f.liters} L</span>
              <span class="cost">¥{f.cost}</span>
              <span class="operator">{f.operator_name}</span>
              <span class="time">{f.recorded_at?.slice(0, 16)}</span>
            </div>
          </div>
          {#if f.note}
            <div class="note">{f.note}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fuels-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .subtitle {
    color: #6b7280;
    font-size: 14px;
  }

  .btn-primary {
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .btn-secondary {
    padding: 10px 20px;
    background: #f3f4f6;
    color: #374151;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
  }

  .loading, .error {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .error {
    color: #ef4444;
    background: #fee2e2;
    border-radius: 8px;
  }

  .form-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .form-card h3 {
    margin-bottom: 20px;
    font-size: 18px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .form-group input {
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }

  .form-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .fuel-card {
    background: white;
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .card-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-left, .card-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .vehicle {
    font-weight: 600;
    color: #111827;
    font-family: monospace;
  }

  .app-code {
    font-size: 12px;
    color: #6b7280;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .liters {
    font-weight: 600;
    color: #1e40af;
    font-size: 15px;
  }

  .cost {
    font-weight: 600;
    color: #059669;
    font-size: 15px;
  }

  .operator {
    color: #4b5563;
    font-size: 13px;
  }

  .time {
    color: #6b7280;
    font-size: 13px;
    font-family: monospace;
  }

  .note {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f3f4f6;
    font-size: 13px;
    color: #6b7280;
  }
</style>
