<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getMaterials, approveMaterial } from '$lib/stores';
	import type { MaterialRequisition } from '$lib/types';

	let materials: MaterialRequisition[] = [];
	let loading = true;
	let filterStatus = 'pending';

	async function loadData() {
		try {
			materials = await getMaterials();
		} finally {
			loading = false;
		}
	}

	$: filteredMaterials = materials.filter(m => !filterStatus || m.status === filterStatus);

	async function handleApprove(id: number, status: string) {
		const remark = status === 'rejected' ? prompt('请输入拒绝原因：') : '';
		try {
			await approveMaterial(id, status, remark);
			loadData();
		} catch (e) {
			alert('操作失败');
		}
	}

	onMount(() => loadData());

	const getStatusText = (s: string) => ({ pending: '待审批', approved: '已批准', rejected: '已拒绝', issued: '已发放' }[s] || s);
	const getStatusColor = (s: string) =>
		s === 'approved' || s === 'issued' ? 'color: #48bb78' :
		s === 'rejected' ? 'color: #e53e3e' : 'color: #ed8936';
</script>

<Layout title="耗材审批" activeMenu="material">
	<div class="filter-bar">
		<select bind:value={filterStatus}>
			<option value="">全部</option>
			<option value="pending">待审批</option>
			<option value="approved">已批准</option>
			<option value="rejected">已拒绝</option>
		</select>
	</div>

	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="material-list">
			{#each filteredMaterials as m}
				<div class="material-card">
					<div class="material-header">
						<div>
							<span class="requester">{m.requester.name}</span>
							<span class="time">{new Date(m.requestTime).toLocaleString()}</span>
						</div>
						<span style={getStatusColor(m.status)} class="status">{getStatusText(m.status)}</span>
					</div>
					<div class="material-items">
						{@const items = JSON.parse(m.items || '[]')}
						{#each items as item}
							<span class="item-tag">{item.name} x{item.qty}{item.unit}</span>
						{/each}
					</div>
					{#if m.status === 'pending'}
						<div class="actions">
							<button class="approve-btn" on:click={() => handleApprove(m.id, 'approved')}>批准</button>
							<button class="reject-btn" on:click={() => handleApprove(m.id, 'rejected')}>拒绝</button>
							<button class="issue-btn" on:click={() => handleApprove(m.id, 'issued')}>已发放</button>
						</div>
					{/if}
					{#if m.remark}
						<p class="remark">备注：{m.remark}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.filter-bar {
		margin-bottom: 20px;
	}
	.filter-bar select {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
	}
	.material-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.material-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	.material-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	.requester { font-weight: 600; margin-right: 12px; }
	.time { color: #718096; font-size: 14px; }
	.status { font-weight: 500; }
	.material-items {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
	}
	.item-tag {
		padding: 4px 10px;
		background: #edf2f7;
		border-radius: 4px;
		font-size: 13px;
	}
	.actions {
		display: flex;
		gap: 10px;
	}
	.approve-btn {
		padding: 8px 16px;
		background: #48bb78;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	.reject-btn {
		padding: 8px 16px;
		background: #e53e3e;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	.issue-btn {
		padding: 8px 16px;
		background: #4299e1;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	.remark {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid #e2e8f0;
		color: #718096;
		font-size: 14px;
	}
</style>
