<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingApi, coachApi } from '$lib/api/client';
	import type { Booking, CoachSchedule } from '$lib/types';
	import { STATUS_COLORS, STATUS_LABELS, EXCEPTION_SEVERITY_COLORS, EXCEPTION_SEVERITY_LABELS, EXCEPTION_TYPE_LABELS, ROLE_LABELS } from '$lib/types';
	import { auth } from '$lib/stores/auth';
	import dayjs from 'dayjs';

	let bookings: Booking[] = [];
	let schedules: CoachSchedule[] = [];
	let loading = true;
	let today = dayjs().format('YYYY年MM月DD日');

	$: todayBookings = bookings.filter(b => dayjs(b.startAt).isSame(dayjs(), 'day'));
	$: pendingCount = todayBookings.filter(b => b.status === 'confirmed').length;
	$: checkedInCount = todayBookings.filter(b => b.status === 'checked_in').length;
	$: completedCount = todayBookings.filter(b => b.status === 'completed').length;
	$: exceptionsCount = todayBookings.filter(b => b.exceptions && b.exceptions.length > 0).length;
	$: activeExceptions = bookings.filter(b => b.exceptions?.some(e => e.status === 'open' || e.status === 'investigating'));

	onMount(async () => {
		try {
			[bookings, schedules] = await Promise.all([
				bookingApi.list({ date: dayjs().format('YYYY-MM-DD') }),
				coachApi.listSchedules({ date: dayjs().format('YYYY-MM-DD') })
			]);
		} finally {
			loading = false;
		}
	});

	function formatTime(date: string) {
		return dayjs(date).format('HH:mm');
	}

	function getStatusDot(status: string) {
		switch (status) {
			case 'checked_in': return 'status-dot-green';
			case 'confirmed': return 'status-dot-yellow';
			case 'exception': return 'status-dot-red';
			default: return 'status-dot-gray';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">今日概览</h1>
			<p class="text-gray-500">{today} · {$auth.user?.name}，欢迎回来</p>
		</div>
		<div class="text-sm text-gray-500">
			当前角色: <span class="font-medium text-gray-900">{ROLE_LABELS[$auth.user?.role || 'reception']}</span>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<div class="grid grid-cols-4 gap-4">
			<div class="card p-5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">待到场</p>
						<p class="text-3xl font-bold text-blue-600 mt-1">{pendingCount}</p>
					</div>
					<div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
					</div>
				</div>
			</div>

			<div class="card p-5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">进行中</p>
						<p class="text-3xl font-bold text-green-600 mt-1">{checkedInCount}</p>
					</div>
					<div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
							<polyline points="22 4 12 14.01 9 11.01" />
						</svg>
					</div>
				</div>
			</div>

			<div class="card p-5">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500">已完成</p>
						<p class="text-3xl font-bold text-gray-600 mt-1">{completedCount}</p>
					</div>
					<div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<rect x="3" y="4" width="18" height="18" rx="2" />
							<path d="M16 2v4" />
							<path d="M8 2v4" />
							<path d="M3 10h18" />
						</svg>
					</div>
				</div>
			</div>

			<div class="card p-5 border-orange-200 bg-orange-50">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-orange-600">待处理异常</p>
						<p class="text-3xl font-bold text-orange-600 mt-1">{activeExceptions.length}</p>
					</div>
					<div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
						<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
							<line x1="12" y1="9" x2="12" y2="13" />
						</svg>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-3 gap-6">
			<div class="col-span-2 card">
				<div class="p-4 border-b border-gray-100 flex items-center justify-between">
					<h2 class="font-semibold text-gray-900">今日预约</h2>
					<span class="text-sm text-gray-500">共 {todayBookings.length} 条</span>
				</div>
				<div class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
					{#if todayBookings.length === 0}
						<div class="p-8 text-center text-gray-400">
							今日暂无预约
						</div>
					{:else}
						{#each todayBookings as booking}
							<div class="p-4 hover:bg-gray-50 transition-colors">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span class="status-dot {getStatusDot(booking.status)}"></span>
										<div>
											<div class="font-medium text-gray-900">
												{booking.memberName}
												{#if booking.includeCoaching && booking.coachName}
													<span class="text-xs text-green-600 ml-2">含 {booking.coachName} 教学</span>
												{/if}
											</div>
											<div class="text-sm text-gray-500">
												{booking.bayNumber} · {formatTime(booking.startAt)} - {formatTime(booking.endAt)}
											</div>
										</div>
									</div>
									<div class="flex items-center gap-3">
										{#if booking.exceptions && booking.exceptions.length > 0}
											{#each booking.exceptions as ex}
												<span class="badge {EXCEPTION_SEVERITY_COLORS[ex.severity]}">
													{EXCEPTION_TYPE_LABELS[ex.type]}
												</span>
											{/each}
										{/if}
										<span class="badge {STATUS_COLORS[booking.status]}">
											{STATUS_LABELS[booking.status]}
										</span>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="space-y-6">
				<div class="card">
					<div class="p-4 border-b border-gray-100">
						<h2 class="font-semibold text-gray-900">今日教练排班</h2>
					</div>
					<div class="divide-y divide-gray-100 max-h-48 overflow-y-auto">
						{#if schedules.length === 0}
							<div class="p-4 text-center text-gray-400 text-sm">
								今日暂无排班
							</div>
						{:else}
							{#each schedules as schedule}
								<div class="p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-medium text-gray-900 text-sm">{schedule.coachName}</p>
											<p class="text-xs text-gray-500">{schedule.type}</p>
										</div>
										<div class="text-right">
											<p class="text-sm text-gray-900">{formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}</p>
											<p class="text-xs text-gray-500">{schedule.bookedCount}/{schedule.capacity} 人</p>
										</div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<div class="card border-orange-200">
					<div class="p-4 border-b border-orange-100 bg-orange-50">
						<h2 class="font-semibold text-orange-900">待处理异常</h2>
					</div>
					<div class="divide-y divide-gray-100 max-h-64 overflow-y-auto">
						{#if activeExceptions.length === 0}
							<div class="p-4 text-center text-gray-400 text-sm">
								暂无待处理异常
							</div>
						{:else}
							{#each activeExceptions as booking}
								{#each booking.exceptions?.filter(e => e.status === 'open' || e.status === 'investigating') || [] as ex}
									<div class="p-3 hover:bg-gray-50">
										<div class="flex items-start gap-2">
											<span class="badge {EXCEPTION_SEVERITY_COLORS[ex.severity]} mt-0.5">
												{EXCEPTION_SEVERITY_LABELS[ex.severity]}
											</span>
											<div class="flex-1 min-w-0">
												<p class="font-medium text-gray-900 text-sm truncate">{ex.title}</p>
												<p class="text-xs text-gray-500 mt-0.5">{booking.memberName} · {booking.bayNumber}</p>
												<p class="text-xs text-gray-400 mt-1">{dayjs(ex.createdAt).format('HH:mm')} · {ex.reportedByName}</p>
											</div>
										</div>
									</div>
								{/each}
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
