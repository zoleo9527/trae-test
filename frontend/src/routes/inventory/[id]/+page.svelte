<script>
	import { onMount } from 'svelte';
	import { inventoryApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { formatDate, formatDateShort, getRoleLabel, getErrorMessage, isAuthError } from '$lib/utils';

	let loading = true;
	let inventory = null;
	let logs = [];
	let activeTab = 'detail';
	let actualQty = 0;
	let remark = '';
	let adjustQty = 0;
	let adjustReason = '';
	let actionLoading = false;
	let showAdjustModal = false;

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: invId = $page.params.id;

	onMount(() => {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const data = await inventoryApi.get(invId);
			inventory = data.inventory;
			logs = data.logs;
			actualQty = inventory.quantity;
		} catch (e) {
			console.error('Failed to load inventory detail:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	async function handleStockCount() {
		if (!inventory) return;
		actionLoading = true;
		try {
			inventory = await inventoryApi.stockCount(inventory.id, actualQty, remark);
			await loadData();
		} catch (e) {
			alert('盘点失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleAdjust() {
		if (!inventory || adjustQty === 0 || !adjustReason) return;
		actionLoading = true;
		try {
			inventory = await inventoryApi.adjust(inventory.id, adjustQty, adjustReason);
			showAdjustModal = false;
			adjustQty = 0;
			adjustReason = '';
			await loadData();
		} catch (e) {
			alert('调整失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	function canStockCount() {
		return currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}

	function canAdjust() {
		return currentUser && currentUser.role === 'manager';
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else if inventory}
		<div class="page-header">
			<div>
				<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/inventory')}>
					← 返回
				</button>
				<span style="font-size: 24px; font-weight: 600;">库存盘点</span>
			</div>
			<div class="page-actions">
				{#if canAdjust()}
					<button class="btn btn-warning" on:click={() => (showAdjustModal = true)}>
						⚙️ 库存调整
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
			</div>
		</div>

		<div class="tabs">
			<button class={activeTab === 'detail' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'detail')}>
				库存详情
			</button>
			<button class={activeTab === 'logs' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'logs')}>
				操作留痕 ({logs.length})
			</button>
		</div>

		{#if activeTab === 'detail'}
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
				<div class="section">
					<h3 class="section-title">当前库存</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">门店</span>
							<span class="detail-value">{inventory.storeCode}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">商品ID</span>
							<span class="detail-value">{inventory.productId}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">总库存</span>
							<span class="detail-value" style="font-size: 20px; font-weight: 700;">{inventory.quantity}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">预留</span>
							<span class="detail-value">{inventory.reservedQty}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">可用</span>
							<span class="detail-value" style="font-weight: 600; color: {inventory.availableQty > 0 ? '#16a34a' : '#dc2626'};">{inventory.availableQty}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">上次盘点</span>
							<span class="detail-value">{inventory.lastCountDate ? formatDateShort(inventory.lastCountDate) : '从未'}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">上次盘点数</span>
							<span class="detail-value">{inventory.lastCountQty}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">偏差</span>
							<span class="detail-value" style="color: {inventory.deviationQty !== 0 ? '#dc2626' : '#16a34a'}; font-weight: 600;">
								{inventory.deviationQty > 0 ? '+' : ''}{inventory.deviationQty}
							</span>
						</div>
					</div>
				</div>

				{#if canStockCount()}
					<div class="section">
						<h3 class="section-title">盘点操作</h3>
						<div class="form-group">
							<label class="form-label">实际库存数量</label>
							<input class="form-input" type="number" min="0" bind:value={actualQty} />
						</div>
						<div class="form-group">
							<label class="form-label">盘点备注</label>
							<textarea class="form-textarea" bind:value={remark} rows={3} placeholder="请输入盘点备注" />
						</div>
						{#if actualQty !== inventory.quantity}
							<div class="alert alert-warning">
								实际数量与系统数量不一致，偏差为 {actualQty - inventory.quantity > 0 ? '+' : ''}{actualQty - inventory.quantity}
							</div>
						{/if}
						<button class="btn btn-primary" on:click={handleStockCount} disabled={actionLoading} style="width: 100%;">
							{#if actionLoading}提交中...{:else}确认盘点{/if}
						</button>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'logs'}
			<div class="section">
				<h3 class="section-title">操作留痕</h3>
				{#if logs.length > 0}
					<div class="timeline">
						{#each logs as log}
							<div class="timeline-item">
								<div class="timeline-item-title">{log.action}</div>
								<div class="timeline-item-time">{formatDate(log.createdAt)}</div>
								<div class="timeline-item-content">
									<span style="color: #6b7280;">{log.operatorName}</span>
									<span style="color: #9ca3af; margin: 0 8px;">·</span>
									<span style="color: #9ca3af;">{getRoleLabel(log.operatorRole)}</span>
									{#if log.remark}
										<p style="margin-top: 8px; color: #374151;">{log.remark}</p>
									{/if}
									{#if log.oldValue && log.newValue}
										<div style="margin-top: 8px; font-size: 13px;">
											<span style="color: #dc2626;">- {log.oldValue}</span>
											<span style="margin: 0 8px;">→</span>
											<span style="color: #16a34a;">+ {log.newValue}</span>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">📋</div>
						暂无操作记录
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	{#if showAdjustModal}
		<div class="modal-overlay" on:click={() => (showAdjustModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="modal-title" style="color: #d97706;">库存调整</h3>
					<button class="modal-close" on:click={() => (showAdjustModal = false)}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">调整数量（正数增加，负数减少）*</label>
						<input class="form-input" type="number" bind:value={adjustQty} placeholder="请输入调整数量" />
					</div>
					<div class="form-group">
						<label class="form-label">调整原因 *</label>
						<textarea class="form-textarea" bind:value={adjustReason} rows={3} placeholder="请输入调整原因" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showAdjustModal = false)}>取消</button>
					<button class="btn btn-warning" on:click={handleAdjust} disabled={actionLoading || adjustQty === 0 || !adjustReason}>
						{#if actionLoading}处理中...{:else}确认调整{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
