<script lang="ts">
  export let onClose: () => void
  export let onExport: () => void
  export let onImport: (file: File) => void

  let activeTab: 'export' | 'import' = 'export'
  let importStatus = ''
  let importError = ''

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      importStatus = '正在导入...'
      importError = ''
      try {
        onImport(file)
        importStatus = '导入成功！'
        setTimeout(() => onClose, 1500)
      } catch (err) {
        importError = '导入失败：' + (err as Error).message
        importStatus = ''
      }
    }
  }
</script>

<div class="modal-overlay" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h3 class="modal-title">💾 数据导入/导出</h3>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>

    <div class="tabs">
      <div class="tab {activeTab === 'export' ? 'active' : ''}" on:click={() => activeTab = 'export'}>
        📤 导出数据
      </div>
      <div class="tab {activeTab === 'import' ? 'active' : ''}" on:click={() => activeTab = 'import'}>
        📥 导入数据
      </div>
    </div>

    <div class="modal-body">
      {#if activeTab === 'export'}
        <div class="export-section">
        <div class="export-info">
          <div class="export-icon">📦</div>
          <h4>导出所有数据</h4>
          <p>将导出所有订单、批次、问题记录等数据导出为 JSON 文件</p>
          <p class="hint">导出的文件可以用于备份或在其他设备导入</p>
        </div>
        <button class="btn-primary btn-lg" on:click={() => { onExport(); onClose(); }}>
          📥 导出数据
        </button>
      </div>
      {:else}
        <div class="import-section">
          <div class="import-info">
            <div class="import-icon">📥</div>
            <h4>导入数据</h4>
            <p>选择之前导出的 JSON 文件导入数据</p>
            <p class="warning">⚠️ 导入会覆盖当前所有数据</p>
          </div>
          
          <div class="file-upload">
            <label class="file-label">
              <input type="file" accept=".json" on:change={handleFileSelect} />
              <span>选择文件</span>
            </label>
          </div>

          {#if importStatus}
            <div class="status success">{importStatus}</div>
          {/if}
          {#if importError}
            <div class="status error">{importError}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .export-section,
  .import-section {
    text-align: center;
    padding: 1rem 0;
  }

  .export-icon,
  .import-icon {
    font-size: 48px;
    margin-bottom: 1rem;
  }

  .export-info h4,
  .import-info h4 {
    margin: 0 0 0.5rem 0;
    font-size: 18px;
  }

  .export-info p,
  .import-info p {
    color: var(--gray-600);
    margin: 0.5rem 0;
  }

  .hint {
    font-size: 12px;
    color: var(--gray-500);
  }

  .warning {
    color: var(--danger);
    font-weight: 500;
  }

  .file-upload {
    margin: 1.5rem 0;
  }

  .file-label {
    display: inline-block;
    padding: 0.75rem 2rem;
    background: var(--primary);
    color: white;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 500;
    transition: background 0.15s ease;
  }

  .file-label:hover {
    background: var(--primary-dark);
  }

  .file-label input {
    display: none;
  }

  .status {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
  }

  .status.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
  }

  .status.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger);
  }
</style>
