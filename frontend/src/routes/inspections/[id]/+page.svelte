<script>
	import { onMount } from 'svelte';
	import { inspectionApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getInspectionStatusLabel,
		getInspectionStatusClass,
		getRoleLabel,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let inspection = null;
	let logs = [];
	let activeTab = 'detail';
	let actionLoading = false;
	let followUpNote = '';
	let closingNote = '';
	let showFollowUpModal = false;
	let showCloseModal = false;

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: inspectionId = $page.params.id;

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
			const data = await inspectionApi.get(inspectionId);
			inspection = data.inspection;
			logs = data.logs;
		} catch (e) {
			console.error('Failed to load inspection detail:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	async function handleFollowUp() {
		if (!inspection || !followUpNote) return;
		actionLoading = true;
		try {
			await inspectionApi.followUp(inspection.id, followUpNote, currentUser?.id || '');
			showFollowUpModal = false;
			followUpNote = '';
			await loadData();
		} catch (e) {
			alert('跟进失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleClose() {
		if (!inspection) return;
		actionLoading = true;
		try {
			await inspectionApi.close(inspection.id, closingNote);
			showCloseModal = false;
			closingNote = '';
			await loadData();
		} catch (e) {
			alert('关闭失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	function canFollowUp() {
		return inspection && inspection.status === 'exception' && currentUser;
	}

	function canClose() {
		return inspection && (inspection.status === 'pending' || inspection.status === 'exception') &&
			currentUser && currentUser.role === 'manager';
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else if inspection}
		<div class="page-header">
			<div>
				<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/inspections')}>
					← 返回
				</button>
				<span style="font-size: 24px; font-weight: 600;">巡店检查详情</span>
				<span class={`badge ${getInspectionStatusClass(inspection.status)}`} style="margin-left: 12px;">
					{getInspectionStatusLabel(inspection.status)}
				</span>
			</div>
			<div class="page-actions">
				{#if canFollowUp()}
					<button class="btn btn-primary" on:click={() => (showFollowUpModal = true)} disabled={actionLoading}>
						📝 跟进
					</button>
				{/if}
				{#if canClose()}
					<button class="btn btn-secondary" on:click={() => (showCloseModal = true)} disabled={actionLoading}>
						✅ 关闭
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
			</div>
		</div>

		<div class="tabs">
			<button class={activeTab === 'detail' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'detail')}>
				检查详情
			</button>
			<button class={activeTab === 'logs' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'logs')}>
				操作留痕 ({logs.length})
			</button>
		</div>

		{#if activeTab === 'detail'}
			<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
				<div class="section">
					<h3 class="section-title">基本信息</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">商品</span>
							<span class="detail-value">{inspection.productName} ({inspection.productSku})</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">门店</span>
							<span class="detail-value">{inspection.storeCode} - {inspection.storeName}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">检查人</span>
							<span class="detail-value">{inspection.createdByName}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">检查时间</span>
							<span class="detail-value">{formatDate(inspection.createdAt)}</span>
						</div>
					</div>
				</div>

				<div class="section">
					<h3 class="section-title">陈列检查</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">陈列是否正确</span>
							<span class="detail-value">{inspection.displayCorrect ? '✅ 是' : '❌ 否'}</span>
						</div>
						{#if inspection.displayPosition}
							<div class="detail-item">
								<span class="detail-label">陈列位置</span>
								<span class="detail-value">{inspection.displayPosition}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="section">
					<h3 class="section-title">库存检查</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">预期库存</span>
							<span class="detail-value">{inspection.expectedQty}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">实际库存</span>
							<span class="detail-value">{inspection.actualQty}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">偏差数量</span>
							<span class="detail-value" style="color: {inspection.deviationQty !== 0 ? '#dc2626' : '#16a34a'}; font-weight: 600;">
								{inspection.deviationQty > 0 ? '+' : ''}{inspection.deviationQty}
							</span>
						</div>
					</div>
				</div>

				{#if inspection.issues && inspection.issues.length > 0}
					<div class="section">
						<h3 class="section-title">问题列表</h3>
						<div style="display: flex; flex-direction: column; gap: 12px;">
							{#each inspection.issues as issue}
								<div style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
									<div style="font-weight: 500; color: #dc2626;">{issue.title}</div>
									{#if issue.description}
										<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">{issue.description}</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if inspection.remark}
					<div class="section">
						<h3 class="section-title">备注</h3>
						<p style="line-height: 1.8; color: #374151;">{inspection.remark}</p>
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

	{#if showFollowUpModal}
		<div class="modal-overlay" on:click={() => (showFollowUpModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="modal-title">跟进检查</h3>
					<button class="modal-close" on:click={() => (showFollowUpModal = false)}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">跟进说明 *</label>
						<textarea class="form-textarea" bind:value={followUpNote} rows={4} placeholder="请输入跟进说明" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showFollowUpModal = false)}>取消</button>
					<button class="btn btn-primary" on:click={handleFollowUp} disabled={actionLoading || !followUpNote}>
						{#if actionLoading}处理中...{:else}确认跟进{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showCloseModal}
		<div class="modal-overlay" on:click={() => (showCloseModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="modal-title">关闭检查</h3>
					<button class="modal-close" on:click={() => (showCloseModal = false)}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">关闭备注</label>
						<textarea class="form-textarea" bind:value={closingNote} rows={4} placeholder="请输入关闭备注（可选）" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showCloseModal = false)}>取消</button>
					<button class="btn btn-primary" on:click={handleClose} disabled={actionLoading}>
						{#if actionLoading}处理中...{:else}确认关闭{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
