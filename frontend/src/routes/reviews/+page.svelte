<script>
	import { onMount } from 'svelte';
	import { reviewApi, productApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		formatCurrency,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let reviews = [];
	let products = [];
	let filterProduct = '';
	let filterType = '';

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
			const [reviewsData, productsData] = await Promise.all([
				reviewApi.list({
					productId: filterProduct || undefined,
					reviewType: filterType || undefined
				}),
				productApi.list()
			]);
			reviews = reviewsData;
			products = productsData;
		} catch (e) {
			console.error('Failed to load reviews:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	$: if (filterProduct || filterType) {
		loadData();
	}

	function canCreate() {
		return currentUser && (currentUser.role === 'planner' || currentUser.role === 'manager');
	}

	function getProductName(productId) {
		const product = products.find(p => p.id === productId);
		return product ? product.name : productId;
	}

	function getScoreColor(score) {
		if (score >= 8) return '#16a34a';
		if (score >= 6) return '#d97706';
		return '#dc2626';
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
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">复盘管理</h1>
		<div class="page-actions">
			{#if canCreate()}
				<button class="btn btn-primary" on:click={() => goto('/reviews/new')}>
					📊 新建复盘
				</button>
			{/if}
		</div>
	</div>

	<div class="filter-bar">
		<select bind:value={filterProduct}>
			<option value="">全部商品</option>
			{#each products.filter(p => p.status === 'off_shelf' || p.status === 'reviewing') as p}
				<option value={p.id}>{p.name} ({p.sku})</option>
			{/each}
		</select>
		<select bind:value={filterType}>
			<option value="">全部类型</option>
			<option value="sales">销售复盘</option>
			<option value="display">陈列复盘</option>
			<option value="timing">时效复盘</option>
			<option value="overall">全面复盘</option>
		</select>
		<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else}
		{#if reviews.length > 0}
			<div style="overflow-x: auto;">
				<table class="table">
					<thead>
						<tr>
							<th>商品</th>
							<th>复盘类型</th>
							<th>总销量</th>
							<th>总销售额</th>
							<th>剩余库存</th>
							<th>综合评分</th>
							<th>问题</th>
							<th>复盘人</th>
							<th>复盘时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each reviews as review}
							<tr>
								<td>
									<div style="font-weight: 500;">{getProductName(review.productId)}</div>
									<div style="font-size: 12px; color: #6b7280;">{review.productSku}</div>
								</td>
								<td><span class="badge">{getReviewTypeLabel(review.reviewType)}</span></td>
								<td>{review.totalQuantity}</td>
								<td>{formatCurrency(review.totalRevenue)}</td>
								<td>{review.inventoryLeft}</td>
								<td style="font-weight: 600; color: {getScoreColor(review.overallScore)};">
									{review.overallScore}
								</td>
								<td>
									{#if review.problems.length > 0}
										<div style="max-width: 200px;">
											{#each review.problems.slice(0, 2) as problem}
												<span class="tag" style="background: #fef2f2; color: #dc2626;">{problem}</span>
											{/each}
											{#if review.problems.length > 2}
												<span class="tag">+{review.problems.length - 2}</span>
											{/if}
										</div>
									{:else}
										-
									{/if}
								</td>
								<td>{review.reviewedByName}</td>
								<td>{formatDate(review.reviewedAt)}</td>
								<td>
									<button class="btn btn-sm btn-secondary" on:click={() => goto(`/reviews/${review.id}`)}>
										查看
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">📊</div>
				暂无复盘记录
			</div>
		{/if}
	{/if}
</AppLayout>
