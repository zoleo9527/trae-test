<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getShifts, createInspection, createRectification } from '$lib/stores';
	import type { Shift } from '$lib/types';

	let shifts: Shift[] = [];
	let loading = true;
	let selectedShift: Shift | null = null;
	let showInspectModal = false;

	let inspectionForm = {
		result: 'pass' as 'pass' | 'fail' | 'pending',
		score: 100,
		items: '',
		problems: '',
		remark: ''
	};

	let rectForm = {
		assigneeId: 0,
		deadline: '',
		description: '',
		actions: ''
	};

	async function loadData() {
		try {
			shifts = await getShifts();
		} finally {
			loading = false;
		}
	}

	function openInspectModal(shift: Shift) {
		selectedShift = shift;
		inspectionForm = { result: 'pass', score: 100, items: '', problems: '', remark: '' };
		rectForm = { assigneeId: shift.workerId, deadline: '', description: '', actions: '' };
		showInspectModal = true;
	}

	async function handleSubmit() {
		if (!selectedShift) return;
		try {
			const inspection = await createInspection({
				shiftId: selectedShift.id,
				...inspectionForm
			});

			if (inspectionForm.result === 'fail' && rectForm.description) {
				await createRectification({
					inspectionId: inspection.id,
					...rectForm
				});
			}

			showInspectModal = false;
			loadData();
			alert('质检提交成功');
		} catch (e) {
			alert('提交失败');
		}
	}

	onMount(() => loadData());
</script>

<Layout title="质检录入" activeMenu="inspect">
	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="shift-list">
			{#each shifts as shift}
				<div class="shift-card">
					<div class="shift-header">
						<div>
							<h3>{shift.schedule?.project?.name || '项目'}</h3>
							<p>{new Date(shift.date).toLocaleDateString()} | {shift.worker.name}</p>
						</div>
						<div class="badges">
							{#if shift.checkIns?.length}
								<span class="badge checkin">已打卡</span>
							{/if}
							{#if shift.inspections?.length}
								<span class="badge inspected">已质检</span>
							{/if}
						</div>
					</div>
					<div class="shift-info">
						<span class="time">{shift.startTime} - {shift.endTime}</span>
						<span class="area">{shift.area}</span>
					</div>
					<p class="tasks">{shift.tasks}</p>
					<button class="primary-btn" on:click={() => openInspectModal(shift)}>
						{shift.inspections?.length ? '重新质检' : '开始质检'}
					</button>
				</div>
			{/each}
		</div>
	{/if}

	{#if showInspectModal && selectedShift}
		<div class="modal-overlay" on:click={() => (showInspectModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<h3>质检 - {selectedShift.worker.name}</h3>
				<p class="sub">{selectedShift.schedule?.project?.name} - {new Date(selectedShift.date).toLocaleDateString()}</p>

				<div class="form-group">
					<label>质检结果</label>
					<select bind:value={inspectionForm.result}>
						<option value="pass">通过</option>
						<option value="fail">不合格</option>
						<option value="pending">待复检</option>
					</select>
				</div>

				<div class="form-group">
					<label>评分 (0-100)</label>
					<input type="number" bind:value={inspectionForm.score} min="0" max="100" />
				</div>

				<div class="form-group">
					<label>检查项目 (逗号分隔)</label>
					<input type="text" bind:value={inspectionForm.items} placeholder="如：地面清洁,卫生间,电梯间" />
				</div>

				<div class="form-group">
					<label>问题描述</label>
					<textarea bind:value={inspectionForm.problems} rows="3" />
				</div>

				{#if inspectionForm.result === 'fail'}
					<div class="rect-section">
						<h4>整改安排</h4>
						<div class="form-group">
							<label>整改截止日期</label>
							<input type="date" bind:value={rectForm.deadline} />
						</div>
						<div class="form-group">
							<label>整改要求</label>
							<textarea bind:value={rectForm.description} rows="2" />
						</div>
						<div class="form-group">
							<label>整改措施</label>
							<textarea bind:value={rectForm.actions} rows="2" />
						</div>
					</div>
				{/if}

				<div class="modal-actions">
					<button on:click={() => (showInspectModal = false)}>取消</button>
					<button class="primary-btn" on:click={handleSubmit}>提交</button>
				</div>
			</div>
		</div>
	{/if}
</Layout>

<style>
	.shift-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 16px;
	}
	.shift-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	.shift-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}
	.shift-header h3 { margin: 0 0 4px 0; font-size: 16px; }
	.shift-header p { margin: 0; color: #718096; font-size: 14px; }
	.badges { display: flex; gap: 6px; }
	.badge {
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 12px;
	}
	.badge.checkin { background: #e6fffa; color: #234e52; }
	.badge.inspected { background: #f0fff4; color: #22543d; }
	.shift-info {
		display: flex;
		gap: 16px;
		margin-bottom: 8px;
		font-size: 14px;
	}
	.time { color: #667eea; font-weight: 500; }
	.area { color: #4a5568; }
	.tasks {
		color: #718096;
		font-size: 14px;
		margin-bottom: 16px;
	}
	.primary-btn {
		width: 100%;
		padding: 10px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	.modal-overlay {
		position: fixed; inset: 0;
		background: rgba(0,0,0,0.5);
		display: flex; align-items: center; justify-content: center;
		z-index: 1000;
	}
	.modal {
		background: white;
		padding: 24px;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow: auto;
	}
	.modal h3 { margin: 0 0 4px 0; }
	.sub { color: #718096; margin: 0 0 20px 0; }
	.form-group { margin-bottom: 16px; }
	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
		color: #4a5568;
	}
	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		box-sizing: border-box;
	}
	.form-group textarea { resize: vertical; }
	.rect-section {
		margin-top: 20px;
		padding-top: 20px;
		border-top: 1px solid #e2e8f0;
	}
	.rect-section h4 { margin: 0 0 16px 0; color: #e53e3e; }
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 20px;
	}
	.modal-actions button {
		padding: 10px 20px;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 6px;
		cursor: pointer;
	}
	.modal-actions .primary-btn { background: #667eea; color: white; border: none; }
</style>
