<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getTraceChain, getProjects } from '$lib/stores';
	import type { TraceChain, Project } from '$lib/types';

	let traces: TraceChain[] = [];
	let projects: Project[] = [];
	let loading = true;
	let selectedProject: number | null = null;
	let filterStatus = 'all';

	onMount(async () => {
		try {
			traces = await getTraceChain();
			projects = await getProjects();
		} finally {
			loading = false;
		}
	});

	function getCheckInStatusLabel(status: string) {
		const labels: Record<string, string> = {
			normal: '正常',
			late: '迟到',
			early: '早退',
			missing: '未打卡',
			modified: '已修正'
		};
		return labels[status] || status;
	}

	function getCheckInStatusClass(status: string) {
		const classes: Record<string, string> = {
			normal: 'status-success',
			late: 'status-warning',
			early: 'status-warning',
			missing: 'status-danger',
			modified: 'status-info'
		};
		return classes[status] || '';
	}

	function getInspectionResultLabel(result: string) {
		const labels: Record<string, string> = {
			pass: '合格',
			fail: '不合格'
		};
		return labels[result] || '待质检';
	}

	function getInspectionResultClass(result: string) {
		const classes: Record<string, string> = {
			pass: 'status-success',
			fail: 'status-danger'
		};
		return classes[result] || 'status-pending';
	}

	function getRectStatusLabel(status: string) {
		const labels: Record<string, string> = {
			open: '待分配',
			assigned: '待处理',
			in_progress: '整改中',
			done: '待验证',
			verified: '已验证'
		};
		return labels[status] || status;
	}

	function getRectStatusClass(status: string) {
		const classes: Record<string, string> = {
			open: 'status-danger',
			assigned: 'status-danger',
			in_progress: 'status-warning',
			done: 'status-info',
			verified: 'status-success'
		};
		return classes[status] || '';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	$: filteredTraces = traces.filter((t) => {
		if (selectedProject && t.projectId !== selectedProject) return false;
		if (filterStatus === 'all') return true;
		if (filterStatus === 'issues') {
			return t.checkInStatus === 'missing' || t.checkInStatus === 'late' || t.inspectionResult === 'fail' || t.hasRectification;
		}
		if (filterStatus === 'missing') return t.checkInStatus === 'missing';
		if (filterStatus === 'rect') return t.hasRectification;
		if (filterStatus === 'followup') return t.hasFollowUp;
		return true;
	});
</script>

<Layout title="连续回查" activeMenu="trace">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<div class="filters">
				<select bind:value={selectedProject} on:change={() => selectedProject = selectedProject || null}>
					<option value={0}>全部项目</option>
					{#each projects as p}
						<option value={p.ID}>{p.Name}</option>
					{/each}
				</select>
				<select bind:value={filterStatus}>
					<option value="all">全部状态</option>
					<option value="issues">异常记录</option>
					<option value="missing">漏打卡</option>
					<option value="rect">待整改</option>
					<option value="followup">有回访</option>
				</select>
			</div>
			<span class="total">共 {filteredTraces.length} 条记录</span>
		</div>

		<div class="trace-table">
			<div class="table-header">
				<span class="col-date">日期</span>
				<span class="col-project">项目</span>
				<span class="col-worker">员工</span>
				<span class="col-checkin">打卡状态</span>
				<span class="col-inspect">质检结果</span>
				<span class="col-rect">整改状态</span>
				<span class="col-followup">回访</span>
			</div>
			{#each filteredTraces as trace}
				<div class="table-row">
					<span class="col-date">{formatDate(trace.shiftDate)}</span>
					<span class="col-project">{trace.projectName}</span>
					<span class="col-worker">{trace.workerName}</span>
					<span class="col-checkin">
						<span class={`tag ${getCheckInStatusClass(trace.checkInStatus)}`}>
							{getCheckInStatusLabel(trace.checkInStatus)}
						</span>
					</span>
					<span class="col-inspect">
						<span class={`tag ${getInspectionResultClass(trace.inspectionResult)}`}>
							{getInspectionResultLabel(trace.inspectionResult)}
						</span>
					</span>
					<span class="col-rect">
						{#if trace.hasRectification}
							<span class={`tag ${getRectStatusClass(trace.rectificationStatus)}`}>
								{getRectStatusLabel(trace.rectificationStatus)}
							</span>
						{:else}
							<span class="tag status-empty">-</span>
						{/if}
					</span>
					<span class="col-followup">
						{#if trace.hasFollowUp}
							<span class="tag status-info" title={trace.followUpTypes.join(', ')}>
								{trace.followUpCount} 条
							</span>
						{:else}
							<span class="tag status-empty">-</span>
						{/if}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.filters {
		display: flex;
		gap: 12px;
	}

	select {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 14px;
	}

	.total {
		color: #718096;
		font-size: 14px;
	}

	.trace-table {
		background: white;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.table-header {
		display: grid;
		grid-template-columns: 120px 1fr 100px 100px 100px 100px 80px;
		gap: 16px;
		padding: 12px 16px;
		background: #f7fafc;
		border-bottom: 1px solid #e2e8f0;
		font-weight: 600;
		font-size: 13px;
		color: #4a5568;
	}

	.table-row {
		display: grid;
		grid-template-columns: 120px 1fr 100px 100px 100px 100px 80px;
		gap: 16px;
		padding: 12px 16px;
		border-bottom: 1px solid #e2e8f0;
		align-items: center;
		font-size: 14px;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.table-row:hover {
		background: #f7fafc;
	}

	.tag {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		display: inline-block;
	}

	.status-success {
		background: #c6f6d5;
		color: #276749;
	}

	.status-warning {
		background: #fefcbf;
		color: #975a16;
	}

	.status-danger {
		background: #fed7d7;
		color: #c53030;
	}

	.status-info {
		background: #bee3f8;
		color: #2b6cb0;
	}

	.status-pending {
		background: #e2e8f0;
		color: #718096;
	}

	.status-empty {
		background: #f7fafc;
		color: #a0aec0;
	}

	.col-date { color: #718096; }
	.col-project { font-weight: 500; }
	.col-worker { color: #4a5568; }

	.loading {
		text-align: center;
		padding: 40px;
		color: #718096;
	}
</style>
