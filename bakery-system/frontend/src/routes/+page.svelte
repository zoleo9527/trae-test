<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let stats = {
		pendingOrders: 0,
		preparingOrders: 0,
		pendingRefunds: 0,
		rejectedRefunds: 0,
		needReviewOrders: 0,
		todayOrders: 0,
		todayRevenue: 0,
		totalMembers: 0,
		totalBalance: 0,
		pendingOrdersList: [],
		pendingRefundsList: [],
		rejectedRefundsList: []
	};

	let recentLogs = [];

	onMount(async () => {
		const statsData = await api.getDashboardStats();
		stats = { ...stats, ...statsData };

		const activities = await api.getRecentActivities();
		recentLogs = activities.logs || [];
	});

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
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

	function getRefundStatus(status) {
		const map = {
			pending: '待复核',
			approved: '已通过',
			rejected: '已驳回'
		};
		return map[status] || status;
	}

	function getLogTypeLabel(type) {
		const map = { order: '订单', refund: '退款', recharge: '储值' };
		return map[type] || type;
	}
</script>

<div>
	<div class="stats-grid">
		<a href="/orders?status=pending" class="stat-card warning" style="text-decoration: none; cursor: pointer;">
			<h3>待处理订单</h3>
			<div class="value">{stats.pendingOrders}</div>
		</a>
		<div class="stat-card">
			<h3>制作中订单</h3>
			<div class="value">{stats.preparingOrders}</div>
		</div>
		<a href="/refunds?tab=pending" class="stat-card warning" style="text-decoration: none; cursor: pointer;">
			<h3>待退款复核</h3>
			<div class="value">{stats.pendingRefunds}</div>
		</a>
		<a href="/refunds?tab=rejected" class="stat-card danger" style="text-decoration: none; cursor: pointer;">
			<h3>已驳回退款(需回查)</h3>
			<div class="value">{stats.rejectedRefunds}</div>
		</a>
		<div class="stat-card" style="border-left: 3px solid var(--accent);">
			<h3>需回查订单</h3>
			<div class="value">{stats.needReviewOrders}</div>
		</div>
		<div class="stat-card">
			<h3>今日订单</h3>
			<div class="value">{stats.todayOrders}</div>
		</div>
		<div class="stat-card success">
			<h3>今日营收</h3>
			<div class="value">¥{stats.todayRevenue.toFixed(2)}</div>
		</div>
		<div class="stat-card">
			<h3>会员总数</h3>
			<div class="value">{stats.totalMembers}</div>
		</div>
	</div>

	<div class="grid-2">
		<div class="card">
			<div class="card-header">
				<span>待处理订单</span>
				<a href="/orders" style="font-size: 0.875rem; color: var(--primary);">查看全部</a>
			</div>
			<div class="card-body">
				{#if stats.pendingOrdersList && stats.pendingOrdersList.length > 0}
					<table>
						<thead>
							<tr>
								<th>订单号</th>
								<th>会员</th>
								<th>金额</th>
								<th>状态</th>
							</tr>
						</thead>
						<tbody>
							{#each stats.pendingOrdersList as order}
								<tr>
									<td class="text-sm">{order.orderNo}</td>
									<td class="text-sm">{order.memberName}</td>
									<td>¥{order.payAmount.toFixed(2)}</td>
									<td><span class="badge {order.status}">{getOrderStatus(order.status)}</span></td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div style="text-align: center; color: var(--gray-500); padding: 2rem;">暂无待处理订单</div>
				{/if}
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<span>待复核退款</span>
				<a href="/refunds" style="font-size: 0.875rem; color: var(--primary);">查看全部</a>
			</div>
			<div class="card-body">
				{#if stats.pendingRefundsList && stats.pendingRefundsList.length > 0}
					<table>
						<thead>
							<tr>
								<th>退款单号</th>
								<th>会员</th>
								<th>金额</th>
								<th>状态</th>
							</tr>
						</thead>
						<tbody>
							{#each stats.pendingRefundsList as refund}
								<tr>
									<td class="text-sm">{refund.refundNo}</td>
									<td class="text-sm">{refund.memberName}</td>
									<td>¥{refund.refundAmount.toFixed(2)}</td>
									<td><span class="badge {refund.status}">{getRefundStatus(refund.status)}</span></td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div style="text-align: center; color: var(--gray-500); padding: 2rem;">暂无待复核退款</div>
				{/if}
			</div>
		</div>
	</div>

	{#if stats.rejectedRefundsList && stats.rejectedRefundsList.length > 0}
		<div class="card" style="margin-top: 1.5rem; border-left: 3px solid var(--danger);">
			<div class="card-header">
				<span>已驳回退款(需回查)</span>
				<a href="/refunds?tab=rejected" style="font-size: 0.875rem; color: var(--danger);">查看全部</a>
			</div>
			<div class="card-body">
				<table>
					<thead>
						<tr>
							<th>退款单号</th>
							<th>会员</th>
							<th>金额</th>
							<th>驳回原因</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each stats.rejectedRefundsList as refund}
							<tr>
								<td class="text-sm">{refund.refundNo}</td>
								<td class="text-sm">{refund.memberName}</td>
								<td>¥{refund.refundAmount.toFixed(2)}</td>
								<td class="text-sm">{refund.rejectReason || '-'}</td>
								<td><a href="/refunds?tab=rejected" class="btn btn-sm btn-outline">去处理</a></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<div class="card" style="margin-top: 1.5rem;">
		<div class="card-header">最近操作记录</div>
		<div class="card-body">
			<div class="timeline">
				{#each recentLogs.slice(0, 15) as log}
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
								<div class="text-sm text-gray-500 mt-1">备注: {log.remark}</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
