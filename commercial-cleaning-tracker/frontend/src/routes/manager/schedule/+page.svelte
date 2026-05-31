<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getSchedules, getShifts } from '$lib/stores';
	import type { Schedule, Shift } from '$lib/types';

	let schedules: Schedule[] = [];
	let shifts: Shift[] = [];
	let loading = true;
	let selectedSchedule: number | null = null;

	onMount(async () => {
		try {
			schedules = await getSchedules();
			shifts = await getShifts();
		} finally {
			loading = false;
		}
	});

	function getShiftTypeLabel(type: string) {
		const labels: Record<string, string> = {
			morning: '早班',
			afternoon: '中班',
			night: '晚班',
			full: '全天'
		};
		return labels[type] || type;
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}

	$: filteredShifts = selectedSchedule
		? shifts.filter((s) => s.scheduleId === selectedSchedule)
		: shifts;
</script>

<Layout title="排班回看" activeMenu="schedule">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="toolbar">
			<select bind:value={selectedSchedule} on:change={() => selectedSchedule = selectedSchedule || null}>
				<option value={0}>全部排班</option>
				{#each schedules as sch}
					<option value={sch.id}>{sch.weekStart} - {sch.projectName}</option>
				{/each}
			</select>
			<span class="total">共 {filteredShifts.length} 个班次</span>
		</div>

		<div class="shift-grid">
			{#each filteredShifts as shift}
				<div class="shift-card">
					<div class="shift-header">
						<span class="shift-date">{formatDate(shift.date)}</span>
						<span class="shift-type">{getShiftTypeLabel(shift.shiftType)}</span>
					</div>
					<div class="shift-body">
						<div class="shift-info">
							<span class="label">项目：</span>
							<span class="value">{shift.area}</span>
						</div>
						<div class="shift-info">
							<span class="label">时间：</span>
							<span class="value">{shift.startTime} - {shift.endTime}</span>
						</div>
						<div class="shift-info">
							<span class="label">任务：</span>
							<span class="value">{shift.tasks}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.toolbar {
		display: flex;
		gap: 16px;
		align-items: center;
		margin-bottom: 20px;
	}

	select {
		padding: 8px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 14px;
	}

	.total {
		color: #718096;
		font-size: 14px;
	}

	.shift-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.shift-card {
		background: white;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.shift-header {
		padding: 12px 16px;
		background: #f7fafc;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.shift-date {
		font-weight: 600;
	}

	.shift-type {
		padding: 4px 10px;
		background: #e6fffa;
		color: #234e52;
		border-radius: 4px;
		font-size: 12px;
	}

	.shift-body {
		padding: 16px;
	}

	.shift-info {
		margin-bottom: 8px;
		display: flex;
	}

	.shift-info:last-child {
		margin-bottom: 0;
	}

	.label {
		color: #718096;
		width: 50px;
		flex-shrink: 0;
	}

	.value {
		color: #2d3748;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #718096;
	}
</style>
