<script>
	import { onMount } from 'svelte';
	import { productApi, storeApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import ProductCreateModal from '$lib/components/ProductCreateModal.svelte';
	import {
		formatDateShort,
		formatCurrency,
		getProductStatusLabel,
		getProductStatusClass,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let products = [];
	let stores = [];
	let filterStatus = '';
	let filterCategory = '';
	let createModalOpen = false;

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: urlStatus = $page.url.searchParams.get('status') || '';

	onMount(() => {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}
		if (urlStatus) {
			filterStatus = urlStatus;
		}
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [productsData, storesData] = await Promise.all([
				productApi.list({ status: filterStatus || undefined, category: filterCategory || undefined }),
				storeApi.list()
			]);
			products = productsData;
			stores = storesData;
		} catch (e) {
			console.error('Failed to load products:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	$: if (filterStatus || filterCategory) {
		loadData();
	}

	function viewProduct(id) {
		goto(`/products/${id}`);
	}

	function canCreate() {
		return currentUser && (currentUser.role === 'planner' || currentUser.role === 'manager');
	}

	function getStoreName(storeId) {
		const store = stores.find(s => s.id === storeId);
		return store ? store.name : storeId;
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">联名商品</h1>
		<div class="page-actions">
			{#if canCreate()}
				<button class="btn btn-primary" on:click={() => (createModalOpen = true)}>
					➕ 新建联名品
				</button>
			{/if}
		</div>
	</div>

	<div class="filter-bar">
		<select bind:value={filterStatus}>
			<option value="">全部状态</option>
			<option value="draft">草稿</option>
			<option value="pending">待审批</option>
			<option value="approved">已通过</option>
			<option value="on_shelf">已上架</option>
			<option value="off_shelf">已下架</option>
			<option value="rejected">已驳回</option>
			<option value="reviewing">复盘中</option>
			<option value="reviewed">已复盘</option>
		</select>
		<select bind:value={filterCategory}>
			<option value="">全部分类</option>
			<option value="文具">文具</option>
			<option value="配饰">配饰</option>
			<option value="家居">家居</option>
			<option value="食品">食品</option>
			<option value="数码">数码</option>
		</select>
		<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else}
		{#if products.length > 0}
			<div class="product-grid">
				{#each products as product}
					<div class="product-card" on:click={() => viewProduct(product.id)}>
						<div class="product-card-image">🎁</div>
						<div class="product-card-body">
							<div class="product-card-title">{product.name}</div>
							<div class="product-card-sku">{product.sku} · {product.brandPartner}</div>
							<div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;">
								<span class={`badge ${getProductStatusClass(product.status)}`}>
									{getProductStatusLabel(product.status)}
								</span>
								<span class="tag">{product.category}</span>
							</div>
							<div class="product-card-meta">
								<div>
									<div style="font-size: 12px; color: #6b7280;">零售价</div>
									<div class="product-card-price">{formatCurrency(product.retailPrice)}</div>
								</div>
								<div style="text-align: right;">
									<div style="font-size: 12px; color: #6b7280;">计划上架</div>
									<div style="font-size: 14px;">{formatDateShort(product.planOnShelfDate)}</div>
								</div>
							</div>
							<div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
								<span style="font-weight: 500;">覆盖门店:</span> {product.targetStores.slice(0, 2).map(id => getStoreName(id)).join('、')}
								{#if product.targetStores.length > 2}
									等{product.targetStores.length}家
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">🎁</div>
				暂无联名商品数据
			</div>
		{/if}
	{/if}

	{#if createModalOpen}
		<ProductCreateModal
			bind:open={createModalOpen}
			{stores}
			on:created={() => {
				createModalOpen = false;
				loadData();
			}}
		/>
	{/if}
</AppLayout>
