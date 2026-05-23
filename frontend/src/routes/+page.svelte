<script>
	import { onMount } from 'svelte';
	import { AlertCircle, CheckCircle, Clock, XCircle, Eye, TrendingUp } from 'lucide-svelte';
	import { getHeaders } from '$lib/stores';

	let defects = [];
	let loading = true;

	async function loadDefects() {
		try {
			const res = await fetch('http://localhost:8080/api/defects', {
				headers: getHeaders()
			});
			defects = await res.json();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadDefects();
	});

	$: pendingCount = defects.filter(d => d.status === 'pending').length;
	$: rejectedCount = defects.filter(d => d.status === 'rejected').length;
	$: needReviewCount = defects.filter(d => d.status === 'need_review' || d.status === 'pending_review').length;
	$: inProgressCount = defects.filter(d => d.status === 'in_progress').length;
	$: closedCount = defects.filter(d => d.status === 'closed').length;
	$: totalDowntime = defects.reduce((sum, d) => sum + (d.downtime_minutes || 0), 0);

	function formatTime(minutes) {
		if (minutes < 60) return `${minutes}分钟`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
	}
</script>

<div class="dashboard">
	<header class="page-header">
		<div>
			<h1>运维看板</h1>
			<p class="subtitle">实时监控缺陷处理进度与设备运行状态</p>
		</div>
		<div class="header-actions">
			<a href="/defects" class="btn btn-primary">
				<AlertCircle size={18} />
				查看全部缺陷
			</a>
		</div>
	</header>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="stats-grid">
			<div class="stat-card pending">
				<div class="stat-icon">
					<Clock size={24} />
				</div>
				<div class="stat-content">
					<div class="stat-value">{pendingCount}</div>
					<div class="stat-label">待处理</div>
				</div>
			</div>
			<div class="stat-card rejected">
				<div class="stat-icon">
					<XCircle size={24} />
				</div>
				<div class="stat-content">
					<div class="stat-value">{rejectedCount}</div>
					<div class="stat-label">已驳回</div>
				</div>
			</div>
			<div class="stat-card review">
				<div class="stat-icon">
					<Eye size={24} />
				</div>
				<div class="stat-content">
					<div class="stat-value">{needReviewCount}</div>
					<div class="stat-label">需回查</div>
				</div>
			</div>
			<div class="stat-card progress">
				<div class="stat-icon">
					<TrendingUp size={24} />
				</div>
				<div class="stat-content">
					<div class="stat-value">{inProgressCount}</div>
					<div class="stat-label">处理中</div>
				</div>
			</div>
		</div>

		<div class="content-grid">
			<div class="panel">
				<div class="panel-header">
					<h2>待处理缺陷</h2>
					<a href="/defects?status=pending" class="link">查看全部</a>
				</div>
				<div class="defect-list">
					{#each defects.filter(d => d.status === 'pending').slice(0, 5) as defect}
						<a href={`/defects/${defect.id}`} class="defect-item">
							<div class="defect-info">
								<span class="priority priority-{defect.priority}">{defect.priority}</span>
								<span class="defect-title">{defect.title}</span>
							</div>
							<div class="defect-meta">
								<span>{defect.location}</span>
								<span>{new Date(defect.created_at).toLocaleDateString()}</span>
							</div>
						</a>
					{:else}
						<div class="empty">暂无待处理缺陷</div>
					{/each}
				</div>
			</div>

			<div class="panel">
				<div class="panel-header">
					<h2>需回查缺陷</h2>
					<a href="/defects?status=need_review" class="link">查看全部</a>
				</div>
				<div class="defect-list">
					{#each defects.filter(d => d.status === 'need_review' || d.status === 'pending_review').slice(0, 5) as defect}
						<a href={`/defects/${defect.id}`} class="defect-item">
							<div class="defect-info">
								<span class="status-badge status-{defect.status}">
									{defect.status === 'need_review' ? '需回查' : '待审核'}
								</span>
								<span class="defect-title">{defect.title}</span>
								{#if defect.last_review_result}
									<span class="review-tag result-{defect.last_review_result}">
										{defect.last_review_result === 'pass' ? '✓ 通过' : '✗ 不通过'}
									</span>
								{/if}
							</div>
							<div class="defect-meta">
								<span>处理人: {defect.assignee_name || '未分配'}</span>
								<span>{new Date(defect.updated_at).toLocaleDateString()}</span>
							</div>
						</a>
					{:else}
						<div class="empty">暂无需回查缺陷</div>
					{/each}
				</div>
			</div>

			<div class="panel">
				<div class="panel-header">
					<h2>已驳回缺陷</h2>
					<a href="/defects?status=rejected" class="link">查看全部</a>
				</div>
				<div class="defect-list">
					{#each defects.filter(d => d.status === 'rejected').slice(0, 5) as defect}
						<a href={`/defects/${defect.id}`} class="defect-item">
							<div class="defect-info">
								<span class="status-badge status-rejected">已驳回</span>
								<span class="defect-title">{defect.title}</span>
								{#if defect.last_review_result}
									<span class="review-tag result-{defect.last_review_result}">
										{defect.last_review_result === 'pass' ? '✓ 通过' : '✗ 不通过'}
									</span>
								{/if}
							</div>
							<div class="defect-meta">
								<span>驳回人: {defect.reporter_name}</span>
								<span>{new Date(defect.updated_at).toLocaleDateString()}</span>
							</div>
						</a>
					{:else}
						<div class="empty">暂无已驳回缺陷</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="summary-panel">
			<div class="summary-item">
				<div class="summary-label">累计停机时长</div>
				<div class="summary-value highlight">{formatTime(totalDowntime)}</div>
			</div>
			<div class="summary-item">
				<div class="summary-label">已关闭工单</div>
				<div class="summary-value">{closedCount}</div>
			</div>
			<div class="summary-item">
				<div class="summary-label">工单总数</div>
				<div class="summary-value">{defects.length}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.dashboard {
		padding: 24px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 4px 0;
	}

	.subtitle {
		color: #64748b;
		margin: 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		border: none;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.loading {
		text-align: center;
		padding: 48px;
		color: #64748b;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 16px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.stat-icon {
		width: 48px;
		height: 48px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-card.pending .stat-icon {
		background: #fef3c7;
		color: #d97706;
	}

	.stat-card.rejected .stat-icon {
		background: #fee2e2;
		color: #dc2626;
	}

	.stat-card.review .stat-icon {
		background: #dbeafe;
		color: #2563eb;
	}

	.stat-card.progress .stat-icon {
		background: #dcfce7;
		color: #16a34a;
	}

	.stat-value {
		font-size: 28px;
		font-weight: 700;
		color: #1e293b;
		line-height: 1;
		margin-bottom: 4px;
	}

	.stat-label {
		color: #64748b;
		font-size: 14px;
	}

	.content-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}

	.panel {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.panel-header {
		padding: 16px 20px;
		border-bottom: 1px solid #f1f5f9;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.panel-header h2 {
		font-size: 16px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.link {
		color: #2563eb;
		text-decoration: none;
		font-size: 14px;
	}

	.link:hover {
		text-decoration: underline;
	}

	.defect-list {
		padding: 8px 0;
	}

	.defect-item {
		display: block;
		padding: 12px 20px;
		text-decoration: none;
		color: inherit;
		border-bottom: 1px solid #f8fafc;
		transition: background 0.2s;
	}

	.defect-item:hover {
		background: #f8fafc;
	}

	.defect-item:last-child {
		border-bottom: none;
	}

	.defect-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}

	.priority {
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.priority-high {
		background: #fee2e2;
		color: #dc2626;
	}

	.priority-medium {
		background: #fef3c7;
		color: #d97706;
	}

	.priority-low {
		background: #dcfce7;
		color: #16a34a;
	}

	.status-badge {
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-pending_review {
		background: #dbeafe;
		color: #2563eb;
	}

	.status-need_review {
		background: #fef3c7;
		color: #d97706;
	}

	.status-rejected {
		background: #fee2e2;
		color: #dc2626;
	}

	.defect-title {
		font-weight: 500;
		color: #1e293b;
		font-size: 14px;
	}

	.defect-meta {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: #64748b;
	}

	.review-tag {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 500;
	}

	.review-tag.result-pass {
		background: #dcfce7;
		color: #16a34a;
	}

	.review-tag.result-fail {
		background: #fee2e2;
		color: #dc2626;
	}

	.empty {
		padding: 24px;
		text-align: center;
		color: #94a3b8;
		font-size: 14px;
	}

	.summary-panel {
		background: white;
		border-radius: 12px;
		padding: 20px;
		display: flex;
		gap: 48px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.summary-item {
		text-align: center;
	}

	.summary-label {
		color: #64748b;
		font-size: 14px;
		margin-bottom: 8px;
	}

	.summary-value {
		font-size: 24px;
		font-weight: 700;
		color: #1e293b;
	}

	.summary-value.highlight {
		color: #dc2626;
	}
</style>
