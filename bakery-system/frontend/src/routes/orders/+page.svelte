<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let orders = [];
	let selectedIds = [];
	let statusFilter = '';
	let searchQuery = '';
	let showDetailModal = false;
	let showLossModal = false;
	let selectedOrder = null;

	let lossForm = { materialLoss: 0, remark: '', operator: '后厨负责人' };

	$: filteredOrders = orders.filter(o => {
		const matchStatus = !statusFilter || o.status === statusFilter;
		const matchSearch = !searchQuery ||
			o.orderNo.includes(searchQuery) ||
			o.memberName.includes(searchQuery) ||
			o.memberPhone.includes(searchQuery);
		return matchStatus && matchSearch;
	});

	$: hasSelection = selectedIds.length > 0;

	onMount(loadOrders);

	async function loadOrders() {
		const res = await api.getOrders();
		orders = res.data || [];
	}

	function toggleSelect(id) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function toggleSelectAll() {
		if (selectedIds.length === filteredOrders.length) {
			selectedIds = [];
		} else {
			selectedIds = filteredOrders.map(o => o.id);
		}
	}

	async function batchUpdateStatus(status) {
		await api.batchUpdateOrderStatus({
			ids: selectedIds,
			status,
			operator: '门店主理人',
			remark: '批量更新状态'
		});
		selectedIds = [];
		loadOrders();
	}

	async function openDetail(order) {
		selectedOrder = await api.getOrder(order.id);
		showDetailModal = true;
	}

	function openLoss(order) {
		selectedOrder = order;
		lossForm = { materialLoss: order.materialLoss || 0, remark: '', operator: '后厨负责人' };
		showLossModal = true;
	}

	async function handleLoss() {
		await api.updateMaterialLoss(selectedOrder.id, lossForm);
		showLossModal = false;
		loadOrders();
	}

	function getOrderStatus(status) {
		const map = {
			pending: '待处理',
			preparing: '制作中',
			ready: '待取货',
			completed: '已完成',
			cancelled: '已取消'
		};
		return map[status] || status;
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div>
	<div class="filters">
		<select class="input" bind:value={statusFilter}>
			<option value="">全部状态</option>
			<option value="pending">待处理</option>
			<option value="preparing">制作中</option>
			<option value="ready">待取货</option>
			<option value="completed">已完成</option>
		</select>
		<input type="text" class="input" placeholder="搜索订单号/会员..." bind:value={searchQuery} />
	</div>

	{#if hasSelection}
		<div class="batch-actions">
			<span>已选择 {selectedIds.length} 项</span>
			<button class="btn btn-sm btn-outline" on:click={() => batchUpdateStatus('preparing')}>批量开始制作</button>
			<button class="btn btn-sm btn-outline" on:click={() => batchUpdateStatus('ready')}>批量标记待取</button>
			<button class="btn btn-sm btn-outline" on:click={() => batchUpdateStatus('completed')}>批量完成</button>
			<button class="btn btn-sm btn-outline" on:click={() => selectedIds = []}>取消选择</button>
		</div>
	{/if}

	<div class="card">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th class="checkbox-cell">
							<input type="checkbox"
								checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
								on:change={toggleSelectAll}
							/>
						</th>
						<th>订单号</th>
						<th>会员</th>
						<th>金额</th>
						<th>状态</th>
						<th>取货时间</th>
						<th>原料损耗</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredOrders as order}
						<tr>
							<td class="checkbox-cell">
								<input type="checkbox"
									checked={selectedIds.includes(order.id)}
									on:change={() => toggleSelect(order.id)}
								/>
							</td>
							<td><strong>{order.orderNo}</strong></td>
							<td>{order.memberName}</td>
							<td>¥{order.payAmount.toFixed(2)}</td>
							<td><span class="badge {order.status}">{getOrderStatus(order.status)}</span></td>
							<td>{formatDate(order.pickupTime)}</td>
							<td class:text-danger={order.materialLoss > 0}>
								{order.materialLoss > 0 ? `¥${order.materialLoss.toFixed(2)}` : '-'}
							</td>
							<td>
								<div class="btn-group">
									<button class="btn btn-sm btn-outline" on:click={() => openDetail(order)}>详情</button>
									<button class="btn btn-sm btn-outline" on:click={() => openLoss(order)}>记录损耗</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if showDetailModal && selectedOrder}
		<div class="modal-overlay" on:click={() => showDetailModal = false}>
			<div class="modal" style="max-width: 700px;" on:click|stopPropagation>
				<div class="modal-header">
					<h3>订单详情 - {selectedOrder.orderNo}</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showDetailModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="grid-2 mb-6">
						<div>
							<div class="text-sm text-gray-500">会员</div>
							<div><strong>{selectedOrder.memberName}</strong> ({selectedOrder.memberPhone})</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">状态</div>
							<span class="badge {selectedOrder.status}">{getOrderStatus(selectedOrder.status)}</span>
						</div>
						<div>
							<div class="text-sm text-gray-500">订单金额</div>
							<div>¥{selectedOrder.totalAmount.toFixed(2)}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">实付金额</div>
							<div>¥{selectedOrder.payAmount.toFixed(2)}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">取货时间</div>
							<div>{formatDate(selectedOrder.pickupTime)}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">原料损耗</div>
							<div>¥{selectedOrder.materialLoss.toFixed(2)}</div>
						</div>
					</div>

					<div class="mb-6">
						<div class="text-sm text-gray-500 mb-4">订单项</div>
						<table>
							<thead>
								<tr>
									<th>产品</th>
									<th>单价</th>
									<th>数量</th>
									<th>小计</th>
								</tr>
							</thead>
							<tbody>
								{#each selectedOrder.items as item}
									<tr>
										<td>{item.productName}</td>
										<td>¥{item.unitPrice.toFixed(2)}</td>
										<td>{item.quantity}</td>
										<td>¥{item.subtotal.toFixed(2)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div>
						<div class="text-sm text-gray-500 mb-4">状态时间轴</div>
						<div class="timeline">
							{#each selectedOrder.statusHistory as log}
								<div class="timeline-item">
									<div class="timeline-dot"></div>
									<div class="timeline-content">
										<div class="timeline-time">{formatDate(log.createdAt)}</div>
										<div class="text-sm">
											<strong>{log.operator}</strong>
											从 <span class="badge {log.fromStatus}">{log.fromStatus || '-'}</span>
											变更为 <span class="badge {log.toStatus}">{log.toStatus}</span>
										</div>
										{#if log.remark}
											<div class="text-sm text-gray-500">{log.remark}</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showDetailModal = false}>关闭</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showLossModal}
		<div class="modal-overlay" on:click={() => showLossModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>记录原料损耗</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showLossModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>订单号</label>
						<div><strong>{selectedOrder?.orderNo}</strong></div>
					</div>
					<div class="form-group">
						<label>损耗金额</label>
						<input type="number" class="input" bind:value={lossForm.materialLoss} style="width: 100%;" />
					</div>
					<div class="form-group">
						<label>备注说明</label>
						<textarea class="input" bind:value={lossForm.remark} style="width: 100%; min-height: 80px;" placeholder="请说明损耗原因..."></textarea>
					</div>
					<div class="form-group">
						<label>操作人</label>
						<input type="text" class="input" bind:value={lossForm.operator} style="width: 100%;" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showLossModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleLoss}>保存</button>
				</div>
			</div>
		</div>
	{/if}
</div>
