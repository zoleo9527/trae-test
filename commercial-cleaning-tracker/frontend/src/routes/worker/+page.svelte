<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getShifts, currentUser } from '$lib/stores';
	import type { Shift } from '$lib/types';

	let shifts: Shift[] = [];
	let loading = true;

	async function loadData() {
		try {
			if ($currentUser) {
				shifts = await getShifts({ workerId: $currentUser.ID });
			}
		} finally {
			loading = false;
		}
	}

	onMount(() => loadData());

	const getCheckInStatus = (shift: Shift) => {
		if (shift.CheckIns?.length) {
			const ci = shift.CheckIns[0];
			const map: Record<string, string> = {
				normal: '正常打卡',
				late: '迟到',
				early: '早退',
				missing: '未打卡',
				exception: '异常'
			};
			return map[ci.Status] || '未打卡';
		}
		return '待打卡';
	};
</script>

<Layout title="我的排班" activeMenu="shifts">
	{#if loading}
		<p>加载中...</p>
	{:else if shifts.length === 0}
		<p>暂无排班</p>
	{:else}
		<div class="shift-list">
			{#each shifts as shift}
				<div class="shift-card">
					<div class="date-badge">
						<div class="day">{new Date(shift.Date).getDate()}</div>
						<div class="month">{new Date(shift.Date).toLocaleDateString('zh-CN', { month: 'short' })}</div>
					</div>
					<div class="shift-content">
						<h3>{shift.Schedule?.Project?.Name || '项目'}</h3>
						<div class="meta">
							<span class="time">{shift.StartTime} - {shift.EndTime}</span>
							<span class="area">{shift.Area}</span>
						</div>
						<p class="tasks">{shift.Tasks}</p>
						<div class="status-row">
							<span class="status {shift.CheckIns?.[0]?.Status || 'pending'}">
								{getCheckInStatus(shift)}
							</span>
							{#if shift.Inspections?.length}
								<span class="inspect {shift.Inspections[0].Result}">
									质检: {shift.Inspections[0].Result === 'pass' ? '合格' : '不合格'}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Layout>

<style>
	.shift-list { display: flex; flex-direction: column; gap: 16px; }
	.shift-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
		display: flex;
		overflow: hidden;
	}
	.date-badge {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 20px;
		text-align: center;
		min-width: 80px;
	}
	.day { font-size: 28px; font-weight: 700; }
	.month { font-size: 12px; opacity: 0.9; }
	.shift-content { padding: 20px; flex: 1; }
	.shift-content h3 { margin: 0 0 8px 0; font-size: 16px; }
	.meta { display: flex; gap: 16px; margin-bottom: 8px; font-size: 14px; }
	.time { color: #667eea; font-weight: 500; }
	.area { color: #718096; }
	.tasks { color: #4a5568; font-size: 14px; margin-bottom: 12px; }
	.status-row { display: flex; gap: 10px; }
	.status, .inspect { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
	.status.normal { background: #f0fff4; color: #22543d; }
	.status.late { background: #fffaf0; color: #7c2d12; }
	.status.pending { background: #edf2f7; color: #2d3748; }
	.status.missing, .status.exception { background: #fff5f5; color: #742a2a; }
	.inspect.pass { background: #f0fff4; color: #22543d; }
	.inspect.fail { background: #fff5f5; color: #742a2a; }
</style>
