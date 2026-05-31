<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getRectifications, completeRectification, currentUser } from '$lib/stores';
	import type { Rectification } from '$lib/types';

	let rectifications: Rectification[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const userId = $currentUser?.ID;
			if (userId) {
				rectifications = await getRectifications({ assigneeId: userId });
			}
		} finally {
			loading = false;
		}
	});

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			open: '待分配',
			assigned: '待整改',
			in_progress: '整改中',
			done: '待验证',
			verified: '已通过'
		};
		return labels[status] || status;
	}

	function getStatusClass(status: string) {
		const classes: Record<string, string> = {
			open: 'status-open',
			assigned: 'status-assigned',
			in_progress: 'status-progress',
			done: 'status-done',
			verified: 'status-verified'
		};
		return classes[status] || '';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	async function handleComplete(rect: Rectification) {
		await completeRectification(rect.ID, '已按要求完成整改');
		const userId = $currentUser?.ID;
		if (userId) rectifications = await getRectifications({ assigneeId: userId });
	}

	$: pendingCount = rectifications.filter((r) => r.Status === 'assigned' || r.Status === 'in_progress').length;
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
							<span class={`status-tag ${getStatusClass(rect.Status)}`}>{getStatusLabel(rect.Status)}</span>
							<span class="deadline">截止：{formatDate(rect.Deadline)}</span>
						</div>
					</div>
					<div class="rect-body">
						<div class="section">
							<span class="section-title">整改要求</span>
							<p class="section-content">{rect.Description}</p>
						</div>
						{#if rect.Actions}
							<div class="section">
								<span class="section-title">整改指引</span>
								<p class="section-content">{rect.Actions}</p>
							</div>
						{/if}
						{#if rect.CompletedNote}
							<div class="section">
								<span class="section-title">整改结果</span>
								<p class="section-content">{rect.CompletedNote}</p>
							</div>
						{/if}
						{#if rect.VerifiedBy}
							<div class="section">
								<span class="section-title">验证意见</span>
								<p class="section-content">{rect.VerifyNote || '验证通过'}</p>
							</div>
						{/if}
					</div>
					{#if rect.Status === 'assigned' || rect.Status === 'in_progress'}
						<div class="rect-footer">
							<button class="btn-complete" on:click={() => handleComplete(rect)}>提交整改</button>
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

	.stat-card.warning { border-left: 4px solid #ed8936; }
	.stat-card.total { border-left: 4px solid #667eea; }

	.stat-number {
		display: block;
		font-size: 28px;
		font-weight: 700;
		color: #2d3748;
	}

	.stat-label { font-size: 13px; color: #718096; }

	.rect-list { display: flex; flex-direction: column; gap: 16px; }

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

	.status-tag { padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-right: 12px; }
	.status-open { background: #e2e8f0; color: #718096; }
	.status-assigned { background: #fed7d7; color: #c53030; }
	.status-progress { background: #fefcbf; color: #975a16; }
	.status-done { background: #bee3f8; color: #2b6cb0; }
	.status-verified { background: #c6f6d5; color: #276749; }

	.deadline { font-size: 12px; color: #c53030; }

	.rect-body { padding: 16px; }
	.section { margin-bottom: 12px; }
	.section:last-child { margin-bottom: 0; }
	.section-title { display: block; font-size: 12px; color: #a0aec0; margin-bottom: 4px; }
	.section-content { margin: 0; color: #2d3748; line-height: 1.6; }

	.rect-footer {
		padding: 12px 16px;
		border-top: 1px solid #e2e8f0;
		text-align: right;
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

	.btn-complete:hover { background: #38a169; }
	.loading { text-align: center; padding: 40px; color: #718096; }
</style>
