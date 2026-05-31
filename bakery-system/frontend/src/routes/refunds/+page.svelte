<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let refunds = [];
	let orders = [];
	let selectedIds = [];
	let statusFilter = 'pending';
	let searchQuery = '';
	let activeTab = 'pending';
	let showDetailModal = false;
	let selectedRefund = null;
	let showRejectModal = false;
	let rejectReason = '';
	let showApplyModal = false;
	let unifiedTimeline = [];

	let applyForm = {
		orderId: '',
		refundAmount: 0,
		refundType: 'balance',
		reason: '',
		applicant: '客服'
	};

	let tabs = [
		{ id: 'pending', name: '待复核' },
		{ id: 'approved', name: '已通过' },
		{ id: 'rejected', name: '已驳回' }
	];

	$: filteredRefunds = refunds.filter(r => {
		const matchStatus = !statusFilter || r.status === statusFilter;
		const matchSearch = !searchQuery ||
			r.refundNo.includes(searchQuery) ||
			r.memberName.includes(searchQuery);
		return matchStatus && matchSearch;
	});

	$: hasSelection = selectedIds.length > 0;

	$: selectedOrderForRefund = orders.find(o => o.id === applyForm.orderId);

	onMount(async () => {
		await loadRefunds();
		const oRes = await api.getOrders();
		orders = (oRes.data || []).filter(o => o.status !== 'cancelled');
	});

	async function loadRefunds() {
		const res = await api.getRefunds();
		refunds = res.data || [];
	}

	function switchTab(tabId) {
		activeTab = tabId;
		statusFilter = tabId;
		selectedIds = [];
	}

	function toggleSelect(id) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function toggleSelectAll() {
		if (selectedIds.length === filteredRefunds.length) {
			selectedIds = [];
		} else {
			selectedIds = filteredRefunds.map(r => r.id);
		}
	}

	async function openDetail(refund) {
		selectedRefund = await api.getRefund(refund.id);
		if (selectedRefund.orderId) {
			const tlRes = await api.getUnifiedTimeline({ orderID: selectedRefund.orderId });
			unifiedTimeline = (tlRes.data || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		} else {
			unifiedTimeline = selectedRefund.statusHistory || [];
		}
		showDetailModal = true;
	}

	async function batchApprove() {
		await api.batchReviewRefunds({
			ids: selectedIds,
			action: 'approve',
			reviewer: '门店主理人',
			remark: '批量通过'
		});
		selectedIds = [];
		loadRefunds();
	}

	async function batchReject() {
		if (!rejectReason) return;
		await api.batchReviewRefunds({
			ids: selectedIds,
			action: 'reject',
			reviewer: '门店主理人',
			rejectReason
		});
		selectedIds = [];
		showRejectModal = false;
		rejectReason = '';
		loadRefunds();
	}

	async function approveSingle(id) {
		await api.approveRefund(id, {
			reviewer: '门店主理人',
			remark: '通过'
		});
		loadRefunds();
	}

	function openRejectModal(id) {
		selectedRefund = { id };
		rejectReason = '';
		showRejectModal = true;
	}

	async function rejectSingle() {
		if (!rejectReason) return;
		await api.rejectRefund(selectedRefund.id, {
			reviewer: '门店主理人',
			rejectReason
		});
		showRejectModal = false;
		rejectReason = '';
		loadRefunds();
	}

	function openApplyRefund() {
		applyForm = {
			orderId: '',
			refundAmount: 0,
			refundType: 'balance',
			reason: '',
			applicant: '客服'
		};
		showApplyModal = true;
	}

	function onSelectOrderForRefund(orderId) {
		const order = orders.find(o => o.id === orderId);
		if (order) {
			applyForm.refundAmount = order.payAmount;
		}
	}

	async function handleApplyRefund() {
		if (!applyForm.orderId || !applyForm.refundAmount || !applyForm.reason) return;
		await api.createRefund(applyForm);
		showApplyModal = false;
		loadRefunds();
	}

	function getRefundStatus(status) {
		const map = {
			pending: '待复核',
			approved: '已通过',
			rejected: '已驳回'
		};
		return map[status] || status;
	}

	function getRefundType(type) {
		const map = {
			balance: '退回余额',
			cash: '现金退款',
			original: '原路退回'
		};
		return map[type] || type;
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
	<div class="tabs">
		{#each tabs as tab}
			<button class="tab" class:active={activeTab === tab.id} on:click={() => switchTab(tab.id)}>
				{tab.name}
				{#if tab.id === 'pending'}
					<span style="background: var(--warning); color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 4px;">
						{refunds.filter(r => r.status === 'pending').length}
					</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="filters">
		<input type="text" class="input" placeholder="搜索退款单号/会员..." bind:value={searchQuery} />
		<button class="btn btn-primary" on:click={openApplyRefund}>+ 申请退款</button>
	</div>

	{#if hasSelection && activeTab === 'pending'}
		<div class="batch-actions">
			<span>已选择 {selectedIds.length} 项</span>
			<button class="btn btn-sm btn-success" on:click={batchApprove}>批量通过</button>
			<button class="btn btn-sm btn-danger" on:click={() => showRejectModal = true}>批量驳回</button>
			<button class="btn btn-sm btn-outline" on:click={() => selectedIds = []}>取消选择</button>
		</div>
	{/if}

	<div class="card">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						{#if activeTab === 'pending'}
							<th class="checkbox-cell">
								<input type="checkbox"
									checked={selectedIds.length === filteredRefunds.length && filteredRefunds.length > 0}
									on:change={toggleSelectAll}
								/>
							</th>
						{/if}
						<th>退款单号</th>
						<th>会员</th>
						<th>退款金额</th>
						<th>退款方式</th>
						<th>申请时间</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredRefunds as refund}
						<tr>
							{#if activeTab === 'pending'}
								<td class="checkbox-cell">
									<input type="checkbox"
										checked={selectedIds.includes(refund.id)}
										on:change={() => toggleSelect(refund.id)}
									/>
								</td>
							{/if}
							<td><strong>{refund.refundNo}</strong></td>
							<td>{refund.memberName}</td>
							<td style="color: var(--danger); font-weight: 600;">¥{refund.refundAmount.toFixed(2)}</td>
							<td>{getRefundType(refund.refundType)}</td>
							<td>{formatDate(refund.createdAt)}</td>
							<td><span class="badge {refund.status}">{getRefundStatus(refund.status)}</span></td>
							<td>
								<div class="btn-group">
									<button class="btn btn-sm btn-outline" on:click={() => openDetail(refund)}>详情</button>
									{#if refund.status === 'pending'}
										<button class="btn btn-sm btn-success" on:click={() => approveSingle(refund.id)}>通过</button>
										<button class="btn btn-sm btn-danger" on:click={() => openRejectModal(refund.id)}>驳回</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if showApplyModal}
		<div class="modal-overlay" on:click={() => showApplyModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>申请退款</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showApplyModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>选择关联订单</label>
						<select class="input" style="width: 100%;" bind:value={applyForm.orderId} on:change={(e) => onSelectOrderForRefund(e.target.value)}>
							<option value="">请选择要退款的订单</option>
							{#each orders as order}
								<option value={order.id}>{order.orderNo} - {order.memberName} ¥{order.payAmount.toFixed(2)} ({getOrderStatus(order.status)})</option>
							{/each}
						</select>
					</div>

					{#if selectedOrderForRefund}
						<div class="card" style="padding: 1rem; margin-bottom: 1rem; background: var(--gray-50);">
							<div class="text-sm"><strong>订单号:</strong> {selectedOrderForRefund.orderNo}</div>
							<div class="text-sm"><strong>会员:</strong> {selectedOrderForRefund.memberName}</div>
							<div class="text-sm"><strong>订单金额:</strong> ¥{selectedOrderForRefund.totalAmount.toFixed(2)}</div>
							<div class="text-sm"><strong>实付金额:</strong> ¥{selectedOrderForRefund.payAmount.toFixed(2)}</div>
							{#if selectedOrderForRefund.useBalance > 0}
								<div class="text-sm"><strong>余额抵扣:</strong> ¥{selectedOrderForRefund.useBalance.toFixed(2)}</div>
							{/if}
						</div>
					{/if}

					<div class="form-row">
						<div class="form-group">
							<label>退款金额</label>
							<input type="number" class="input" bind:value={applyForm.refundAmount} style="width: 100%;" />
						</div>
						<div class="form-group">
							<label>退款方式</label>
							<select class="input" bind:value={applyForm.refundType} style="width: 100%;">
								<option value="balance">退回余额</option>
								<option value="cash">现金退款</option>
								<option value="original">原路退回</option>
							</select>
						</div>
					</div>

					<div class="form-group">
						<label>退款原因</label>
						<textarea class="input" bind:value={applyForm.reason}
							style="width: 100%; min-height: 100px;"
							placeholder="请详细说明退款原因..."></textarea>
					</div>

					<div class="form-group">
						<label>申请人</label>
						<input type="text" class="input" bind:value={applyForm.applicant} style="width: 100%;" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showApplyModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleApplyRefund} disabled={!applyForm.orderId || !applyForm.refundAmount || !applyForm.reason}>
						提交退款申请
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showDetailModal && selectedRefund}
		<div class="modal-overlay" on:click={() => showDetailModal = false}>
			<div class="modal" style="max-width: 700px;" on:click|stopPropagation>
				<div class="modal-header">
					<h3>退款详情 - {selectedRefund.refundNo}</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showDetailModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="grid-2 mb-6">
						<div>
							<div class="text-sm text-gray-500">会员</div>
							<div><strong>{selectedRefund.memberName}</strong></div>
						</div>
						<div>
							<div class="text-sm text-gray-500">状态</div>
							<span class="badge {selectedRefund.status}">{getRefundStatus(selectedRefund.status)}</span>
						</div>
						<div>
							<div class="text-sm text-gray-500">退款金额</div>
							<div style="color: var(--danger); font-weight: 600;">¥{selectedRefund.refundAmount.toFixed(2)}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">退款方式</div>
							<div>{getRefundType(selectedRefund.refundType)}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">申请人</div>
							<div>{selectedRefund.applicant || '-'}</div>
						</div>
						<div>
							<div class="text-sm text-gray-500">审核人</div>
							<div>{selectedRefund.reviewer || '-'}</div>
						</div>
					</div>

					<div class="mb-6">
						<div class="text-sm text-gray-500">退款原因</div>
						<div class="card" style="padding: 1rem; margin-top: 0.5rem;">
							{selectedRefund.reason || '-'}
						</div>
					</div>

					{#if selectedRefund.rejectReason}
						<div class="mb-6">
							<div class="text-sm text-gray-500">驳回原因</div>
							<div class="card" style="padding: 1rem; margin-top: 0.5rem; border-left: 3px solid var(--danger);">
								{selectedRefund.rejectReason}
							</div>
						</div>
					{/if}

					{#if selectedRefund.order}
						<div class="mb-6">
							<div class="text-sm text-gray-500 mb-4">关联订单 - {selectedRefund.order.orderNo}</div>
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
									{#each selectedRefund.order.items as item}
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
					{/if}

					<div>
						<div class="text-sm text-gray-500 mb-4">统一时间轴（订单+退款全链路）</div>
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

	{#if showRejectModal}
		<div class="modal-overlay" on:click={() => showRejectModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>驳回退款申请</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showRejectModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>驳回原因</label>
						<textarea class="input" bind:value={rejectReason}
							style="width: 100%; min-height: 120px;"
							placeholder="请填写驳回原因..."></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showRejectModal = false}>取消</button>
					<button class="btn btn-danger" on:click={hasSelection ? batchReject : rejectSingle}>
						确认驳回
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
