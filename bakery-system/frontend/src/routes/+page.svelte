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
		totalBalance: 0
	};

	let recentOrders = [];
	let recentRefunds = [];
	let recentLogs = [];

	onMount(async () => {
		const statsData = await api.getDashboardStats();
		stats = statsData;

		const activities = await api.getRecentActivities();
		recentOrders = activities.orders || [];
		recentRefunds = activities.refunds || [];
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
</script>

<div>
	<div class="stats-grid">
		<div class="stat-card warning">
			<h3>待处理订单</h3>
			<div class="value">{stats.pendingOrders}</div>
		</div>
		<div class="stat-card">
			<h3>制作中订单</h3>
			<div class="value">{stats.preparingOrders}</div>
		</div>
		<div class="stat-card warning">
			<h3>待退款复核</h3>
			<div class="value">{stats.pendingRefunds}</div>
		</div>
		<div class="stat-card danger">
			<h3>已驳回退款</h3>
			<div class="value">{stats.rejectedRefunds}</div>
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
		<div class="stat-card">
			<h3>储值余额总计</h3>
			<div class="value">¥{stats.totalBalance.toFixed(2)}</div>
		</div>
	</div>

	<div class="grid-2">
		<div class="card">
			<div class="card-header">
				<span>最近订单</span>
				<a href="/orders" style="font-size: 0.875rem; color: var(--primary);">查看全部</a>
			</div>
			<div class="card-body">
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
						{#each recentOrders as order}
							<tr>
								<td class="text-sm">{order.orderNo}</td>
								<td class="text-sm">{order.memberName}</td>
								<td>¥{order.payAmount.toFixed(2)}</td>
								<td><span class="badge {order.status}">{getOrderStatus(order.status)}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="card">
			<div class="card-header">
				<span>退款申请</span>
				<a href="/refunds" style="font-size: 0.875rem; color: var(--primary);">查看全部</a>
			</div>
			<div class="card-body">
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
						{#each recentRefunds as refund}
							<tr>
								<td class="text-sm">{refund.refundNo}</td>
								<td class="text-sm">{refund.memberName}</td>
								<td>¥{refund.refundAmount.toFixed(2)}</td>
								<td><span class="badge {refund.status}">{getRefundStatus(refund.status)}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div class="card" style="margin-top: 1.5rem;">
		<div class="card-header">最近操作记录</div>
		<div class="card-body">
			<div class="timeline">
				{#each recentLogs.slice(0, 10) as log}
					<div class="timeline-item">
						<div class="timeline-dot"></div>
						<div class="timeline-content">
							<div class="timeline-time">{formatDate(log.createdAt)}</div>
							<div class="text-sm">
								<strong>{log.operator}</strong>
								{log.relatedType === 'order' ? '订单' : '退款'}
								从 <span class="badge {log.fromStatus}">{log.fromStatus || '-'}</span>
								变更为 <span class="badge {log.toStatus}">{log.toStatus}</span>
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
