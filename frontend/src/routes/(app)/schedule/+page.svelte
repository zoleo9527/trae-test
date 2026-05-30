<script lang="ts">
	import { onMount } from 'svelte';
	import { coachApi } from '$lib/api/client';
	import type { CoachSchedule, User } from '$lib/types';
	import { auth } from '$lib/stores/auth';
	import dayjs from 'dayjs';

	let schedules: CoachSchedule[] = [];
	let coaches: User[] = [];
	let loading = true;
	let dateFilter = dayjs().format('YYYY-MM-DD');
	let coachFilter = '';

	$: filteredSchedules = schedules.filter(s => {
		const matchesDate = !dateFilter || dayjs(s.date).format('YYYY-MM-DD') === dateFilter;
		const matchesCoach = !coachFilter || s.coachId === coachFilter;
		return matchesDate && matchesCoach;
	});

	$: canEdit = $auth.user?.role === 'coach_manager' || $auth.user?.role === 'venue_manager';

	onMount(async () => {
		try {
			[schedules, coaches] = await Promise.all([
				coachApi.listSchedules(),
				coachApi.list()
			]);
		} finally {
			loading = false;
		}
	});

	function formatTime(date: string) {
		return dayjs(date).format('HH:mm');
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'published': return 'bg-green-100 text-green-700';
			case 'draft': return 'bg-gray-100 text-gray-700';
			case 'cancelled': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'published': return '已发布';
			case 'draft': return '草稿';
			case 'cancelled': return '已取消';
			default: return status;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">教练排班</h1>
			<p class="text-gray-500">查看和管理教练排班表</p>
		</div>
		{#if canEdit}
			<button class="btn btn-primary">
				+ 新建排班
			</button>
		{/if}
	</div>

	<div class="card p-4">
		<div class="flex gap-4">
			<div class="w-48">
				<label class="label">日期</label>
				<input type="date" class="input" bind:value={dateFilter} />
			</div>
			<div class="w-48">
				<label class="label">教练</label>
				<select class="select" bind:value={coachFilter}>
					<option value="">全部教练</option>
					{#each coaches as coach}
						<option value={coach.id}>{coach.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#if filteredSchedules.length === 0}
				<div class="col-span-2 card p-12 text-center text-gray-400">
					暂无排班记录
				</div>
			{:else}
				{#each filteredSchedules as schedule}
					<div class="card p-5">
						<div class="flex items-start justify-between mb-4">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
									<span class="text-lg font-medium text-green-600">{schedule.coachName.charAt(0)}</span>
								</div>
								<div>
									<h3 class="font-semibold text-gray-900">{schedule.coachName}</h3>
									<p class="text-sm text-gray-500">{schedule.type}</p>
								</div>
							</div>
							<span class="badge {getStatusColor(schedule.status)}">
								{getStatusLabel(schedule.status)}
							</span>
						</div>

						<div class="grid grid-cols-2 gap-4 text-sm mb-4">
							<div>
								<span class="text-gray-500">时间</span>
								<p class="font-medium text-gray-900">
									{formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}
								</p>
							</div>
							<div>
								<span class="text-gray-500">预约情况</span>
								<p class="font-medium text-gray-900">
									<span class={schedule.bookedCount >= schedule.capacity ? 'text-red-600' : ''}>
										{schedule.bookedCount}
									</span>
									/{schedule.capacity} 人
								</p>
							</div>
						</div>

						<div class="w-full bg-gray-100 rounded-full h-2 mb-4">
							<div
								class="h-2 rounded-full transition-all {schedule.bookedCount >= schedule.capacity ? 'bg-red-500' : 'bg-green-500'}"
								style="width: {Math.min((schedule.bookedCount / schedule.capacity) * 100, 100)}%"
							></div>
						</div>

						{#if schedule.remark}
							<div class="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
								💡 {schedule.remark}
							</div>
						{/if}

						{#if schedule.bookings && schedule.bookings.length > 0}
							<div class="mt-4 pt-4 border-t border-gray-100">
								<p class="text-sm text-gray-500 mb-2">已预约学员</p>
								<div class="space-y-2">
									{#each schedule.bookings as booking}
										<div class="flex items-center justify-between text-sm">
											<span class="text-gray-900">{booking.memberName}</span>
											<span class="text-gray-500">{booking.bayNumber}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if canEdit}
							<div class="mt-4 flex gap-2">
								<button class="btn btn-outline text-sm flex-1">编辑</button>
								<button class="btn btn-secondary text-sm flex-1">取消排班</button>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>
