<script>
	import { onMount } from 'svelte';
	import { reviewApi, productApi } from '$lib/api';
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

	let completing = false;
	let completeNote = '';
	let showCompleteModal = false;

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

	function getReviewTypeLabel(type) {
		const labels = {
			sales: '销售复盘',
			display: '陈列复盘',
			timing: '时效复盘',
			overall: '全面复盘'
		};
		return labels[type] || type;
	}

	function canCompleteReview() {
		return currentUser && (currentUser.role === 'planner' || currentUser.role === 'manager');
	}

	async function handleCompleteReview() {
		if (!review) return;
		completing = true;
		try {
			await productApi.completeReview(review.productId, completeNote || '复盘完成');
			await loadData();
			showCompleteModal = false;
			completeNote = '';
		} catch (e) {
			alert('完成复盘失败: ' + getErrorMessage(e));
		} finally {
			completing = false;
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
					{getReviewTypeLabel(review.reviewType)}
				</span>
			</div>
			<div class="page-actions">
				{#if canCompleteReview() && review && review.productStatus !== 'reviewed'}
					<button class="btn btn-primary" on:click={() => (showCompleteModal = true)} disabled={completing}>
						✅ 完成复盘
					</button>
				{/if}
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
							<span class="detail-value">{getReviewTypeLabel(review.reviewType)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">复盘人</span>
							<span class="detail-value">{review.reviewedByName}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">复盘时间</span>
							<span class="detail-value">{formatDate(review.reviewedAt)}</span>
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
							<span class="detail-label">时效表现</span>
							<span class="detail-value">{review.timingScore || '-'}/10</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">综合评分</span>
							<span class="detail-value" style="font-weight: 600; color: #2563eb;">{review.overallScore || '-'}/10</span>
						</div>
					</div>
				</div>

				<div class="section">
					<h3 class="section-title">销售数据</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">周期销量</span>
							<span class="detail-value">{review.totalSales || 0} 件</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">周期销售额</span>
							<span class="detail-value">{formatCurrency(review.totalRevenue || 0)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">累计销量</span>
							<span class="detail-value">{review.totalQuantity || 0} 件</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">剩余库存</span>
							<span class="detail-value">{review.inventoryLeft || 0} 件</span>
						</div>
					</div>
				</div>

				{#if review.problems && review.problems.length > 0}
					<div class="section">
						<h3 class="section-title">问题列表</h3>
						<div style="display: flex; flex-direction: column; gap: 12px;">
							{#each review.problems as problem}
								<div style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
									<div style="font-weight: 500; color: #dc2626;">{problem}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if review.lessons && review.lessons.length > 0}
					<div class="section">
						<h3 class="section-title">经验总结</h3>
						<div style="display: flex; flex-direction: column; gap: 12px;">
							{#each review.lessons as lesson}
								<div style="padding: 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px;">
									<div style="font-weight: 500; color: #d97706;">📝 {lesson}</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if review.improvements && review.improvements.length > 0}
					<div class="section">
						<h3 class="section-title">改进建议</h3>
						<div style="display: flex; flex-direction: column; gap: 12px;">
							{#each review.improvements as improvement}
								<div style="padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
									<div style="font-weight: 500; color: #16a34a;">💡 {improvement}</div>
								</div>
							{/each}
						</div>
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

	{#if showCompleteModal}
		<div class="modal-overlay" on:click={() => (showCompleteModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<h3>完成复盘</h3>
				<div class="form-group">
					<label class="form-label">复盘备注</label>
					<textarea class="form-textarea" bind:value={completeNote} rows={3} placeholder="请输入复盘完成备注（可选）"></textarea>
				</div>
				<div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
					<button class="btn btn-secondary" on:click={() => (showCompleteModal = false)}>取消</button>
					<button class="btn btn-primary" on:click={handleCompleteReview} disabled={completing}>
						{#if completing}处理中...{:else}确认完成{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
