<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getMaterials, approveMaterial } from '$lib/stores';
	import type { MaterialRequisition } from '$lib/types';

	interface MaterialItem {
		name: string;
		qty: number;
		unit: string;
	}

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

	let errorMsg = '';

	interface ItemDisplay {
		labels: string[];
		isRaw: boolean;
		isEmpty: boolean;
		totalFromItems: number;
		mismatch: boolean;
	}

	function parseItems(itemsStr: string): MaterialItem[] {
		try {
			const parsed = JSON.parse(itemsStr);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	function getValidItems(items: MaterialItem[]): MaterialItem[] {
		return items.filter(i => i.name && i.name.trim() && i.qty > 0);
	}

	function formatItemsDisplay(m: MaterialRequisition): ItemDisplay {
		const itemsStr = m.Items;
		if (!itemsStr || itemsStr.trim() === '') {
			return { labels: ['⚠️ 无明细数据'], isRaw: false, isEmpty: true, totalFromItems: 0, mismatch: m.TotalQty > 0 };
		}

		const items = parseItems(itemsStr);
		const validItems = getValidItems(items);

		if (items.length > 0 && validItems.length > 0) {
			const totalFromItems = validItems.reduce((sum, i) => sum + i.qty, 0);
			return {
				labels: validItems.map(i => `${i.name} x${i.qty}${i.unit || ''}`),
				isRaw: false,
				isEmpty: false,
				totalFromItems,
				mismatch: Math.abs(totalFromItems - (m.TotalQty || 0)) > 0.01
			};
		}

		return {
			labels: [itemsStr],
			isRaw: true,
			isEmpty: false,
			totalFromItems: m.TotalQty || 0,
			mismatch: false
		};
	}

	$: filteredMaterials = materials.filter(m => !filterStatus || m.Status === filterStatus);

	async function handleApprove(id: number, status: string) {
		errorMsg = '';
		const remark = status === 'rejected' ? prompt('请输入拒绝原因：') : '';
		if (status === 'rejected' && remark === null) return;
		try {
			await approveMaterial(id, status, remark || '');
			loadData();
		} catch (e) {
			errorMsg = '操作失败，请重试';
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

	{#if errorMsg}
		<div class="error-msg">{errorMsg}</div>
	{/if}

	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="material-list">
			{#each filteredMaterials as m}
				{@const display = formatItemsDisplay(m)}
				<div class="material-card">
					<div class="material-header">
						<div>
							<span class="requester">{m.Requester?.Name || '未知'}</span>
							<span class="time">{new Date(m.CreatedAt).toLocaleString()}</span>
						</div>
						<span style={getStatusColor(m.Status)} class="status">{getStatusText(m.Status)}</span>
					</div>
					<div class="material-items">
						{#each display.labels as label}
							<span class={`item-tag ${display.isRaw ? 'item-tag-raw' : ''} ${display.isEmpty ? 'item-tag-empty' : ''}`}>
								{label}
							</span>
						{/each}
					</div>
					<div class="qty-info">
						<span class="label">申报总数：</span>
						<span class="value">{m.TotalQty}</span>
						{#if display.mismatch}
							<span class="mismatch-warning">
								⚠️ 与明细合计 ({display.totalFromItems}) 不一致
							</span>
						{/if}
					</div>
					{#if display.isRaw}
						<div class="warning-msg">
							⚠️ 此申请为旧格式数据，明细结构不完整，建议退回让申请人重新提交
						</div>
					{/if}
					{#if m.Status === 'pending'}
						<div class="actions">
							<button class="approve-btn" on:click={() => handleApprove(m.ID, 'approved')}>批准</button>
							<button class="reject-btn" on:click={() => handleApprove(m.ID, 'rejected')}>拒绝</button>
							<button class="issue-btn" on:click={() => handleApprove(m.ID, 'issued')}>已发放</button>
						</div>
					{/if}
					{#if m.Remark}
						<p class="remark">备注：{m.Remark}</p>
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
	.material-list { display: flex; flex-direction: column; gap: 16px; }
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
	.item-tag-raw {
		background: #fefcbf;
		color: #975a16;
		font-style: italic;
	}
	.item-tag-empty {
		background: #fed7d7;
		color: #c53030;
	}
	.qty-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
		font-size: 14px;
	}
	.qty-info .label {
		color: #a0aec0;
	}
	.qty-info .value {
		color: #4a5568;
		font-weight: 600;
	}
	.mismatch-warning {
		color: #e53e3e;
		font-size: 13px;
		background: #fff5f5;
		padding: 2px 8px;
		border-radius: 4px;
	}
	.warning-msg {
		background: #fffbea;
		color: #975a16;
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 12px;
		font-size: 14px;
		border-left: 3px solid #ed8936;
	}
	.error-msg {
		background: #fed7d7;
		color: #c53030;
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
	}
	.actions { display: flex; gap: 10px; }
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
