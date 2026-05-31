<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getTraceChain, getProjects, getWorkers } from '$lib/stores';
	import type { TraceChain, Project, User } from '$lib/types';

	let traces: TraceChain[] = [];
	let projects: Project[] = [];
	let workers: User[] = [];
	let loading = true;

	let filterProject = 0;
	let filterWorker = 0;
	let filterStatus = '';

	async function loadData() {
		try {
			[traces, projects, workers] = await Promise.all([
				getTraceChain(),
				getProjects(),
				getWorkers()
			]);
		} finally {
			loading = false;
		}
	}

	$: filteredTraces = traces.filter((t) => {
		if (filterProject > 0 && t.projectId !== filterProject) return false;
		if (filterWorker > 0 && t.workerName !== workers.find(w => w.ID === filterWorker)?.Name) return false;
		if (filterStatus) {
			if (filterStatus === 'issue' &&
				(t.checkInStatus === 'normal' && t.inspectionResult !== 'fail' && !t.hasRectification)) {
				return false;
			}
			if (filterStatus === 'followup' && !t.hasFollowUp) return false;
			if (filterStatus === 'missing' && t.checkInStatus !== 'missing') return false;
		}
		return true;
	});

	onMount(() => {
		loadData();
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'normal': case 'pass': case 'verified': case 'approved': case 'issued':
				return 'background: #f0fff4; color: #22543d';
			case 'late': case 'pending': case 'assigned': case 'in_progress': case 'done':
				return 'background: #fffaf0; color: #7c2d12';
			case 'missing': case 'fail': case 'rejected': case 'exception':
				return 'background: #fff5f5; color: #742a2a';
			default:
				return 'background: #f7fafc; color: #2d3748';
		}
	};

	const getStatusText = (status: string) => {
		const map: Record<string, string> = {
			normal: '正常', late: '迟到', early: '早退', missing: '未打卡', exception: '异常',
			pass: '通过', fail: '不合格', pending: '待处理', approved: '已批准',
			rejected: '已拒绝', issued: '已发放', open: '待分配', assigned: '待处理',
			in_progress: '处理中', done: '待验证', verified: '已验证'
		};
		return map[status] || status;
	};

	function getFollowUpTypeLabel(type: string) {
		const labels: Record<string, string> = {
			rectification: '整改回访',
			complaint: '客户投诉',
			renewal: '续约提醒'
		};
		return labels[type] || type;
	}
</script>

<Layout title="连续回查面板" activeMenu="trace">
	<div class="filters">
		<select bind:value={filterProject}>
			<option value={0}>全部项目</option>
			{#each projects as p}
				<option value={p.ID}>{p.Name}</option>
			{/each}
		</select>
		<select bind:value={filterWorker}>
			<option value={0}>全部员工</option>
			{#each workers as w}
				<option value={w.ID}>{w.Name}</option>
			{/each}
		</select>
		<select bind:value={filterStatus}>
			<option value="">全部状态</option>
			<option value="issue">仅异常</option>
			<option value="missing">漏打卡</option>
			<option value="followup">有回访</option>
		</select>
		<button class="refresh-btn" on:click={loadData}>刷新</button>
	</div>

	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="trace-list">
			{#each filteredTraces as trace}
				<div class="trace-card">
					<div class="trace-header">
						<span class="date">{new Date(trace.shiftDate).toLocaleDateString()}</span>
						<span class="project">{trace.projectName}</span>
						<span class="worker">{trace.workerName}</span>
					</div>
					<div class="trace-chain">
						<div class="chain-node" style={getStatusColor(trace.checkInStatus)}>
							<div class="node-label">打卡</div>
							<div class="node-value">{getStatusText(trace.checkInStatus)}</div>
						</div>
						<div class="chain-arrow">→</div>
						<div class="chain-node" style={getStatusColor(trace.inspectionResult || 'pending')}>
							<div class="node-label">质检</div>
							<div class="node-value">{trace.inspectionResult ? getStatusText(trace.inspectionResult) : '待检'}</div>
						</div>
						<div class="chain-arrow">→</div>
						<div class="chain-node" style={getStatusColor(trace.hasRectification ? trace.rectificationStatus : 'normal')}>
							<div class="node-label">整改</div>
							<div class="node-value">{trace.hasRectification ? getStatusText(trace.rectificationStatus) : '无'}</div>
						</div>
						<div class="chain-arrow">→</div>
						<div class="chain-node" style={getStatusColor(trace.materialStatus || 'pending')}>
							<div class="node-label">耗材</div>
							<div class="node-value">{trace.materialStatus ? getStatusText(trace.materialStatus) : '无'}</div>
						</div>
						<div class="chain-arrow">→</div>
						<div class="chain-node" style={trace.hasFollowUp ? 'background: #ebf8ff; color: #2b6cb0' : 'background: #f7fafc; color: #2d3748'}>
							<div class="node-label">回访</div>
							<div class="node-value">
								{#if trace.hasFollowUp}
									{trace.followUpCount}条
								{:else}
									无
								{/if}
							</div>
							{#if trace.hasFollowUp && trace.followUpTypes.length > 0}
								<div class="followup-types">
									{#each trace.followUpTypes as ft}
										<span class="fu-type-tag">{getFollowUpTypeLabel(ft)}</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					{#if trace.checkInStatus === 'missing' || trace.checkInStatus === 'late' || trace.checkInStatus === 'exception' || trace.inspectionResult === 'fail'}
						<div class="alert-badge">⚠ 存在异常</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.filters {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
		align-items: center;
	}

	.filters select {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 14px;
		background: white;
	}

	.refresh-btn {
		padding: 8px 16px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.trace-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.trace-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		position: relative;
	}

	.trace-header {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid #e2e8f0;
	}

	.date { font-weight: 600; color: #2d3748; }
	.project { color: #4a5568; }
	.worker { color: #667eea; font-weight: 500; }

	.trace-chain {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		flex-wrap: wrap;
	}

	.chain-node {
		padding: 12px 20px;
		border-radius: 8px;
		min-width: 100px;
		text-align: center;
	}

	.node-label {
		font-size: 12px;
		opacity: 0.7;
		margin-bottom: 4px;
	}

	.node-value {
		font-weight: 600;
		font-size: 14px;
	}

	.chain-arrow {
		color: #a0aec0;
		font-size: 20px;
		padding-top: 12px;
	}

	.followup-types {
		margin-top: 6px;
		display: flex;
		gap: 4px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.fu-type-tag {
		font-size: 10px;
		padding: 2px 6px;
		border-radius: 3px;
		background: rgba(43, 108, 176, 0.15);
		color: #2b6cb0;
	}

	.alert-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		background: #feb2b2;
		color: #742a2a;
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}
</style>
