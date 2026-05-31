<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getShifts, getMaterials, createMaterial, currentUser } from '$lib/stores';
	import type { Shift, MaterialRequisition } from '$lib/types';

	let shifts: Shift[] = [];
	let materials: MaterialRequisition[] = [];
	let loading = true;
	let showModal = false;
	let newReq = {
		shiftId: 0,
		items: '',
		totalQty: 1,
		remark: ''
	};

	onMount(async () => {
		try {
			const userId = $currentUser?.ID;
			if (userId) {
				shifts = await getShifts({ workerId: userId });
				materials = await getMaterials({ requesterId: userId });
			}
		} finally {
			loading = false;
		}
	});

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: '待审批',
			approved: '已批准',
			rejected: '已拒绝',
			issued: '已发放'
		};
		return labels[status] || status;
	}

	function getStatusClass(status: string) {
		const classes: Record<string, string> = {
			pending: 'status-pending',
			approved: 'status-approved',
			rejected: 'status-rejected',
			issued: 'status-issued'
		};
		return classes[status] || '';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	async function handleCreate() {
		if (!newReq.shiftId || !newReq.items || !newReq.totalQty) return;
		await createMaterial(newReq);
		const userId = $currentUser?.ID;
		if (userId) materials = await getMaterials({ requesterId: userId });
		showModal = false;
		newReq = { shiftId: 0, items: '', totalQty: 1, remark: '' };
	}
</script>

<Layout title="耗材申领" activeMenu="material">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<button class="btn-primary" on:click={() => showModal = true}>+ 申请耗材</button>
		</div>

		<div class="section-title">我的申领记录</div>

		<div class="material-list">
			{#each materials as req}
				<div class="material-card">
					<div class="material-header">
						<span class="material-name">{req.Items}</span>
						<span class={`status-tag ${getStatusClass(req.Status)}`}>{getStatusLabel(req.Status)}</span>
					</div>
					<div class="material-body">
						<div class="info-row">
							<span class="label">数量：</span>
							<span class="value">{req.TotalQty}</span>
						</div>
						<div class="info-row">
							<span class="label">申请时间：</span>
							<span class="value">{formatDate(req.RequestTime)}</span>
						</div>
						{#if req.Remark}
							<div class="info-row">
								<span class="label">备注：</span>
								<span class="value">{req.Remark}</span>
							</div>
						{/if}
						{#if req.Approver}
							<div class="info-row">
								<span class="label">审批人：</span>
								<span class="value">{req.Approver?.Name || '-'}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showModal}
		<div class="modal-overlay" on:click={() => showModal = false}>
			<div class="modal" on:click|stopPropagation>
				<h3>申请耗材</h3>
				<div class="form-group">
					<label>选择班次</label>
					<select bind:value={newReq.shiftId}>
						<option value={0}>请选择</option>
						{#each shifts as s}
							<option value={s.ID}>{formatDate(s.Date)} {s.Area}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label>耗材明细</label>
					<textarea bind:value={newReq.items} rows="3" placeholder="例如：清洁剂x2, 抹布x5" />
				</div>
				<div class="form-group">
					<label>总数量</label>
					<input type="number" bind:value={newReq.totalQty} min="1" />
				</div>
				<div class="form-group">
					<label>备注</label>
					<input type="text" bind:value={newReq.remark} placeholder="申请原因等" />
				</div>
				<div class="modal-footer">
					<button class="btn-cancel" on:click={() => showModal = false}>取消</button>
					<button class="btn-primary" on:click={handleCreate}>提交申请</button>
				</div>
			</div>
		</div>
	{/if}
</Layout>

<style>
	.toolbar { margin-bottom: 20px; }
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
	.btn-primary:hover { background: #5a67d8; }
	.section-title { font-size: 16px; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
	.material-list { display: flex; flex-direction: column; gap: 16px; }
	.material-card {
		background: white;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}
	.material-header {
		padding: 12px 16px;
		background: #f7fafc;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.material-name { font-weight: 600; color: #2d3748; }
	.status-tag { padding: 4px 10px; border-radius: 4px; font-size: 12px; }
	.status-pending { background: #fefcbf; color: #975a16; }
	.status-approved { background: #bee3f8; color: #2b6cb0; }
	.status-rejected { background: #fed7d7; color: #c53030; }
	.status-issued { background: #c6f6d5; color: #276749; }
	.material-body { padding: 16px; }
	.info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
	.info-row:last-child { margin-bottom: 0; }
	.label { color: #a0aec0; width: 80px; flex-shrink: 0; }
	.value { color: #4a5568; flex: 1; }
	.loading { text-align: center; padding: 40px; color: #718096; }
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
		max-width: 480px;
	}
	.modal h3 { margin: 0 0 20px 0; }
	.form-group { margin-bottom: 16px; }
	.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #4a5568; }
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
	.modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
	.btn-cancel {
		padding: 10px 20px;
		background: #e2e8f0;
		color: #4a5568;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}
	.btn-cancel:hover { background: #cbd5e0; }
</style>
