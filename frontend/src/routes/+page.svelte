<script>
	import { onMount } from 'svelte';
	import { dashboardApi, exceptionApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getProductStatusLabel,
		getProductStatusClass,
		getOrderTypeLabel,
		getExceptionTypeLabel,
		getExceptionStatusClass,
		getSeverityLabel,
		getSeverityClass,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let dashboardData = null;
	let openExceptions = [];

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;

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
			const [data, exceptions] = await Promise.all([
				dashboardApi.getData(),
				exceptionApi.list({ status: 'open' })
			]);
			dashboardData = data;
			openExceptions = exceptions;
		} catch (e) {
			console.error('Failed to load dashboard:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	function openException(id) {
		selectedExceptionId = id;
		exceptionDrawerOpen = true;
	}

	function getTypeIcon(type) {
		const icons = {
			product: '🎁',
			order: '📋',
			inspection: '🔍',
			exception: '⚠️'
		};
		return icons[type] || '📄';
	}

	function navigateTo(path) {
		goto(path);
	}

	function getItemPath(item) {
		switch (item.type) {
			case 'product':
				return `/products/${item.id}`;
			case 'order':
				return `/orders/${item.id}`;
			case 'inspection':
				return `/inspections/${item.id}`;
			case 'exception':
				return `/exceptions`;
			default:
				return '/';
		}
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">工作台</h1>
		<div class="page-actions">
			<button class="btn btn-secondary" on:click={loadData}>
				🔄 刷新
			</button>
		</div>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else if dashboardData}
		<div class="stats-grid">
			<div class="stat-card" on:click={() => navigateTo('/products?status=pending')} style="cursor: pointer;">
				<div class="stat-card-title">待审批</div>
				<div class="stat-card-value warning">{dashboardData.stats.pendingApproval}</div>
			</div>
			<div class="stat-card" on:click={() => navigateTo('/exceptions?status=open')} style="cursor: pointer;">
				<div class="stat-card-title">待处理异常</div>
				<div class="stat-card-value danger">{dashboardData.stats.openExceptions}</div>
			</div>
			<div class="stat-card" on:click={() => navigateTo('/exceptions?needReview=true')} style="cursor: pointer;">
				<div class="stat-card-title">需复核</div>
				<div class="stat-card-value warning">{dashboardData.stats.needReview}</div>
			</div>
			<div class="stat-card">
				<div class="stat-card-title">已驳回</div>
				<div class="stat-card-value">{dashboardData.stats.rejectedItems}</div>
			</div>
			<div class="stat-card" on:click={() => navigateTo('/inspections?status=pending')} style="cursor: pointer;">
				<div class="stat-card-title">待巡店</div>
				<div class="stat-card-value warning">{dashboardData.stats.pendingInspection}</div>
			</div>
			<div class="stat-card" on:click={() => navigateTo('/products?status=on_shelf')} style="cursor: pointer;">
				<div class="stat-card-title">在售联名品</div>
				<div class="stat-card-value success">{dashboardData.stats.onShelfProducts}</div>
			</div>
		</div>

		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
			<div class="section">
				<h3 class="section-title">
					待处理事项
					<span class="badge badge-pending" style="margin-left: 8px;">{dashboardData.pendingItems.length}</span>
				</h3>
				{#if dashboardData.pendingItems.length > 0}
					{#each dashboardData.pendingItems as item}
						<div class="list-item" on:click={() => navigateTo(getItemPath(item))} style="cursor: pointer;">
							<div class="list-item-main">
								<div class="list-item-title">
									<span style="margin-right: 8px;">{getTypeIcon(item.type)}</span>
									{item.title}
								</div>
								<div class="list-item-meta">
									{item.description} · {item.createdBy} · {formatDate(item.createdAt)}
								</div>
							</div>
							<span class={`badge ${getProductStatusClass(item.status)}`}>
								{getProductStatusLabel(item.status)}
							</span>
						</div>
					{/each}
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">✅</div>
						暂无待处理事项
					</div>
				{/if}
			</div>

			<div class="section">
				<h3 class="section-title">
					已驳回
					<span class="badge status-rejected" style="margin-left: 8px;">{dashboardData.rejectedItems.length}</span>
				</h3>
				{#if dashboardData.rejectedItems.length > 0}
					{#each dashboardData.rejectedItems as item}
						<div class="list-item" on:click={() => navigateTo(getItemPath(item))} style="cursor: pointer;">
							<div class="list-item-main">
								<div class="list-item-title">
									<span style="margin-right: 8px;">{getTypeIcon(item.type)}</span>
									{item.title}
								</div>
								<div class="list-item-meta">
									{item.description} · {item.createdBy} · {formatDate(item.createdAt)}
								</div>
							</div>
							<span class="badge status-rejected">已驳回</span>
						</div>
					{/each}
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">🎉</div>
						暂无驳回记录
					</div>
				{/if}
			</div>
		</div>

		<div class="section">
			<h3 class="section-title">
				需回查
				<span class="badge status-reviewing" style="margin-left: 8px;">{dashboardData.needReviewItems.length}</span>
			</h3>
			{#if dashboardData.needReviewItems.length > 0}
				{#each dashboardData.needReviewItems as item}
					<div class="list-item" on:click={() => navigateTo(getItemPath(item))} style="cursor: pointer;">
						<div class="list-item-main">
							<div class="list-item-title">
								<span style="margin-right: 8px;">{getTypeIcon(item.type)}</span>
								{item.title}
							</div>
							<div class="list-item-meta">
								{item.description} · {item.createdBy} · {formatDate(item.createdAt)}
							</div>
						</div>
						<span class="badge status-reviewing">需回查</span>
					</div>
				{/each}
			{:else}
				<div class="empty-state">
					<div class="empty-state-icon">📋</div>
					暂无需回查事项
				</div>
			{/if}
		</div>

		<div class="section">
			<h3 class="section-title">
				异常预警
				<span class="badge status-open" style="margin-left: 8px;">{openExceptions.length}</span>
			</h3>
			{#if openExceptions.length > 0}
				<div style="overflow-x: auto;">
					<table class="table">
						<thead>
							<tr>
								<th>类型</th>
								<th>标题</th>
								<th>严重程度</th>
								<th>关联信息</th>
								<th>上报人</th>
								<th>上报时间</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each openExceptions as exc}
								<tr>
									<td>
										<span class="badge">{getExceptionTypeLabel(exc.type)}</span>
									</td>
									<td>{exc.title}</td>
									<td>
										<span class={`badge ${getSeverityClass(exc.severity)}`}>
											{getSeverityLabel(exc.severity)}
										</span>
									</td>
									<td>
										{#if exc.storeName}
											<div style="font-size: 13px;">{exc.storeCode} - {exc.storeName}</div>
										{/if}
										{#if exc.productName}
											<div style="font-size: 12px; color: #6b7280;">{exc.productSku} - {exc.productName}</div>
										{/if}
									</td>
									<td>{exc.reportedByName}</td>
									<td>{formatDate(exc.createdAt)}</td>
									<td>
										<button class="btn btn-sm btn-primary" on:click={() => openException(exc.id)}>
											处理
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="empty-state">
					<div class="empty-state-icon">✅</div>
					暂无异常
				</div>
			{/if}
		</div>
	{/if}
</AppLayout>
