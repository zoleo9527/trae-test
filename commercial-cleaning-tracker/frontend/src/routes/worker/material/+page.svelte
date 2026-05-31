<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getShifts, getMaterials, createMaterial, currentUser } from '$lib/stores';
	import type { Shift, MaterialRequisition } from '$lib/types';

	interface MaterialItem {
		name: string;
		qty: number;
		unit: string;
	}

	let shifts: Shift[] = [];
	let materials: MaterialRequisition[] = [];
	let loading = true;
	let showModal = false;
	let newReq = {
		shiftId: 0,
		items: [] as MaterialItem[],
		totalQty: 0,
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

	function parseItems(itemsStr: string): MaterialItem[] {
		try {
			return JSON.parse(itemsStr) || [];
		} catch {
			return [];
		}
	}

	let errorMsg = '';

	function getValidItems(items: MaterialItem[]): MaterialItem[] {
		return items.filter(i => i.name && i.name.trim() && i.qty > 0);
	}

	function updateTotalQty() {
		newReq.totalQty = getValidItems(newReq.items).reduce((sum, item) => sum + item.qty, 0);
	}

	function addItem() {
		newReq.items.push({ name: '', qty: 1, unit: '个' });
		updateTotalQty();
	}

	function removeItem(index: number) {
		newReq.items.splice(index, 1);
		updateTotalQty();
	}

	async function handleCreate() {
		errorMsg = '';

		if (!newReq.shiftId || newReq.shiftId === 0) {
			errorMsg = '请选择班次';
			return;
		}

		const validItems = getValidItems(newReq.items);
		if (validItems.length === 0) {
			errorMsg = '请至少填写一项有效的耗材（名称和数量不能为空）';
			return;
		}

		const calculatedTotal = validItems.reduce((sum, item) => sum + item.qty, 0);

		try {
			await createMaterial({
				shiftId: newReq.shiftId,
				items: JSON.stringify(validItems),
				totalQty: calculatedTotal,
				remark: newReq.remark
			});

			const userId = $currentUser?.ID;
			if (userId) materials = await getMaterials({ requesterId: userId });
			showModal = false;
			newReq = { shiftId: 0, items: [], totalQty: 0, remark: '' };
			errorMsg = '';
		} catch (e) {
			errorMsg = '提交失败，请重试';
		}
	}

	function openModal() {
		const defaultItems = [{ name: '', qty: 1, unit: '个' }];
		newReq = {
			shiftId: 0,
			items: defaultItems,
			totalQty: getValidItems(defaultItems).reduce((sum, item) => sum + item.qty, 0),
			remark: ''
		};
		errorMsg = '';
		showModal = true;
	}

	function formatItemsDisplay(itemsStr: string): { text: string; isRaw: boolean } {
		if (!itemsStr) return { text: '无明细', isRaw: false };
		try {
			const parsed = JSON.parse(itemsStr);
			if (Array.isArray(parsed) && parsed.length > 0) {
				const valid = parsed.filter((i: any) => i.name && i.qty);
				if (valid.length > 0) {
					return {
						text: valid.map((i: any) => `${i.name} x${i.qty}${i.unit || ''}`).join(', '),
						isRaw: false
					};
				}
			}
			return { text: itemsStr, isRaw: true };
		} catch {
			return { text: itemsStr, isRaw: true };
		}
	}
</script>

<Layout title="耗材申领" activeMenu="material">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<button class="btn-primary" on:click={openModal}>+ 申请耗材</button>
		</div>

		<div class="section-title">我的申领记录</div>

		<div class="material-list">
			{#each materials as req}
				{@const items = parseItems(req.Items)}
				{@const display = formatItemsDisplay(req.Items)}
				<div class="material-card">
					<div class="material-header">
						<div class="material-items">
							{#if items.length > 0}
								{#each items as item}
									<span class="item-tag">{item.name} x{item.qty}{item.unit}</span>
								{/each}
							{:else if req.Items}
								<span class="item-tag item-tag-raw">{display.text}</span>
							{:else}
								<span class="item-tag item-tag-empty">无明细</span>
							{/if}
						</div>
						<span class={`status-tag ${getStatusClass(req.Status)}`}>{getStatusLabel(req.Status)}</span>
					</div>
					<div class="material-body">
						<div class="info-row">
							<span class="label">数量：</span>
							<span class="value">{req.TotalQty}</span>
						</div>
						{#if display.isRaw}
							<div class="info-row warning-row">
								<span class="label">⚠️ 提示：</span>
								<span class="value">此条数据为旧格式，建议重新提交</span>
							</div>
						{/if}
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

				<div class="items-editor">
					<div class="section-header">
						<label>耗材明细</label>
						<button type="button" class="btn-add" on:click={addItem}>+ 添加</button>
					</div>
					{#each newReq.items as item, i}
						<div class="item-row">
							<input type="text" bind:value={item.name} placeholder="耗材名称" on:input={updateTotalQty} />
							<input type="number" bind:value={item.qty} min="1" placeholder="数量" on:input={updateTotalQty} />
							<select bind:value={item.unit}>
								<option value="个">个</option>
								<option value="瓶">瓶</option>
								<option value="袋">袋</option>
								<option value="包">包</option>
								<option value="箱">箱</option>
								<option value="卷">卷</option>
							</select>
							<button type="button" class="btn-remove" on:click={() => removeItem(i)}>×</button>
						</div>
					{/each}
				</div>

				<div class="form-group">
					<label>总数量</label>
					<input type="number" bind:value={newReq.totalQty} min="0" readonly />
				</div>
				<div class="form-group">
					<label>备注</label>
					<input type="text" bind:value={newReq.remark} placeholder="申请原因等" />
				</div>

				{#if errorMsg}
					<div class="error-msg">{errorMsg}</div>
				{/if}

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
		align-items: flex-start;
		gap: 12px;
	}
	.material-items {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		flex: 1;
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
	.status-tag { padding: 4px 10px; border-radius: 4px; font-size: 12px; flex-shrink: 0; }
	.status-pending { background: #fefcbf; color: #975a16; }
	.status-approved { background: #bee3f8; color: #2b6cb0; }
	.status-rejected { background: #fed7d7; color: #c53030; }
	.status-issued { background: #c6f6d5; color: #276749; }
	.material-body { padding: 16px; }
	.info-row { display: flex; margin-bottom: 8px; font-size: 14px; }
	.info-row:last-child { margin-bottom: 0; }
	.warning-row { background: #fffbea; padding: 8px 12px; border-radius: 4px; margin-top: 8px; }
	.label { color: #a0aec0; width: 80px; flex-shrink: 0; }
	.value { color: #4a5568; flex: 1; }
	.loading { text-align: center; padding: 40px; color: #718096; }
	.error-msg {
		background: #fed7d7;
		color: #c53030;
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 14px;
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
		max-width: 560px;
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal h3 { margin: 0 0 20px 0; }
	.form-group { margin-bottom: 16px; }
	.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #4a5568; }
	.form-group select,
	.form-group input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
	}
	.items-editor {
		margin-bottom: 16px;
	}
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	.section-header label {
		display: block;
		font-size: 14px;
		color: #4a5568;
		margin-bottom: 0;
	}
	.btn-add {
		padding: 6px 12px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}
	.item-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
		align-items: center;
	}
	.item-row input[type="text"] { flex: 2; }
	.item-row input[type="number"] { flex: 1; min-width: 80px; }
	.item-row select { flex: 1; min-width: 80px; padding: 10px 8px; }
	.btn-remove {
		width: 36px;
		height: 36px;
		background: #fed7d7;
		color: #c53030;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 18px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
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
