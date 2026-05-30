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

	let showScheduleModal = false;
	let editingSchedule: CoachSchedule | null = null;
	let scheduleForm = {
		coachId: '',
		date: dayjs().format('YYYY-MM-DD'),
		startAt: '',
		endAt: '',
		type: '普通教学',
		capacity: 4,
		remark: ''
	};

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

	async function loadSchedules() {
		schedules = await coachApi.listSchedules({ date: dateFilter, coachId: coachFilter });
	}

	$: if (dateFilter || coachFilter) {
		loadSchedules();
	}

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

	function openCreateModal() {
		editingSchedule = null;
		scheduleForm = {
			coachId: coaches[0]?.id || '',
			date: dayjs().format('YYYY-MM-DD'),
			startAt: '09:00',
			endAt: '11:00',
			type: '普通教学',
			capacity: 4,
			remark: ''
		};
		showScheduleModal = true;
	}

	function openEditModal(schedule: CoachSchedule) {
		editingSchedule = schedule;
		scheduleForm = {
			coachId: schedule.coachId,
			date: dayjs(schedule.date).format('YYYY-MM-DD'),
			startAt: formatTime(schedule.startAt),
			endAt: formatTime(schedule.endAt),
			type: schedule.type,
			capacity: schedule.capacity,
			remark: schedule.remark || ''
		};
		showScheduleModal = true;
	}

	async function handleSaveSchedule() {
		if (!scheduleForm.coachId) {
			alert('请选择教练');
			return;
		}

		try {
			const startAt = dayjs(`${scheduleForm.date}T${scheduleForm.startAt}`).toISOString();
			const endAt = dayjs(`${scheduleForm.date}T${scheduleForm.endAt}`).toISOString();

			const data = {
				coachId: scheduleForm.coachId,
				date: scheduleForm.date,
				startAt,
				endAt,
				type: scheduleForm.type,
				capacity: scheduleForm.capacity,
				remark: scheduleForm.remark || undefined
			};

			if (editingSchedule) {
				await coachApi.updateSchedule(editingSchedule.id, data);
			} else {
				await coachApi.createSchedule(data);
			}

			showScheduleModal = false;
			schedules = await coachApi.listSchedules({ date: dateFilter, coachId: coachFilter });
		} catch (e: any) {
			alert(e.message || '保存失败');
		}
	}

	async function handleCancelSchedule(schedule: CoachSchedule) {
		if (!confirm(`确定要取消 "${schedule.coachName} - ${schedule.type}" 的排班吗？`)) {
			return;
		}

		try {
			await coachApi.cancelSchedule(schedule.id);
			schedules = await coachApi.listSchedules({ date: dateFilter, coachId: coachFilter });
		} catch (e: any) {
			alert(e.message || '取消失败');
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
			<button class="btn btn-primary" on:click={openCreateModal}>
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

						{#if canEdit && schedule.status !== 'cancelled'}
							<div class="mt-4 flex gap-2">
								<button class="btn btn-outline text-sm flex-1" on:click={() => openEditModal(schedule)}>
									编辑
								</button>
								<button class="btn btn-secondary text-sm flex-1" on:click={() => handleCancelSchedule(schedule)}>
									取消排班
								</button>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</div>

{#if showScheduleModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showScheduleModal = false}>
		<div class="bg-white rounded-2xl w-full max-w-lg" on:click|stopPropagation>
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">
						{editingSchedule ? '编辑排班' : '新建排班'}
					</h2>
					<button class="p-2 hover:bg-gray-100 rounded-lg" on:click={() => showScheduleModal = false}>
						<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			</div>

			<div class="p-6 space-y-4">
				<div>
					<label class="label">教练 <span class="text-red-500">*</span></label>
					<select class="select" bind:value={scheduleForm.coachId}>
						<option value="">请选择教练</option>
						{#each coaches as coach}
							<option value={coach.id}>{coach.name}</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-3 gap-4">
					<div>
						<label class="label">日期 <span class="text-red-500">*</span></label>
						<input type="date" class="input" bind:value={scheduleForm.date} />
					</div>
					<div>
						<label class="label">开始时间 <span class="text-red-500">*</span></label>
						<input type="time" class="input" bind:value={scheduleForm.startAt} />
					</div>
					<div>
						<label class="label">结束时间 <span class="text-red-500">*</span></label>
						<input type="time" class="input" bind:value={scheduleForm.endAt} />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label">排班类型</label>
						<select class="select" bind:value={scheduleForm.type}>
							<option value="普通教学">普通教学</option>
							<option value="VIP一对一">VIP一对一</option>
							<option value="团体课程">团体课程</option>
							<option value="赛前集训">赛前集训</option>
						</select>
					</div>
					<div>
						<label class="label">最大容量</label>
						<input type="number" class="input" min="1" bind:value={scheduleForm.capacity} />
					</div>
				</div>

				<div>
					<label class="label">备注</label>
					<textarea class="input" rows="2" placeholder="可选备注..." bind:value={scheduleForm.remark}></textarea>
				</div>
			</div>

			<div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
				<button class="btn btn-secondary" on:click={() => showScheduleModal = false}>
					取消
				</button>
				<button class="btn btn-primary" on:click={handleSaveSchedule}>
					{editingSchedule ? '保存修改' : '创建排班'}
				</button>
			</div>
		</div>
	</div>
{/if}
