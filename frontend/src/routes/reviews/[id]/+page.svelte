<script>
	import { onMount } from 'svelte';
	import { reviewApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getRoleLabel,
		getErrorMessage,
		isAuthError,
		formatCurrency
	} from '$lib/utils';

	let loading = true;
	let review = null;
	let logs = [];
	let activeTab = 'detail';

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: reviewId = $page.params.id;

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
			const data = await reviewApi.get(reviewId);
			review = data.review;
			logs = data.logs;
		} catch (e) {
			console.error('Failed to load review detail:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else if review}
		<div class="page-header">
			<div>
				<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/reviews')}>
					← 返回
				</button>
				<span style="font-size: 24px; font-weight: 600;">复盘详情</span>
				<span class="badge" style="margin-left: 12px; background: #f3f4f6;">
					{review.reviewType === 'weekly' ? '周复盘' : review.reviewType === 'monthly' ? '月复盘' : '复盘'}
				</span>
			</div>
			<div class="page-actions">
				<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
			</div>
		</div>

		<div class="tabs">
			<button class={activeTab === 'detail' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'detail')}>
				复盘详情
			</button>
			<button class={activeTab === 'logs' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'logs')}>
				操作留痕 ({logs.length})
			</button>
		</div>

		{#if activeTab === 'detail'}
			<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
				<div class="section">
					<h3 class="section-title">复盘摘要</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">商品</span>
							<span class="detail-value">{review.productName} ({review.productSku})</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">复盘类型</span>
							<span class="detail-value">{review.reviewType === 'weekly' ? '周复盘' : review.reviewType === 'monthly' ? '月复盘' : review.reviewType}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">复盘人</span>
							<span class="detail-value">{review.createdByName}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">复盘时间</span>
							<span class="detail-value">{formatDate(review.createdAt)}</span>
						</div>
					</div>
				</div>

				<div class="section">
					<h3 class="section-title">各项评分</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">销售表现</span>
							<span class="detail-value">{review.salesScore || '-'}/10</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">陈列效果</span>
							<span class="detail-value">{review.displayScore || '-'}/10</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">库存管理</span>
							<span class="detail-value">{review.inventoryScore || '-'}/10</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">综合评分</span>
							<span class="detail-value" style="font-weight: 600; color: #2563eb;">{review.overallScore || '-'}/10</span>
						</div>
					</div>
				</div>

				{#if review.issues && review.issues.length > 0}
					<div class="section">
						<h3 class="section-title">问题列表</h3>
						<div style="display: flex; flex-direction: column; gap: 12px;">
							{#each review.issues as issue}
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

				{#if review.suggestions && review.suggestions.length > 0}
					<div class="section">
						<h3 class="section-title">改进建议</h3>
						<div style="display: flex; flex-direction: column; gap: 12px;">
							{#each review.suggestions as suggestion}
								<div style="padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
									<div style="font-weight: 500; color: #16a34a;">💡 {suggestion.title}</div>
									{#if suggestion.description}
										<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">{suggestion.description}</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="section">
					<h3 class="section-title">销售数据</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">周期销量</span>
							<span class="detail-value">{review.periodSalesQty || 0} 件</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">周期销售额</span>
							<span class="detail-value">{formatCurrency(review.periodSalesAmount || 0)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">累计销量</span>
							<span class="detail-value">{review.totalSalesQty || 0} 件</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">累计销售额</span>
							<span class="detail-value">{formatCurrency(review.totalSalesAmount || 0)}</span>
						</div>
					</div>
				</div>

				{#if review.summary}
					<div class="section">
						<h3 class="section-title">复盘总结</h3>
						<p style="line-height: 1.8; color: #374151;">{review.summary}</p>
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
</AppLayout>
