<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getFollowUps, createFollowUp, getProjects } from '$lib/stores';
	import type { FollowUp, Project } from '$lib/types';

	let followUps: FollowUp[] = [];
	let projects: Project[] = [];
	let loading = true;
	let showModal = false;
	let newFollowUp = {
		projectId: 0,
		type: 'renewal' as 'complaint' | 'quality' | 'renewal',
		notes: '',
		nextFollowDate: ''
	};

	onMount(async () => {
		try {
			followUps = await getFollowUps();
			projects = await getProjects();
		} finally {
			loading = false;
		}
	});

	function getTypeLabel(type: string) {
		const labels: Record<string, string> = {
			complaint: '客户投诉',
			quality: '质量回访',
			renewal: '续约提醒'
		};
		return labels[type] || type;
	}

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: '待处理',
			completed: '已完成'
		};
		return labels[status] || status;
	}

	function getTypeClass(type: string) {
		const classes: Record<string, string> = {
			complaint: 'type-complaint',
			quality: 'type-quality',
			renewal: 'type-renewal'
		};
		return classes[type] || '';
	}

	function getStatusClass(status: string) {
		const classes: Record<string, string> = {
			pending: 'status-pending',
			completed: 'status-completed'
		};
		return classes[status] || '';
	}

	async function handleCreate() {
		if (!newFollowUp.projectId || !newFollowUp.notes) return;
		await createFollowUp(newFollowUp);
		followUps = await getFollowUps();
		showModal = false;
		newFollowUp = { projectId: 0, type: 'renewal', notes: '', nextFollowDate: '' };
	}

	async function handleComplete(id: number) {
		await fetch(`http://localhost:3000/api/follow-ups/${id}/complete`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${localStorage.getItem('token')}`
			}
		});
		followUps = await getFollowUps();
	}

	$: pendingCount = followUps.filter((f) => f.status === 'pending').length;
</script>

<Layout title="回访跟踪" activeMenu="followup">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<div class="stats">
				<span class="stat-item">待处理：<strong>{pendingCount}</strong></span>
				<span class="stat-item">总计：<strong>{followUps.length}</strong></span>
			</div>
			<button class="btn-primary" on:click={() => showModal = true}>+ 新建回访</button>
		</div>

		<div class="followup-list">
			{#each followUps as fu}
				<div class="followup-card">
					<div class="followup-header">
						<div>
							<span class={`type-tag ${getTypeClass(fu.type)}`}>{getTypeLabel(fu.type)}</span>
							<span class="project-name">{fu.projectName}</span>
						</div>
						<span class={`status-tag ${getStatusClass(fu.status)}`}>{getStatusLabel(fu.status)}</span>
					</div>
					<div class="followup-body">
						<p class="notes">{fu.notes}</p>
						<div class="meta">
							{#if fu.nextFollowDate}
								<span>下次回访：{fu.nextFollowDate}</span>
							{/if}
							<span>创建时间：{new Date(fu.createdAt).toLocaleDateString('zh-CN')}</span>
						</div>
					</div>
					{#if fu.status === 'pending'}
						<div class="followup-footer">
							<button class="btn-complete" on:click={() => handleComplete(fu.id)}>标记完成</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if showModal}
		<div class="modal-overlay" on:click={() => showModal = false}>
			<div class="modal" on:click|stopPropagation>
				<h3>新建回访记录</h3>
				<div class="form-group">
					<label>选择项目</label>
					<select bind:value={newFollowUp.projectId}>
						<option value={0}>请选择</option>
						{#each projects as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label>回访类型</label>
					<select bind:value={newFollowUp.type}>
						<option value="complaint">客户投诉</option>
						<option value="quality">质量回访</option>
						<option value="renewal">续约提醒</option>
					</select>
				</div>
				<div class="form-group">
					<label>记录内容</label>
					<textarea bind:value={newFollowUp.notes} rows="4" placeholder="请输入回访内容..." />
				</div>
				<div class="form-group">
					<label>下次回访日期</label>
					<input type="date" bind:value={newFollowUp.nextFollowDate} />
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" on:click={() => showModal = false}>取消</button>
					<button class="btn-primary" on:click={handleCreate}>创建</button>
				</div>
			</div>
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

	.stats {
		display: flex;
		gap: 24px;
	}

	.stat-item {
		color: #718096;
		font-size: 14px;
	}

	.stat-item strong {
		color: #2d3748;
		font-size: 18px;
		margin-left: 4px;
	}

	.btn-primary {
		padding: 10px 20px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
	}

	.btn-primary:hover {
		background: #5a67d8;
	}

	.followup-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.followup-card {
		background: white;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.followup-header {
		padding: 12px 16px;
		background: #f7fafc;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.type-tag {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		margin-right: 12px;
	}

	.type-complaint {
		background: #fed7d7;
		color: #c53030;
	}

	.type-quality {
		background: #fefcbf;
		color: #975a16;
	}

	.type-renewal {
		background: #c6f6d5;
		color: #276749;
	}

	.project-name {
		font-weight: 600;
		color: #2d3748;
	}

	.status-tag {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
	}

	.status-pending {
		background: #fefcbf;
		color: #975a16;
	}

	.status-completed {
		background: #c6f6d5;
		color: #276749;
	}

	.followup-body {
		padding: 16px;
	}

	.notes {
		color: #4a5568;
		margin: 0 0 12px 0;
		line-height: 1.6;
	}

	.meta {
		display: flex;
		gap: 24px;
		font-size: 12px;
		color: #a0aec0;
	}

	.followup-footer {
		padding: 12px 16px;
		border-top: 1px solid #e2e8f0;
		text-align: right;
	}

	.btn-complete {
		padding: 6px 16px;
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

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: white;
		padding: 24px;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
	}

	.modal h3 {
		margin: 0 0 20px 0;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
		color: #4a5568;
	}

	.form-group select,
	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 24px;
	}

	.btn-cancel {
		padding: 10px 20px;
		background: #e2e8f0;
		color: #4a5568;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.btn-cancel:hover {
		background: #cbd5e0;
	}
</style>
