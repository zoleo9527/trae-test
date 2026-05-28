<script>
	import { onMount } from 'svelte';
	import { orderApi, storeApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getOrderTypeLabel,
		getOrderStatusLabel,
		getOrderStatusClass,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let orders = [];
	let stores = [];
	let filterType = '';
	let filterStatus = '';
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
			const [ordersData, storesData] = await Promise.all([
				orderApi.list({
					type: filterType || undefined,
					status: filterStatus || undefined,
					storeCode: filterStore || undefined
				}),
				storeApi.list()
			]);
			orders = ordersData;
			stores = storesData;
		} catch (e) {
			console.error('Failed to load orders:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	$: if (filterType || filterStatus || filterStore) {
		loadData();
	}

	function canCreate() {
		return currentUser && currentUser.role !== 'planner';
	}

	function getStoreName(storeId) {
		const store = stores.find(s => s.id === storeId);
		return store ? store.name : storeId;
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">订单管理</h1>
		<div class="page-actions">
			{#if canCreate()}
				<div style="display: flex; gap: 8px;">
					<button class="btn btn-primary" on:click={() => goto('/orders/new?type=restock')}>
						➕ 补货单
					</button>
					<button class="btn btn-secondary" on:click={() => goto('/orders/new?type=transfer')}>
						🔄 调拨单
					</button>
					<button class="btn btn-success" on:click={() => goto('/orders/new?type=exchange')}>
						🎁 会员兑换
					</button>
				</div>
			{/if}
		</div>
	</div>

	<div class="filter-bar">
		<select bind:value={filterType}>
			<option value="">全部类型</option>
			<option value="restock">补货单</option>
			<option value="transfer">调拨单</option>
			<option value="exchange">会员兑换</option>
		</select>
		<select bind:value={filterStatus}>
			<option value="">全部状态</option>
			<option value="draft">草稿</option>
			<option value="pending">待审批</option>
			<option value="approved">已批准</option>
			<option value="shipped">已发货</option>
			<option value="received">已签收</option>
			<option value="rejected">已驳回</option>
			<option value="completed">已完成</option>
		</select>
		<select bind:value={filterStore}>
			<option value="">全部门店</option>
			{#each stores as store}
				<option value={store.code}>{store.code} - {store.name}</option>
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
		{#if orders.length > 0}
			<div style="overflow-x: auto;">
				<table class="table">
					<thead>
						<tr>
							<th>订单号</th>
							<th>类型</th>
							<th>商品</th>
							<th>数量</th>
							<th>门店</th>
							<th>状态</th>
							<th>创建人</th>
							<th>创建时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each orders as order}
							<tr>
								<td style="font-family: monospace;">{order.orderNo}</td>
								<td><span class="badge">{getOrderTypeLabel(order.type)}</span></td>
								<td>
									<div style="font-weight: 500;">{order.productName}</div>
									<div style="font-size: 12px; color: #6b7280;">{order.productSku}</div>
								</td>
								<td>{order.quantity}</td>
								<td>
									{#if order.fromStoreCode}
										<div style="font-size: 12px; color: #6b7280;">{order.fromStoreCode} →</div>
									{/if}
									<div>{order.toStoreCode} - {getStoreName(order.toStoreId)}</div>
								</td>
								<td><span class={`badge ${getOrderStatusClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span></td>
								<td>{order.createdByName}</td>
								<td>{formatDate(order.createdAt)}</td>
								<td>
									<button class="btn btn-sm btn-secondary" on:click={() => goto(`/orders/${order.id}`)}>
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
				<div class="empty-state-icon">📋</div>
				暂无订单数据
			</div>
		{/if}
	{/if}
</AppLayout>
