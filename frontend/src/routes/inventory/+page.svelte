<script>
	import { onMount } from 'svelte';
	import { inventoryApi, storeApi, productApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { formatDateShort, getErrorMessage, isAuthError } from '$lib/utils';

	let loading = true;
	let inventory = [];
	let stores = [];
	let products = [];
	let filterProduct = '';
	let filterStore = '';

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
			const [invData, storesData, productsData] = await Promise.all([
				inventoryApi.list({
					productId: filterProduct || undefined,
					storeCode: filterStore || undefined
				}),
				storeApi.list(),
				productApi.list()
			]);
			inventory = invData;
			stores = storesData;
			products = productsData;
		} catch (e) {
			console.error('Failed to load inventory:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	$: if (filterProduct || filterStore) {
		loadData();
	}

	function getStoreName(storeId) {
		const store = stores.find(s => s.id === storeId);
		return store ? store.name : storeId;
	}

	function getProductName(productId) {
		const product = products.find(p => p.id === productId);
		return product ? product.name : productId;
	}

	function canStockCount() {
		return currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">库存管理</h1>
	</div>

	<div class="filter-bar">
		<select bind:value={filterProduct}>
			<option value="">全部商品</option>
			{#each products as p}
				<option value={p.id}>{p.name} ({p.sku})</option>
			{/each}
		</select>
		<select bind:value={filterStore}>
			<option value="">全部门店</option>
			{#each stores as s}
				<option value={s.code}>{s.code} - {s.name}</option>
			{/each}
		</select>
		<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else}
		{#if inventory.length > 0}
			<div style="overflow-x: auto;">
				<table class="table">
					<thead>
						<tr>
							<th>商品</th>
							<th>门店</th>
							<th>总库存</th>
							<th>预留</th>
							<th>可用</th>
							<th>上次盘点</th>
							<th>上次盘点数</th>
							<th>偏差</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each inventory as inv}
							<tr>
								<td>
									<div style="font-weight: 500;">{getProductName(inv.productId)}</div>
								</td>
								<td>{inv.storeCode} - {getStoreName(inv.storeId)}</td>
								<td>{inv.quantity}</td>
								<td>{inv.reservedQty}</td>
								<td style="font-weight: 600; color: {inv.availableQty > 0 ? '#16a34a' : '#dc2626'};">{inv.availableQty}</td>
								<td>{inv.lastCountDate ? formatDateShort(inv.lastCountDate) : '-'}</td>
								<td>{inv.lastCountQty}</td>
								<td style="color: {inv.deviationQty !== 0 ? '#dc2626' : '#16a34a'}; font-weight: 600;">
									{inv.deviationQty > 0 ? '+' : ''}{inv.deviationQty}
								</td>
								<td>
									{#if canStockCount()}
										<button class="btn btn-sm btn-primary" on:click={() => goto(`/inventory/${inv.id}`)}>
											盘点
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">📦</div>
				暂无库存数据
			</div>
		{/if}
	{/if}
</AppLayout>
