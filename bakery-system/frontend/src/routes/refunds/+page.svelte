<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let refunds = [];
	let selectedIds = [];
	let statusFilter = 'pending';
	let searchQuery = '';
	let activeTab = 'pending';
	let showDetailModal = false;
	let selectedRefund = null;
	let showRejectModal = false;
	let rejectReason = '';

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

	onMount(() => {
		loadRefunds();
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
							<div class="text-sm text-gray-500">申请时间</div>
							<div>{formatDate(selectedRefund.createdAt)}</div>
						</div>
					</div>

					<div class="mb-6">
						<div class="text-sm text-gray-500">退款原因</div>
						<div class="card" style="padding: 1rem; margin-top: 0.5rem;">
							{selectedRefund.reason || '-'}
						</div>
					</div>

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

					{#if selectedRefund.statusHistory && selectedRefund.statusHistory.length > 0}
						<div>
							<div class="text-sm text-gray-500 mb-4">审核时间轴</div>
							<div class="timeline">
								{#each selectedRefund.statusHistory as log}
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
					{/if}
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
					<button class="btn btn-danger" on:click={selectedRefund && hasSelection ? batchReject : rejectSingle}>
						确认驳回
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
