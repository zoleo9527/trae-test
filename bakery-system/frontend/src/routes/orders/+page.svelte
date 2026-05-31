<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';

	let orders = [];
	let members = [];
	let products = [];
	let selectedIds = [];
	let statusFilter = '';
	let searchQuery = '';
	let showDetailModal = false;
	let showLossModal = false;
	let showCreateModal = false;
	let selectedOrder = null;
	let unifiedTimeline = [];
	let memberRecharges = [];
	let memberInfo = null;

	let lossForm = { materialLoss: 0, remark: '', operator: '后厨负责人' };

	let newOrder = {
		memberId: '',
		items: [],
		pickupTime: '',
		operator: '门店主理人',
		remark: '',
		useBalance: false
	};

	$: hasSelection = selectedIds.length > 0;

	$: newOrderTotal = newOrder.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

	$: selectedMember = members.find(m => m.id === newOrder.memberId);

	onMount(async () => {
		const params = new URLSearchParams($page.url.searchParams);
		const urlStatus = params.get('status') || '';
		statusFilter = urlStatus;
		searchQuery = params.get('search') || '';
		await loadOrders();
		const mRes = await api.getMembers();
		members = mRes.data || [];
		const pRes = await api.getProducts({ status: 'active' });
		products = pRes.data || [];
	});

	async function loadOrders() {
		const params = {};
		if (statusFilter) params.status = statusFilter;
		if (searchQuery) params.search = searchQuery;
		const res = await api.getOrders(params);
		orders = res.data || [];
		selectedIds = [];
	}

	function updateURL() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (searchQuery) params.set('search', searchQuery);
		goto(`/orders${params.toString() ? '?' + params.toString() : ''}`, { replaceState: true, noScroll: true });
	}

	function onStatusChange(e) {
		statusFilter = e.target.value;
		updateURL();
		loadOrders();
	}

	function onSearchChange(e) {
		searchQuery = e.target.value;
	}

	async function onSearchSubmit() {
		updateURL();
		await loadOrders();
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
		const tlRes = await api.getUnifiedTimeline({ orderID: order.id });
		unifiedTimeline = (tlRes.data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		if (selectedOrder.memberId) {
			const mRes = await api.getMember(selectedOrder.memberId);
			memberInfo = mRes;
			const rRes = await api.getRecharges(selectedOrder.memberId);
			memberRecharges = rRes.data || [];
		} else {
			memberInfo = null;
			memberRecharges = [];
		}
		showDetailModal = true;
	}

	function openLoss(order) {
		selectedOrder = order;
		lossForm = { materialLoss: order.materialLoss || 0, remark: '', operator: '后厨负责人' };
		showLossModal = true;
	}

	function openCreateOrder() {
		newOrder = {
			memberId: '',
			items: [],
			pickupTime: '',
			operator: '门店主理人',
			remark: '',
			useBalance: false
		};
		showCreateModal = true;
	}

	function addOrderItem(productId) {
		const product = products.find(p => p.id === productId);
		if (!product) return;
		const existing = newOrder.items.find(it => it.productId === productId);
		if (existing) {
			existing.quantity += 1;
			existing.subtotal = existing.unitPrice * existing.quantity;
		} else {
			newOrder.items = [...newOrder.items, {
				productId: product.id,
				productName: product.name,
				unitPrice: product.price,
				quantity: 1,
				subtotal: product.price,
				remark: ''
			}];
		}
		newOrder.items = newOrder.items;
	}

	function removeOrderItem(index) {
		newOrder.items = newOrder.items.filter((_, i) => i !== index);
	}

	function updateItemQty(index, qty) {
		if (qty < 1) return;
		newOrder.items[index].quantity = qty;
		newOrder.items[index].subtotal = newOrder.items[index].unitPrice * qty;
		newOrder.items = newOrder.items;
	}

	async function handleCreateOrder() {
		if (!newOrder.memberId || newOrder.items.length === 0) return;
		const member = members.find(m => m.id === newOrder.memberId);
		const totalAmount = newOrderTotal;
		let useBalance = 0;
		if (newOrder.useBalance && member) {
			useBalance = Math.min(member.balance, totalAmount);
		}
		const payAmount = totalAmount - useBalance;

		await api.createOrder({
			memberId: newOrder.memberId,
			memberName: member?.name || '',
			memberPhone: member?.phone || '',
			totalAmount,
			payAmount,
			useBalance,
			pickupTime: newOrder.pickupTime || new Date(Date.now() + 3600000).toISOString(),
			operator: newOrder.operator,
			remark: newOrder.remark,
			items: newOrder.items
		});
		showCreateModal = false;
		loadOrders();
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

	function getLogTypeLabel(type) {
		const map = { order: '订单', refund: '退款', recharge: '储值' };
		return map[type] || type;
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
		<select class="input" value={statusFilter} on:change={onStatusChange}>
			<option value="">全部状态</option>
			<option value="pending">待处理</option>
			<option value="preparing">制作中</option>
			<option value="ready">待取货</option>
			<option value="completed">已完成</option>
		</select>
		<input type="text" class="input" placeholder="搜索订单号/会员..." value={searchQuery} on:input={onSearchChange} on:keydown={(e) => e.key === 'Enter' && onSearchSubmit()} />
		<button class="btn btn-outline" on:click={onSearchSubmit}>搜索</button>
		<button class="btn btn-primary" on:click={openCreateOrder}>+ 新建订单</button>
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
								checked={selectedIds.length === orders.length && orders.length > 0}
								on:change={toggleSelectAll}
							/>
						</th>
						<th>订单号</th>
						<th>会员</th>
						<th>金额</th>
						<th>余额抵扣</th>
						<th>状态</th>
						<th>取货时间</th>
						<th>原料损耗</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each orders as order}
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
							<td>{order.useBalance > 0 ? `¥${order.useBalance.toFixed(2)}` : '-'}</td>
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

	{#if showCreateModal}
		<div class="modal-overlay" on:click={() => showCreateModal = false}>
			<div class="modal" style="max-width: 700px;" on:click|stopPropagation>
				<div class="modal-header">
					<h3>新建订单</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showCreateModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-row">
						<div class="form-group">
							<label>选择会员</label>
							<select class="input" bind:value={newOrder.memberId} style="width: 100%;">
								<option value="">请选择会员</option>
								{#each members as member}
									<option value={member.id}>{member.name} ({member.phone}) 余额: ¥{member.balance.toFixed(2)}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label>取货时间</label>
							<input type="datetime-local" class="input" bind:value={newOrder.pickupTime} style="width: 100%;" />
						</div>
					</div>

					<div class="form-group">
						<label>添加产品</label>
						<select class="input" style="width: 100%;" on:change={(e) => { if (e.target.value) { addOrderItem(e.target.value); e.target.value = ''; } }}>
							<option value="">点击选择产品添加到订单</option>
							{#each products as product}
								<option value={product.id}>{product.name} - ¥{product.price.toFixed(2)}</option>
							{/each}
						</select>
					</div>

					{#if newOrder.items.length > 0}
						<table style="margin-bottom: 1rem;">
							<thead>
								<tr>
									<th>产品</th>
									<th>单价</th>
									<th>数量</th>
									<th>小计</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each newOrder.items as item, i}
									<tr>
										<td>{item.productName}</td>
										<td>¥{item.unitPrice.toFixed(2)}</td>
										<td>
											<input type="number" class="input" style="width: 60px;" min="1"
												value={item.quantity}
												on:change={(e) => updateItemQty(i, parseInt(e.target.value) || 1)} />
										</td>
										<td>¥{item.subtotal.toFixed(2)}</td>
										<td><button class="btn btn-sm btn-danger" on:click={() => removeOrderItem(i)}>×</button></td>
									</tr>
								{/each}
							</tbody>
						</table>
						<div style="text-align: right; font-weight: 600; margin-bottom: 1rem;">
							合计: ¥{newOrderTotal.toFixed(2)}
						</div>
					{/if}

					{#if selectedMember && selectedMember.balance > 0 && newOrderTotal > 0}
						<div class="form-group" style="display: flex; align-items: center; gap: 0.5rem;">
							<input type="checkbox" id="useBalance" bind:checked={newOrder.useBalance} />
							<label for="useBalance" style="margin-bottom: 0;">
								使用余额抵扣 (可用: ¥{selectedMember.balance.toFixed(2)})
							</label>
						</div>
						{#if newOrder.useBalance}
							<div style="color: var(--success); font-size: 0.875rem; margin-bottom: 0.5rem;">
								抵扣 ¥{Math.min(selectedMember.balance, newOrderTotal).toFixed(2)}，实付 ¥{(newOrderTotal - Math.min(selectedMember.balance, newOrderTotal)).toFixed(2)}
							</div>
						{/if}
					{/if}

					<div class="form-row">
						<div class="form-group">
							<label>操作人</label>
							<input type="text" class="input" bind:value={newOrder.operator} style="width: 100%;" />
						</div>
						<div class="form-group">
							<label>备注</label>
							<input type="text" class="input" bind:value={newOrder.remark} style="width: 100%;" placeholder="订单备注..." />
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showCreateModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleCreateOrder} disabled={!newOrder.memberId || newOrder.items.length === 0}>
						创建订单
					</button>
				</div>
			</div>
		</div>
	{/if}

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
							<div class="text-sm text-gray-500">余额抵扣</div>
							<div>{selectedOrder.useBalance > 0 ? `¥${selectedOrder.useBalance.toFixed(2)}` : '-'}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">原料损耗</div>
							<div>¥{selectedOrder.materialLoss.toFixed(2)}</div>
						</div>
					</div>

					{#if memberInfo}
						<div class="card" style="padding: 1rem; margin-bottom: 1rem; background: #F0FDF4; border: 1px solid #BBF7D0;">
							<div class="text-sm text-gray-500 mb-2">会员资金概览</div>
							<div class="grid-2">
								<div>
									<div class="text-sm text-gray-500">当前余额</div>
									<div style="font-weight: 600; color: var(--success);">¥{memberInfo.balance.toFixed(2)}</div>
								</div>
								<div>
									<div class="text-sm text-gray-500">累计储值</div>
									<div style="font-weight: 600;">¥{memberRecharges.reduce((s, r) => s + r.amount, 0).toFixed(2)}</div>
								</div>
							</div>
							{#if memberRecharges.length > 0}
								<div class="text-sm text-gray-500 mt-2 mb-1">最近储值记录</div>
								{#each memberRecharges.slice(0, 3) as r}
									<div class="text-sm">
										{formatDate(r.createdAt)} · 储值 ¥{r.amount.toFixed(2)} (赠送 ¥{r.bonus.toFixed(2)})
										{#if r.operator} · {r.operator}{/if}
									</div>
								{/each}
							{/if}
						</div>
					{/if}

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
						<div class="text-sm text-gray-500 mb-4">统一时间轴</div>
						<div class="timeline">
							{#each unifiedTimeline as log}
								<div class="timeline-item">
									<div class="timeline-dot" style={log.relatedType === 'refund' ? 'background: var(--danger);' : log.relatedType === 'recharge' ? 'background: var(--success);' : ''}></div>
									<div class="timeline-content">
										<div class="timeline-time">{formatDate(log.createdAt)}</div>
										<div class="text-sm">
											<span style="font-size: 0.7rem; padding: 1px 6px; border-radius: 4px; margin-right: 4px;
												background: {log.relatedType === 'refund' ? '#FEE2E2; color: #991B1B' : log.relatedType === 'recharge' ? '#D1FAE5; color: #065F46' : '#DBEAFE; color: #1E40AF'};">
												{getLogTypeLabel(log.relatedType)}
											</span>
											<strong>{log.operator}</strong>
											{#if log.fromStatus && log.toStatus && log.fromStatus !== log.toStatus}
												从 <span class="badge {log.fromStatus}">{log.fromStatus}</span>
												变更为 <span class="badge {log.toStatus}">{log.toStatus}</span>
											{:else}
												<span class="badge {log.toStatus || log.fromStatus}">{log.toStatus || log.fromStatus}</span>
											{/if}
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
