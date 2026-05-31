<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getMyShifts } from '$lib/stores';
	import type { Shift, Rectification } from '$lib/types';

	let shifts: Shift[] = [];
	let loading = true;

	onMount(async () => {
		try {
			shifts = await getMyShifts();
		} finally {
			loading = false;
		}
	});

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: '待整改',
			in_progress: '整改中',
			completed: '待验证',
			verified: '已通过'
		};
		return labels[status] || status;
	}

	function getStatusClass(status: string) {
		const classes: Record<string, string> = {
			pending: 'status-pending',
			in_progress: 'status-progress',
			completed: 'status-completed',
			verified: 'status-verified'
		};
		return classes[status] || '';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	async function handleStart(rectId: number) {
		await fetch(`http://localhost:3000/api/rectifications/${rectId}/start`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('token')}`
			}
		});
		shifts = await getMyShifts();
	}

	async function handleComplete(rectId: number) {
		await fetch(`http://localhost:3000/api/rectifications/${rectId}/complete`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('token')}`
			},
			body: JSON.stringify({ result: '已按要求完成整改' })
		});
		shifts = await getMyShifts();
	}

	$: rectifications = [] as (Rectification & { shiftDate: string; area: string })[];
	$: {
		const result: (Rectification & { shiftDate: string; area: string })[] = [];
		shifts.forEach((s) => {
			s.inspections?.forEach((i: any) => {
				if (i.rectification) {
					result.push({
						...i.rectification,
						shiftDate: s.date,
						area: s.area
					});
				}
			});
		});
		rectifications = result;
	}

	$: pendingCount = rectifications.filter((r) => r.status === 'pending' || r.status === 'in_progress').length;
</script>

<Layout title="整改任务" activeMenu="rect">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="stats">
			<div class="stat-card warning">
				<span class="stat-number">{pendingCount}</span>
				<span class="stat-label">待处理</span>
			</div>
			<div class="stat-card total">
				<span class="stat-number">{rectifications.length}</span>
				<span class="stat-label">总计</span>
			</div>
		</div>

		<div class="rect-list">
			{#each rectifications as rect}
				<div class="rect-card">
					<div class="rect-header">
						<div>
							<span class={`status-tag ${getStatusClass(rect.status)}`}>{getStatusLabel(rect.status)}</span>
							<span class="shift-info">{formatDate(rect.shiftDate)} {rect.area}</span>
						</div>
						{#if rect.deadline}
							<span class="deadline">截止：{formatDate(rect.deadline)}</span>
						{/if}
					</div>
					<div class="rect-body">
						<div class="section">
							<span class="section-title">整改要求</span>
							<p class="section-content">{rect.requirements}</p>
						</div>
						{#if rect.result}
							<div class="section">
								<span class="section-title">整改结果</span>
								<p class="section-content">{rect.result}</p>
							</div>
						{/if}
						{#if rect.verifiedBy}
							<div class="section">
								<span class="section-title">验证意见</span>
								<p class="section-content">{rect.verificationNotes || '验证通过'}</p>
							</div>
						{/if}
					</div>
					{#if rect.status === 'pending' || rect.status === 'in_progress'}
						<div class="rect-footer">
							{#if rect.status === 'pending'}
								<button class="btn-start" on:click={() => handleStart(rect.id)}>开始整改</button>
							{:else if rect.status === 'in_progress'}
								<button class="btn-complete" on:click={() => handleComplete(rect.id)}>提交整改</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.stats {
		display: flex;
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-card {
		background: white;
		padding: 20px 24px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		min-width: 120px;
	}

	.stat-card.warning {
		border-left: 4px solid #ed8936;
	}

	.stat-card.total {
		border-left: 4px solid #667eea;
	}

	.stat-number {
		display: block;
		font-size: 28px;
		font-weight: 700;
		color: #2d3748;
	}

	.stat-label {
		font-size: 13px;
		color: #718096;
	}

	.rect-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.rect-card {
		background: white;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.rect-header {
		padding: 12px 16px;
		background: #f7fafc;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status-tag {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		margin-right: 12px;
	}

	.status-pending {
		background: #fed7d7;
		color: #c53030;
	}

	.status-progress {
		background: #fefcbf;
		color: #975a16;
	}

	.status-completed {
		background: #bee3f8;
		color: #2b6cb0;
	}

	.status-verified {
		background: #c6f6d5;
		color: #276749;
	}

	.shift-info {
		font-size: 14px;
		color: #4a5568;
	}

	.deadline {
		font-size: 12px;
		color: #c53030;
	}

	.rect-body {
		padding: 16px;
	}

	.section {
		margin-bottom: 12px;
	}

	.section:last-child {
		margin-bottom: 0;
	}

	.section-title {
		display: block;
		font-size: 12px;
		color: #a0aec0;
		margin-bottom: 4px;
	}

	.section-content {
		margin: 0;
		color: #2d3748;
		line-height: 1.6;
	}

	.rect-footer {
		padding: 12px 16px;
		border-top: 1px solid #e2e8f0;
		text-align: right;
	}

	.btn-start {
		padding: 8px 20px;
		background: #ed8936;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}

	.btn-start:hover {
		background: #dd6b20;
	}

	.btn-complete {
		padding: 8px 20px;
		background: #48bb78;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}

	.btn-complete:hover {
		background: #38a169;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #718096;
	}
</style>
