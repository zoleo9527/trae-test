<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getRectifications, verifyRectification } from '$lib/stores';
	import type { Rectification } from '$lib/types';

	let rects: Rectification[] = [];
	let loading = true;
	let filterStatus = '';

	async function loadData() {
		try {
			rects = await getRectifications();
		} finally {
			loading = false;
		}
	}

	$: filteredRects = filterStatus ? rects.filter(r => r.status === filterStatus) : rects;

	async function handleVerify(id: number) {
		const note = prompt('验证意见：');
		if (note === null) return;
		try {
			await verifyRectification(id, note || '已验证');
			loadData();
		} catch (e) {
			alert('操作失败');
		}
	}

	onMount(() => loadData());

	const getStatusText = (s: string) => ({ open: '待分配', assigned: '待处理', in_progress: '处理中', done: '待验证', verified: '已验证' }[s] || s);
	const getStatusColor = (s: string) =>
		s === 'verified' ? 'background: #f0fff4; color: #22543d' :
		s === 'done' ? 'background: #fffaf0; color: #7c2d12' :
		'background: #fff5f5; color: #742a2a';
</script>

<Layout title="整改追踪" activeMenu="rect">
	<div class="filter-bar">
		<select bind:value={filterStatus}>
			<option value="">全部状态</option>
			<option value="open">待分配</option>
			<option value="assigned">待处理</option>
			<option value="in_progress">处理中</option>
			<option value="done">待验证</option>
			<option value="verified">已验证</option>
		</select>
	</div>

	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="rect-list">
			{#each filteredRects as r}
				<div class="rect-card">
					<div class="rect-header">
						<span class="status" style={getStatusColor(r.status)}>{getStatusText(r.status)}</span>
						<span class="deadline">截止: {new Date(r.deadline).toLocaleDateString()}</span>
					</div>
					<div class="rect-info">
						<span class="assignee">负责人: {r.assignee.name}</span>
					</div>
					<p class="desc">{r.description}</p>
					{#if r.completedNote}
						<div class="completed">
							<strong>完成说明：</strong>{r.completedNote}
						</div>
					{/if}
					{#if r.status === 'done'}
						<button class="verify-btn" on:click={() => handleVerify(r.id)}>验证通过</button>
					{/if}
					{#if r.verifyNote}
						<div class="verify-note">
							<strong>验证意见：</strong>{r.verifyNote}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.filter-bar { margin-bottom: 20px; }
	.filter-bar select {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
	}
	.rect-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.rect-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	.rect-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.status {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
	}
	.deadline { color: #718096; font-size: 14px; }
	.rect-info { margin-bottom: 8px; }
	.assignee { font-weight: 500; }
	.desc {
		color: #4a5568;
		margin-bottom: 12px;
		line-height: 1.5;
	}
	.completed, .verify-note {
		padding: 10px;
		background: #f7fafc;
		border-radius: 6px;
		margin-top: 10px;
		font-size: 14px;
	}
	.verify-note { background: #f0fff4; }
	.verify-btn {
		margin-top: 12px;
		padding: 8px 20px;
		background: #48bb78;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
</style>
