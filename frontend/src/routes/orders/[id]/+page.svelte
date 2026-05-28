<script>
	import { onMount } from 'svelte';
	import { orderApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getOrderTypeLabel,
		getOrderStatusLabel,
		getOrderStatusClass,
		getRoleLabel,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let order = null;
	let logs = [];
	let activeTab = 'detail';
	let actionLoading = false;
	let rejectReason = '';
	let showRejectModal = false;

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: orderId = $page.params.id;

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
			const data = await orderApi.get(orderId);
			order = data.order;
			logs = data.logs;
		} catch (e) {
			console.error('Failed to load order detail:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	async function handleApprove() {
		if (!order) return;
		actionLoading = true;
		try {
			order = await orderApi.approve(order.id);
			await loadData();
		} catch (e) {
			alert('审批失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleReject() {
		if (!order || !rejectReason) return;
		actionLoading = true;
		try {
			order = await orderApi.reject(order.id, rejectReason);
			showRejectModal = false;
			rejectReason = '';
			await loadData();
		} catch (e) {
			alert('驳回失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleShip() {
		if (!order) return;
		actionLoading = true;
		try {
			order = await orderApi.ship(order.id);
			await loadData();
		} catch (e) {
			alert('发货失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleReceive() {
		if (!order) return;
		actionLoading = true;
		try {
			order = await orderApi.receive(order.id);
			await loadData();
		} catch (e) {
			alert('签收失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleComplete() {
		if (!order) return;
		actionLoading = true;
		try {
			order = await orderApi.complete(order.id);
			await loadData();
		} catch (e) {
			alert('完成失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	function canApprove() {
		return order && order.status === 'pending' && currentUser && currentUser.role === 'manager';
	}

	function canShip() {
		return order && order.status === 'approved' &&
			currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}

	function canReceive() {
		return order && order.status === 'shipped' &&
			currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}

	function canComplete() {
		return order && order.status === 'received' &&
			currentUser && currentUser.role === 'manager';
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else if order}
		<div class="page-header">
			<div>
				<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/orders')}>
					← 返回
				</button>
				<span style="font-size: 24px; font-weight: 600; font-family: monospace;">{order.orderNo}</span>
				<span class={`badge ${getOrderStatusClass(order.status)}`} style="margin-left: 12px;">
					{getOrderStatusLabel(order.status)}
				</span>
				<span class="badge" style="margin-left: 8px; background: #f3f4f6;">
					{getOrderTypeLabel(order.type)}
				</span>
			</div>
			<div class="page-actions">
				{#if canApprove()}
					<button class="btn btn-success" on:click={handleApprove} disabled={actionLoading}>
						✅ 批准
					</button>
					<button class="btn btn-danger" on:click={() => (showRejectModal = true)} disabled={actionLoading}>
						❌ 驳回
					</button>
				{/if}
				{#if canShip()}
					<button class="btn btn-primary" on:click={handleShip} disabled={actionLoading}>
						📦 发货
					</button>
				{/if}
				{#if canReceive()}
					<button class="btn btn-success" on:click={handleReceive} disabled={actionLoading}>
						✅ 签收
					</button>
				{/if}
				{#if canComplete()}
					<button class="btn btn-primary" on:click={handleComplete} disabled={actionLoading}>
						🎉 完成
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
			</div>
		</div>

		<div class="tabs">
			<button class={activeTab === 'detail' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'detail')}>
				订单详情
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
							<span class="detail-label">订单号</span>
							<span class="detail-value" style="font-family: monospace;">{order.orderNo}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">订单类型</span>
							<span class="detail-value">{getOrderTypeLabel(order.type)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">商品</span>
							<span class="detail-value">{order.productName} ({order.productSku})</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">数量</span>
							<span class="detail-value">{order.quantity}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">目标门店</span>
							<span class="detail-value">{order.toStoreCode} - {order.toStoreCode}</span>
						</div>
						{#if order.fromStoreCode}
							<div class="detail-item">
								<span class="detail-label">来源门店</span>
								<span class="detail-value">{order.fromStoreCode} - {order.fromStoreCode}</span>
							</div>
						{/if}
						<div class="detail-item">
							<span class="detail-label">创建人</span>
							<span class="detail-value">{order.createdByName}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">创建时间</span>
							<span class="detail-value">{formatDate(order.createdAt)}</span>
						</div>
					</div>
					{#if order.remark}
						<div style="margin-top: 16px;">
							<div class="detail-label" style="margin-bottom: 8px;">备注</div>
							<p style="line-height: 1.8; color: #374151;">{order.remark}</p>
						</div>
					{/if}
				</div>

				<div class="section">
					<h3 class="section-title">流转记录</h3>
					<div class="timeline">
						<div class="timeline-item">
							<div class="timeline-item-title">创建订单</div>
							<div class="timeline-item-time">{formatDate(order.createdAt)}</div>
							<div class="timeline-item-content">{order.createdByName} 创建</div>
						</div>
						{#if order.approvedByName}
							<div class="timeline-item">
								<div class="timeline-item-title">审批</div>
								<div class="timeline-item-time">{formatDate(order.updatedAt)}</div>
								<div class="timeline-item-content">{order.approvedByName} {order.status === 'rejected' ? '驳回' : '批准'}</div>
							</div>
						{/if}
						{#if order.shippedAt}
							<div class="timeline-item">
								<div class="timeline-item-title">发货</div>
								<div class="timeline-item-time">{formatDate(order.shippedAt)}</div>
							</div>
						{/if}
						{#if order.receivedAt}
							<div class="timeline-item">
								<div class="timeline-item-title">签收</div>
								<div class="timeline-item-time">{formatDate(order.receivedAt)}</div>
							</div>
						{/if}
					</div>
				</div>

				{#if order.type === 'exchange' && (order.memberName || order.memberPhone)}
					<div class="section">
						<h3 class="section-title">会员信息</h3>
						<div class="detail-grid">
							<div class="detail-item">
								<span class="detail-label">会员姓名</span>
								<span class="detail-value">{order.memberName || '-'}</span>
							</div>
							<div class="detail-item">
								<span class="detail-label">会员手机</span>
								<span class="detail-value">{order.memberPhone || '-'}</span>
							</div>
							{#if order.exchangePoints}
								<div class="detail-item">
									<span class="detail-label">兑换积分</span>
									<span class="detail-value">{order.exchangePoints}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			{#if order.rejectReason}
				<div class="section">
					<h3 class="section-title" style="color: #dc2626;">驳回原因</h3>
					<p style="line-height: 1.8; color: #374151;">{order.rejectReason}</p>
				</div>
			{/if}
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

	{#if showRejectModal}
		<div class="modal-overlay" on:click={() => (showRejectModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="modal-title" style="color: #dc2626;">驳回订单</h3>
					<button class="modal-close" on:click={() => (showRejectModal = false)}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">驳回原因 *</label>
						<textarea class="form-textarea" bind:value={rejectReason} rows={4} placeholder="请输入驳回原因" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showRejectModal = false)}>取消</button>
					<button class="btn btn-danger" on:click={handleReject} disabled={actionLoading || !rejectReason}>
						{#if actionLoading}处理中...{:else}确认驳回{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
