<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getDashboardStats, getTraceChain } from '$lib/stores';
	import type { DashboardStats, TraceChain } from '$lib/types';

	let stats: DashboardStats | null = null;
	let recentTraces: TraceChain[] = [];
	let loading = true;

	async function loadData() {
		try {
			stats = await getDashboardStats();
			recentTraces = await getTraceChain();
			recentTraces = recentTraces.slice(0, 5);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadData();
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'normal':
			case 'pass':
			case 'verified':
			case 'approved':
			case 'issued':
				return 'color: #48bb78';
			case 'late':
			case 'pending':
			case 'assigned':
				return 'color: #ed8936';
			case 'missing':
			case 'fail':
			case 'rejected':
			case 'exception':
				return 'color: #e53e3e';
			default:
				return 'color: #718096';
		}
	};

	const getStatusText = (status: string) => {
		const map: Record<string, string> = {
			normal: '正常',
			late: '迟到',
			early: '早退',
			missing: '未打卡',
			exception: '异常',
			pass: '通过',
			fail: '不合格',
			pending: '待处理',
			approved: '已批准',
			rejected: '已拒绝',
			issued: '已发放',
			open: '待分配',
			assigned: '待处理',
			in_progress: '处理中',
			done: '待验证',
			verified: '已验证'
		};
		return map[status] || status;
	};
</script>

<Layout title="数据看板" activeMenu="dashboard">
	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-value">{stats?.totalShifts || 0}</div>
				<div class="stat-label">总排班数</div>
			</div>
			<div class="stat-card warning">
				<div class="stat-value">{stats?.lateCheckIns || 0}</div>
				<div class="stat-label">迟到记录</div>
			</div>
			<div class="stat-card danger">
				<div class="stat-value">{stats?.missingCheckIns || 0}</div>
				<div class="stat-label">漏打卡</div>
			</div>
			<div class="stat-card warning">
				<div class="stat-value">{stats?.pendingRects || 0}</div>
				<div class="stat-label">待整改</div>
			</div>
			<div class="stat-card warning">
				<div class="stat-value">{stats?.pendingMaterials || 0}</div>
				<div class="stat-label">待批耗材</div>
			</div>
			<div class="stat-card warning">
				<div class="stat-value">{stats?.pendingFollowUps || 0}</div>
				<div class="stat-label">待回访</div>
			</div>
			<div class="stat-card primary">
				<div class="stat-value">{stats?.avgInspectionScore?.toFixed(1) || '0'}</div>
				<div class="stat-label">平均质检分</div>
			</div>
		</div>

		<div class="section">
			<h2 class="section-title">近期班次追踪</h2>
			<div class="table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>日期</th>
							<th>项目</th>
							<th>员工</th>
							<th>打卡状态</th>
							<th>质检结果</th>
							<th>整改状态</th>
							<th>耗材状态</th>
							<th>回访</th>
						</tr>
					</thead>
					<tbody>
						{#each recentTraces as trace}
							<tr>
								<td>{new Date(trace.shiftDate).toLocaleDateString()}</td>
								<td>{trace.projectName}</td>
								<td>{trace.workerName}</td>
								<td style={getStatusColor(trace.checkInStatus)}>
									{getStatusText(trace.checkInStatus)}
								</td>
								<td style={getStatusColor(trace.inspectionResult)}>
									{trace.inspectionResult ? getStatusText(trace.inspectionResult) : '-'}
								</td>
								<td style={getStatusColor(trace.rectificationStatus)}>
									{trace.hasRectification ? getStatusText(trace.rectificationStatus) : '-'}
								</td>
								<td style={getStatusColor(trace.materialStatus)}>
									{trace.materialStatus ? getStatusText(trace.materialStatus) : '-'}
								</td>
								<td>
									{#if trace.hasFollowUp}
										<span style="color: #4299e1">{trace.followUpCount} 条 ({trace.followUpTypes?.join('/') || '-'})</span>
									{:else}
										-
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}
</Layout>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		border-left: 4px solid #48bb78;
	}

	.stat-card.warning {
		border-left-color: #ed8936;
	}

	.stat-card.danger {
		border-left-color: #e53e3e;
	}

	.stat-card.primary {
		border-left-color: #667eea;
	}

	.stat-value {
		font-size: 32px;
		font-weight: 700;
		color: #1a202c;
		margin-bottom: 4px;
	}

	.stat-label {
		font-size: 14px;
		color: #718096;
	}

	.section {
		background: white;
		border-radius: 10px;
		padding: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 16px;
		color: #2d3748;
	}

	.table-container {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th,
	.data-table td {
		padding: 12px 16px;
		text-align: left;
		border-bottom: 1px solid #e2e8f0;
	}

	.data-table th {
		background: #f7fafc;
		font-weight: 600;
		color: #4a5568;
		font-size: 13px;
	}

	.data-table tr:hover td {
		background: #f7fafc;
	}
</style>
