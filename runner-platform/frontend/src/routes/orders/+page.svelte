<script lang="ts">
	import { onMount } from 'svelte';
	import { api, statusMap } from '$lib/api';
	import { user, rolePermissions } from '$lib/stores/auth';

	let orders = [];
	let selectedOrder = null;
	let timeline = [];
	let filterStatus = '';
	let loading = false;
	let showAssignModal = false;
	let showCreateModal = false;
	let runners = [];
	let selectedRunner = 0;
	let actionError = '';

	$: permissions = $user ? rolePermissions[$user.role] : null;
	$: visibleStatusOptions = permissions ? permissions.visibleStatuses : [];
	$: canAppealStatuses = permissions ? permissions.canAppealStatuses : [];

	async function loadOrders() {
		loading = true;
		actionError = '';
		try {
			orders = await api.getOrders(filterStatus || undefined);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function selectOrder(order) {
		selectedOrder = order;
		actionError = '';
		try {
			timeline = await api.getTimeline(order.id);
		} catch (e) {
			timeline = [];
		}
	}

	async function loadRunners() {
		runners = await api.getRunners();
	}

	async function handleAssign() {
		if (!selectedOrder || !selectedRunner) return;
		actionError = '';
		try {
			await api.assignOrder(selectedOrder.id, selectedRunner);
			showAssignModal = false;
			selectedRunner = 0;
			await loadOrders();
			if (selectedOrder) {
				selectOrder(orders.find(o => o.id === selectedOrder.id));
			}
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		}
	}

	async function handlePickup() {
		if (!selectedOrder) return;
		actionError = '';
		try {
			await api.pickupOrder(selectedOrder.id);
			await loadOrders();
			selectOrder(orders.find(o => o.id === selectedOrder.id));
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		}
	}

	async function handleDeliver() {
		if (!selectedOrder) return;
		actionError = '';
		try {
			await api.deliverOrder(selectedOrder.id);
			await loadOrders();
			selectOrder(orders.find(o => o.id === selectedOrder.id));
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		}
	}

	async function handleMarkTimeout() {
		if (!selectedOrder) return;
		actionError = '';
		try {
			await api.updateOrderStatus(selectedOrder.id, 'timeout');
			await loadOrders();
			selectOrder(orders.find(o => o.id === selectedOrder.id));
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		}
	}

	async function handleCancelOrder() {
		if (!selectedOrder) return;
		actionError = '';
		try {
			await api.updateOrderStatus(selectedOrder.id, 'cancelled');
			await loadOrders();
			selectOrder(orders.find(o => o.id === selectedOrder.id));
		} catch (e) {
			actionError = e instanceof Error ? e.message : String(e);
		}
	}

	let newOrder = {
		customer_name: '',
		customer_phone: '',
		merchant_name: '',
		pickup_address: '',
		delivery_address: '',
		goods_amount: 0,
		delivery_fee: 0,
		distance: 0
	};

	async function handleCreateOrder() {
		await api.createOrder(newOrder);
		showCreateModal = false;
		newOrder = {
			customer_name: '',
			customer_phone: '',
			merchant_name: '',
			pickup_address: '',
			delivery_address: '',
			goods_amount: 0,
			delivery_fee: 0,
			distance: 0
		};
		await loadOrders();
	}

	onMount(() => {
		loadOrders();
		loadRunners();
	});

	$: filterStatus, loadOrders();
</script>

<div class="flex h-[calc(100vh-73px)]">
	<div class="w-1/2 border-r border-gray-200 flex flex-col bg-white">
		<div class="p-4 border-b border-gray-200 flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<h2 class="text-lg font-semibold">
					{#if $user?.role === 'runner'}
						我的订单
					{:else if $user?.role === 'customer_service'}
						异常订单
					{:else}
						订单列表
					{/if}
				</h2>
				<select
					bind:value={filterStatus}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm"
				>
					<option value="">全部状态</option>
					{#each visibleStatusOptions as key}
						<option value={key}>{statusMap[key]?.label || key}</option>
					{/each}
				</select>
			</div>
			{#if permissions?.canCreateOrder}
				<button
					on:click={() => showCreateModal = true}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
				>
					+ 新建订单
				</button>
			{/if}
		</div>

		<div class="flex-1 overflow-auto">
			{#if loading}
				<div class="flex items-center justify-center h-full text-gray-500">加载中...</div>
			{:else if orders.length === 0}
				<div class="flex items-center justify-center h-full text-gray-500">暂无订单</div>
			{:else}
				{#each orders as order}
					<div
						class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
						class:bg-blue-50={selectedOrder?.id === order.id}
						on:click={() => selectOrder(order)}
					>
						<div class="flex items-center justify-between mb-2">
							<span class="font-mono text-sm text-gray-600">{order.order_no}</span>
							<span class="px-2 py-1 text-xs rounded-full {statusMap[order.status].bg} {statusMap[order.status].color}">
								{statusMap[order.status].label}
							</span>
						</div>
						<div class="text-sm font-medium text-gray-900 mb-1">{order.merchant_name}</div>
						<div class="text-sm text-gray-500 mb-2">→ {order.delivery_address}</div>
						<div class="flex items-center justify-between text-xs text-gray-500">
							<span>配送费 ¥{order.delivery_fee.toFixed(2)}</span>
							{#if order.runner}
								<span class="flex items-center">
									<span class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-1 text-xs">
										{order.runner.name[0]}
									</span>
									{order.runner.name}
								</span>
							{/if}
						</div>
						{#if order.appeal}
							<div class="mt-2 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
								⚡ 申诉中: {order.appeal.reason.substring(0, 20)}...
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="w-1/2 flex flex-col bg-gray-50">
		{#if !selectedOrder}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				选择左侧订单查看详情
			</div>
		{:else}
			<div class="p-6 border-b border-gray-200 bg-white">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h3 class="text-xl font-bold">{selectedOrder.order_no}</h3>
						<span class="px-3 py-1 text-sm rounded-full {statusMap[selectedOrder.status].bg} {statusMap[selectedOrder.status].color}">
							{statusMap[selectedOrder.status].label}
						</span>
					</div>
					<div class="flex space-x-2">
						{#if permissions?.canAssignOrder && selectedOrder.status === 'pending'}
							<button
								on:click={() => showAssignModal = true}
								class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
							>
								分配骑手
							</button>
						{/if}
						{#if permissions?.canPickupOrder && selectedOrder.status === 'assigned'}
							<button
								on:click={handlePickup}
								class="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
							>
								确认取餐
							</button>
						{/if}
						{#if permissions?.canDeliverOrder && selectedOrder.status === 'delivering'}
							<button
								on:click={handleDeliver}
								class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
							>
								确认送达
							</button>
						{/if}
						{#if permissions?.canMarkTimeout && selectedOrder.status === 'delivering'}
							<button
								on:click={handleMarkTimeout}
								class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
							>
								标记超时
							</button>
						{/if}
						{#if permissions?.canCancelOrder && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'resolved'}
							<button
								on:click={handleCancelOrder}
								class="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
							>
								取消订单
							</button>
						{/if}
						{#if ($user?.role === 'runner' || $user?.role === 'customer_service') && 
							canAppealStatuses.includes(selectedOrder.status) && !selectedOrder.appeal}
							<a
								href="/appeals/new?order_id={selectedOrder.id}"
								class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
							>
								提交申诉
							</a>
						{/if}
					</div>
				</div>
				{#if actionError}
					<div class="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
						{actionError}
					</div>
				{/if}
			</div>

			<div class="flex-1 overflow-auto p-6 space-y-6">
				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">配送信息</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<div class="text-gray-500 mb-1">商家</div>
							<div class="font-medium">{selectedOrder.merchant_name}</div>
							<div class="text-gray-500 mt-1">{selectedOrder.pickup_address}</div>
						</div>
						<div>
							<div class="text-gray-500 mb-1">收货</div>
							<div class="font-medium">{selectedOrder.customer_name}</div>
							<div class="text-gray-500 mt-1">{selectedOrder.delivery_address}</div>
							<div class="text-gray-500">{selectedOrder.customer_phone}</div>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">费用信息</h4>
					<div class="grid grid-cols-3 gap-4 text-sm">
						<div>
							<div class="text-gray-500 mb-1">商品金额</div>
							<div class="font-medium text-lg">¥{selectedOrder.goods_amount.toFixed(2)}</div>
						</div>
						<div>
							<div class="text-gray-500 mb-1">配送费</div>
							<div class="font-medium text-lg">¥{selectedOrder.delivery_fee.toFixed(2)}</div>
						</div>
						<div>
							<div class="text-gray-500 mb-1">距离</div>
							<div class="font-medium text-lg">{selectedOrder.distance} km</div>
						</div>
					</div>
				</div>

				{#if selectedOrder.runner}
					<div class="bg-white rounded-xl p-5 shadow-sm">
						<h4 class="font-semibold mb-4 text-gray-900">配送骑手</h4>
						<div class="flex items-center space-x-4">
							<div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
								{selectedOrder.runner.name[0]}
							</div>
							<div>
								<div class="font-medium">{selectedOrder.runner.name}</div>
								<div class="text-sm text-gray-500">{selectedOrder.runner.phone}</div>
							</div>
						</div>
					</div>
				{/if}

				{#if selectedOrder.appeal}
					<div class="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
						<h4 class="font-semibold mb-4 text-gray-900 flex items-center">
							<span class="mr-2">⚡</span> 申诉信息
						</h4>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-gray-500">类型</span>
								<span class="font-medium">{selectedOrder.appeal.type}</span>
							</div>
							<div>
								<div class="text-gray-500 mb-1">原因</div>
								<div class="bg-gray-50 p-3 rounded-lg text-sm">{selectedOrder.appeal.reason}</div>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-gray-500">状态</span>
								<span class="font-medium">
									{selectedOrder.appeal.status === 'pending' ? '待审核' : 
									 selectedOrder.appeal.status === 'approved' ? '已通过' : '已驳回'}
								</span>
							</div>
						</div>
					</div>
				{/if}

				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">处理时间线</h4>
					<div class="space-y-4">
						{#each timeline as event, i}
							<div class="flex">
								<div class="flex flex-col items-center mr-4">
									<div class="w-3 h-3 rounded-full bg-blue-500"></div>
									{#if i < timeline.length - 1}
										<div class="w-0.5 h-full bg-gray-200 mt-1"></div>
									{/if}
								</div>
								<div class="flex-1 pb-4">
									<div class="text-sm font-medium text-gray-900">{event.content}</div>
									<div class="text-xs text-gray-500 mt-1">{event.created_at}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showAssignModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-xl p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold mb-4">分配骑手</h3>
			<select
				bind:value={selectedRunner}
				class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
			>
				<option value={0}>选择骑手</option>
				{#each runners as runner}
					<option value={runner.id}>{runner.name} - {runner.phone}</option>
				{/each}
			</select>
			<div class="flex justify-end space-x-3">
				<button
					on:click={() => showAssignModal = false}
					class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					取消
				</button>
				<button
					on:click={handleAssign}
					disabled={!selectedRunner}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
				>
					确认分配
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showCreateModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
		<div class="bg-white rounded-xl p-6 w-full max-w-lg my-8">
			<h3 class="text-lg font-semibold mb-4">新建订单</h3>
			<div class="space-y-4 max-h-96 overflow-y-auto">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">顾客姓名</label>
					<input bind:value={newOrder.customer_name} class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">顾客电话</label>
					<input bind:value={newOrder.customer_phone} class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">商家名称</label>
					<input bind:value={newOrder.merchant_name} class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">取餐地址</label>
					<input bind:value={newOrder.pickup_address} class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">配送地址</label>
					<input bind:value={newOrder.delivery_address} class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div class="grid grid-cols-3 gap-3">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">商品金额</label>
						<input type="number" bind:value={newOrder.goods_amount} class="w-full px-3 py-2 border rounded-lg" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">配送费</label>
						<input type="number" bind:value={newOrder.delivery_fee} class="w-full px-3 py-2 border rounded-lg" />
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">距离(km)</label>
						<input type="number" bind:value={newOrder.distance} class="w-full px-3 py-2 border rounded-lg" />
					</div>
				</div>
			</div>
			<div class="flex justify-end space-x-3 mt-6">
				<button
					on:click={() => showCreateModal = false}
					class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					取消
				</button>
				<button
					on:click={handleCreateOrder}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
				>
					创建订单
				</button>
			</div>
		</div>
	</div>
{/if}
