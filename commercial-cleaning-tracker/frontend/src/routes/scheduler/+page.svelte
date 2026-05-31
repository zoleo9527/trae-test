<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getSchedules, getProjects, getWorkers, createSchedule, publishSchedule } from '$lib/stores';
	import type { Schedule, Project, User } from '$lib/types';

	let schedules: Schedule[] = [];
	let projects: Project[] = [];
	let workers: User[] = [];
	let loading = true;
	let showCreateModal = false;
	let selectedProject = '';

	let newSchedule = {
		projectId: 0,
		weekStart: new Date().toISOString().split('T')[0],
		shifts: [] as Array<{
			workerId: number;
			date: string;
			shiftType: string;
			startTime: string;
			endTime: string;
			area: string;
			tasks: string;
		}>
	};

	async function loadData() {
		try {
			[schedules, projects, workers] = await Promise.all([
				getSchedules(),
				getProjects(),
				getWorkers()
			]);
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		newSchedule = {
			projectId: projects[0]?.id || 0,
			weekStart: new Date().toISOString().split('T')[0],
			shifts: []
		};
		showCreateModal = true;
	}

	function addShift() {
		newSchedule.shifts.push({
			workerId: workers[0]?.id || 0,
			date: newSchedule.weekStart,
			shiftType: 'morning',
			startTime: '08:00',
			endTime: '16:00',
			area: '',
			tasks: ''
		});
	}

	async function handleCreateSchedule() {
		try {
			await createSchedule(newSchedule);
			showCreateModal = false;
			loadData();
		} catch (e) {
			alert('创建失败');
		}
	}

	async function handlePublish(id: number) {
		try {
			await publishSchedule(id);
			loadData();
		} catch (e) {
			alert('发布失败');
		}
	}

	onMount(() => {
		loadData();
	});

	const getStatusText = (s: string) => ({ draft: '草稿', published: '已发布', completed: '已完成' }[s] || s);
	const getStatusColor = (s: string) =>
		s === 'published' ? 'color: #48bb78' : s === 'draft' ? 'color: #ed8936' : 'color: #718096';
</script>

<Layout title="排班管理" activeMenu="schedule">
	<div class="header-actions">
		<select bind:value={selectedProject}>
			<option value="">全部项目</option>
			{#each projects as p}
				<option value={p.id}>{p.name}</option>
			{/each}
		</select>
		<button class="primary-btn" on:click={openCreateModal}>+ 新建排班</button>
	</div>

	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="schedule-list">
			{#each schedules as s}
				<div class="schedule-card">
					<div class="schedule-header">
						<div>
							<h3>{s.project.name}</h3>
							<p class="date-range">{new Date(s.weekStart).toLocaleDateString()} - {new Date(s.weekEnd).toLocaleDateString()}</p>
						</div>
						<div class="status-actions">
							<span style={getStatusColor(s.status)}>{getStatusText(s.status)}</span>
							{#if s.status === 'draft'}
								<button class="small-btn" on:click={() => handlePublish(s.id)}>发布</button>
							{/if}
						</div>
					</div>
					<div class="shifts-preview">
						{#each s.shifts.slice(0, 3) as shift}
							<div class="shift-item">
								<span>{new Date(shift.date).toLocaleDateString()}</span>
								<span>{shift.worker.name}</span>
								<span class="shift-type">{shift.shiftType === 'morning' ? '早班' : shift.shiftType === 'afternoon' ? '中班' : shift.shiftType === 'night' ? '夜班' : '全天'}</span>
								<span>{shift.startTime} - {shift.endTime}</span>
							</div>
						{/each}
						{#if s.shifts.length > 3}
							<span class="more">还有 {s.shifts.length - 3} 个班次...</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showCreateModal}
		<div class="modal-overlay" on:click={() => (showCreateModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<h3>新建排班</h3>
				<div class="form-group">
					<label>项目</label>
					<select bind:value={newSchedule.projectId}>
						{#each projects as p}
							<option value={p.id}>{p.name}</option>
						{/each}
					</select>
				</div>
				<div class="form-group">
					<label>周开始日期</label>
					<input type="date" bind:value={newSchedule.weekStart} />
				</div>

				<div class="shifts-editor">
					<div class="section-header">
						<h4>班次列表</h4>
						<button class="small-btn" on:click={addShift}>+ 添加班次</button>
					</div>
					{#each newSchedule.shifts as shift, i}
						<div class="shift-form">
							<select bind:value={shift.workerId}>
								{#each workers as w}
									<option value={w.id}>{w.name}</option>
								{/each}
							</select>
							<input type="date" bind:value={shift.date} />
							<select bind:value={shift.shiftType}>
								<option value="morning">早班</option>
								<option value="afternoon">中班</option>
								<option value="night">夜班</option>
								<option value="full">全天</option>
							</select>
							<input type="time" bind:value={shift.startTime} />
							<input type="time" bind:value={shift.endTime} />
							<input type="text" bind:value={shift.area} placeholder="区域" />
						</div>
					{/each}
				</div>

				<div class="modal-actions">
					<button on:click={() => (showCreateModal = false)}>取消</button>
					<button class="primary-btn" on:click={handleCreateSchedule}>创建</button>
				</div>
			</div>
		</div>
	{/if}
</Layout>

<style>
	.header-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.header-actions select {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
	}

	.primary-btn {
		padding: 10px 20px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
	}

	.small-btn {
		padding: 6px 12px;
		background: #667eea;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
	}

	.schedule-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.schedule-card {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.schedule-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 16px;
	}

	.schedule-header h3 {
		margin: 0 0 4px 0;
		color: #2d3748;
	}

	.date-range {
		margin: 0;
		color: #718096;
		font-size: 14px;
	}

	.status-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.shifts-preview {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.shift-item {
		display: flex;
		gap: 16px;
		padding: 8px 12px;
		background: #f7fafc;
		border-radius: 6px;
		font-size: 14px;
	}

	.shift-type {
		padding: 2px 8px;
		background: #e6fffa;
		color: #234e52;
		border-radius: 4px;
		font-size: 12px;
	}

	.more {
		color: #718096;
		font-size: 13px;
		padding-left: 12px;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		padding: 24px;
		border-radius: 12px;
		width: 100%;
		max-width: 800px;
		max-height: 90vh;
		overflow: auto;
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
	.form-group input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		box-sizing: border-box;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.shifts-editor {
		margin: 20px 0;
	}

	.shift-form {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
		flex-wrap: wrap;
	}

	.shift-form select,
	.shift-form input {
		padding: 8px 10px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		flex: 1;
		min-width: 100px;
	}

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
</style>
