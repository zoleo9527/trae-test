<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getMyShifts, createMaterialReq } from '$lib/stores';
	import type { Shift } from '$lib/types';

	let shifts: Shift[] = [];
	let loading = true;
	let showModal = false;
	let newReq = {
		shiftId: 0,
		materialName: '',
		quantity: 1,
		unit: '个',
		reason: ''
	};
	const materialOptions = ['清洁剂', '拖把', '抹布', '垃圾袋', '手套', '消毒液', '玻璃水', '刷子'];

	onMount(async () => {
		try {
			shifts = await getMyShifts();
		} finally {
			loading = false;
		}
	});

	function getStatusLabel(status: string) {
		const labels: Record<string, string> = {
			pending: '待审批',
			approved: '已批准',
			rejected: '已拒绝',
			received: '已领取'
		};
		return labels[status] || status;
	}

	function getStatusClass(status: string) {
		const classes: Record<string, string> = {
			pending: 'status-pending',
			approved: 'status-approved',
			rejected: 'status-rejected',
			received: 'status-received'
		};
		return classes[status] || '';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	async function handleCreate() {
		if (!newReq.shiftId || !newReq.materialName || !newReq.quantity) return;
		await createMaterialReq(newReq);
		shifts = await getMyShifts();
		showModal = false;
		newReq = { shiftId: 0, materialName: '', quantity: 1, unit: '个', reason: '' };
	}

	$: recentShifts = shifts.slice(0, 10);
</script>

<Layout title="耗材申领" activeMenu="material">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<button class="btn-primary" on:click={() => showModal = true}>+ 申请耗材</button>
		</div>

		<div class="section-title">最近申领记录</div>

		<div class="material-list">
			{#each recentShifts as shift}
				{#each shift.materialReqs || [] as req}
					<div class="material-card">
						<div class="material-header">
							<span class="material-name">{req.materialName}</span>
							<span class={`status-tag ${getStatusClass(req.status)}`}>{getStatusLabel(req.status)}</span>
						</div>
						<div class="material-body">
							<div class="info-row">
								<span class="label">数量：</span>
								<span class="value">{req.quantity} {req.unit}</span>
							</div>
							<div class="info-row">
								<span class="label">班次：</span>
								<span class="value">{formatDate(shift.date)} {shift.area}</span>
							</div>
							<div class="info-row">
								<span class="label">原因：</span>
								<span class="value">{req.reason || '-'}</span>
							</div>
							{#if req.rejectReason}
								<div class="info-row reject">
									<span class="label">驳回原因：</span>
									<span class="value">{req.rejectReason}</span>
								</div>
							{/if}
						</div>
						<div class="material-footer">
							<span class="date">申请时间：{formatDate(req.createdAt)}</span>
						</div>
					</div>
				{/each}
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
							<option value={s.id}>{formatDate(s.date)} {s.area}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label>耗材名称</label>
					<select bind:value={newReq.materialName}>
						<option value="">请选择</option>
						{#each materialOptions as m}
							<option value={m}>{m}</option>
						{/each}
					</select>
				</div>
				<div class="form-row">
					<div class="form-group half">
						<label>数量</label>
						<input type="number" bind:value={newReq.quantity} min="1" />
					</div>
					<div class="form-group half">
						<label>单位</label>
						<select bind:value={newReq.unit}>
							<option value="个">个</option>
							<option value="瓶">瓶</option>
							<option value="包">包</option>
							<option value="把">把</option>
							<option value="箱">箱</option>
						</select>
					</div>
				</div>
				<div class="form-group">
					<label>申请原因</label>
					<textarea bind:value={newReq.reason} rows="3" placeholder="请输入申请原因..." />
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
	.toolbar {
		margin-bottom: 20px;
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

	.section-title {
		font-size: 16px;
		font-weight: 600;
		color: #2d3748;
		margin-bottom: 16px;
	}

	.material-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

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

	.material-name {
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

	.status-approved {
		background: #bee3f8;
		color: #2b6cb0;
	}

	.status-rejected {
		background: #fed7d7;
		color: #c53030;
	}

	.status-received {
		background: #c6f6d5;
		color: #276749;
	}

	.material-body {
		padding: 16px;
	}

	.info-row {
		display: flex;
		margin-bottom: 8px;
		font-size: 14px;
	}

	.info-row:last-child {
		margin-bottom: 0;
	}

	.info-row.reject .value {
		color: #c53030;
	}

	.label {
		color: #a0aec0;
		width: 70px;
		flex-shrink: 0;
	}

	.value {
		color: #4a5568;
		flex: 1;
	}

	.material-footer {
		padding: 10px 16px;
		background: #f7fafc;
		border-top: 1px solid #e2e8f0;
		font-size: 12px;
		color: #a0aec0;
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
		max-width: 480px;
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

	.form-row {
		display: flex;
		gap: 12px;
	}

	.form-group.half {
		flex: 1;
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
