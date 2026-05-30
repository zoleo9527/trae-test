<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingApi, memberApi, coachApi } from '$lib/api/client';
	import type { Booking, Member, User, CoachSchedule, Bay } from '$lib/types';
	import { STATUS_COLORS, STATUS_LABELS, EXCEPTION_SEVERITY_COLORS, EXCEPTION_TYPE_LABELS } from '$lib/types';
	import ExceptionDrawer from '$lib/components/ExceptionDrawer.svelte';
	import dayjs from 'dayjs';

	let bookings: Booking[] = [];
	let members: Member[] = [];
	let coaches: User[] = [];
	let bays: Bay[] = [];
	let schedules: CoachSchedule[] = [];
	let loading = true;
	let statusFilter = '';
	let dateFilter = dayjs().format('YYYY-MM-DD');
	let searchQuery = '';

	let selectedBookingId: string | null = null;
	let drawerOpen = false;
	let showBookingModal = false;

	let newBooking = {
		memberId: '',
		bayId: '',
		coachId: '',
		scheduleId: '',
		date: dayjs().format('YYYY-MM-DD'),
		startTime: '10:00',
		endTime: '12:00',
		guestCount: 1,
		includeCoaching: false,
		paymentMethod: 'wallet',
		remark: ''
	};

	$: filteredBookings = bookings.filter(b => {
		const matchesStatus = !statusFilter || b.status === statusFilter;
		const matchesDate = !dateFilter || dayjs(b.startAt).format('YYYY-MM-DD') === dateFilter;
		const matchesSearch = !searchQuery ||
			b.memberName.includes(searchQuery) ||
			b.bayNumber.includes(searchQuery) ||
			b.memberPhone.includes(searchQuery);
		return matchesStatus && matchesDate && matchesSearch;
	});

	$: availableSchedules = schedules.filter(s =>
		s.date === newBooking.date &&
		s.status === 'published' &&
		s.bookedCount < s.capacity
	);

	onMount(async () => {
		try {
			[bookings, members, coaches, bays, schedules] = await Promise.all([
				bookingApi.list(),
				memberApi.list(),
				coachApi.list(),
				bookingApi.listBays(),
				coachApi.listSchedules({ date: newBooking.date })
			]);
		} finally {
			loading = false;
		}
	});

	$: if (newBooking.date && showBookingModal) {
		loadSchedulesForDate();
	}

	async function loadSchedulesForDate() {
		schedules = await coachApi.listSchedules({ date: newBooking.date });
	}

	function openDrawer(booking: Booking) {
		selectedBookingId = booking.id;
		drawerOpen = true;
	}

	function handleBookingUpdated(updated: Booking) {
		const index = bookings.findIndex(b => b.id === updated.id);
		if (index !== -1) {
			bookings[index] = updated;
			bookings = bookings;
		}
	}

	async function handleDrawerClose() {
		drawerOpen = false;
		selectedBookingId = null;
		bookings = await bookingApi.list();
	}

	async function handleCreateBooking() {
		if (!newBooking.memberId || !newBooking.bayId) {
			alert('请选择会员和打位');
			return;
		}

		const startAt = dayjs(`${newBooking.date}T${newBooking.startTime}`).toISOString();
		const endAt = dayjs(`${newBooking.date}T${newBooking.endTime}`).toISOString();

		try {
			await bookingApi.create({
				memberId: newBooking.memberId,
				bayId: newBooking.bayId,
				coachId: newBooking.coachId || undefined,
				scheduleId: newBooking.scheduleId || undefined,
				startAt,
				endAt,
				guestCount: newBooking.guestCount,
				includeCoaching: newBooking.includeCoaching,
				paymentMethod: newBooking.paymentMethod,
				remark: newBooking.remark || undefined
			});

			showBookingModal = false;
			resetBookingForm();
			bookings = await bookingApi.list();
			if (newBooking.scheduleId) {
				schedules = await coachApi.listSchedules({ date: newBooking.date });
			}
		} catch (e: any) {
			alert(e.message || '创建预约失败');
		}
	}

	function resetBookingForm() {
		newBooking = {
			memberId: '',
			bayId: '',
			coachId: '',
			scheduleId: '',
			date: dayjs().format('YYYY-MM-DD'),
			startTime: '10:00',
			endTime: '12:00',
			guestCount: 1,
			includeCoaching: false,
			paymentMethod: 'wallet',
			remark: ''
		};
	}

	function openBookingModal() {
		resetBookingForm();
		showBookingModal = true;
	}

	function formatTime(date: string) {
		return dayjs(date).format('HH:mm');
	}

	function formatDateTime(date: string) {
		return dayjs(date).format('MM-DD HH:mm');
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">预约管理</h1>
			<p class="text-gray-500">查看和管理所有预约记录</p>
		</div>
		<button class="btn btn-primary" on:click={openBookingModal}>
			+ 新建预约
		</button>
	</div>

	<div class="card p-4">
		<div class="flex flex-wrap gap-4">
			<div class="w-48">
				<label class="label">日期</label>
				<input type="date" class="input" bind:value={dateFilter} />
			</div>
			<div class="w-40">
				<label class="label">状态</label>
				<select class="select" bind:value={statusFilter}>
					<option value="">全部</option>
					<option value="pending">待确认</option>
					<option value="confirmed">已确认</option>
					<option value="checked_in">已到场</option>
					<option value="completed">已完成</option>
					<option value="no_show">未到场</option>
					<option value="exception">异常</option>
				</select>
			</div>
			<div class="flex-1 min-w-64">
				<label class="label">搜索</label>
				<input
					type="text"
					class="input"
					placeholder="搜索会员姓名、电话、打位..."
					bind:value={searchQuery}
				/>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="table">
				<thead>
					<tr>
						<th>会员</th>
						<th>打位</th>
						<th>时间</th>
						<th>时长</th>
						<th>金额</th>
						<th>教练</th>
						<th>状态</th>
						<th>异常</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#if filteredBookings.length === 0}
						<tr>
							<td colspan="9" class="text-center py-12 text-gray-400">
								暂无预约记录
							</td>
						</tr>
					{:else}
						{#each filteredBookings as booking}
							<tr class="cursor-pointer hover:bg-gray-50" on:click={() => openDrawer(booking)}>
								<td>
									<div>
										<p class="font-medium text-gray-900">{booking.memberName}</p>
										<p class="text-xs text-gray-500">{booking.memberPhone}</p>
									</div>
								</td>
								<td>
									<span class="font-medium">{booking.bayNumber}</span>
								</td>
								<td>
									<p class="text-gray-900">{formatDateTime(booking.startAt)}</p>
									<p class="text-xs text-gray-500">至 {formatTime(booking.endAt)}</p>
								</td>
								<td>{booking.durationHours}小时</td>
								<td>
									<div>
										<p class="font-medium text-gray-900">¥{booking.totalAmount.toFixed(2)}</p>
										<p class="text-xs text-gray-500">已付 ¥{booking.paidAmount.toFixed(2)}</p>
									</div>
								</td>
								<td>
									{#if booking.coachName}
										<span class="text-green-600">{booking.coachName}</span>
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
								<td>
									<span class="badge {STATUS_COLORS[booking.status]}">
										{STATUS_LABELS[booking.status]}
									</span>
								</td>
								<td>
									{#if booking.exceptions && booking.exceptions.length > 0}
										<div class="flex flex-wrap gap-1">
											{#each booking.exceptions as ex}
												<span class="badge {EXCEPTION_SEVERITY_COLORS[ex.severity]}">
													{EXCEPTION_TYPE_LABELS[ex.type]}
												</span>
											{/each}
										</div>
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
								<td>
									<button
										class="btn btn-outline text-sm"
										on:click|stopPropagation={() => openDrawer(booking)}
									>
										查看详情
									</button>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>

		<div class="text-sm text-gray-500">
			共 {filteredBookings.length} 条记录
		</div>
	{/if}
</div>

{#if showBookingModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showBookingModal = false}>
		<div class="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" on:click|stopPropagation>
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">新建预约</h2>
					<button class="p-2 hover:bg-gray-100 rounded-lg" on:click={() => showBookingModal = false}>
						<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-6">
				<div class="space-y-5">
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="label">选择会员 <span class="text-red-500">*</span></label>
							<select class="select" bind:value={newBooking.memberId}>
								<option value="">请选择会员</option>
								{#each members as member}
									<option value={member.id}>{member.name} - {member.phone}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="label">选择打位 <span class="text-red-500">*</span></label>
							<select class="select" bind:value={newBooking.bayId}>
								<option value="">请选择打位</option>
								{#each bays as bay}
									<option value={bay.id}>{bay.bayNumber} - ¥{bay.hourlyRate}/小时</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="grid grid-cols-3 gap-4">
						<div>
							<label class="label">日期 <span class="text-red-500">*</span></label>
							<input type="date" class="input" bind:value={newBooking.date} />
						</div>
						<div>
							<label class="label">开始时间 <span class="text-red-500">*</span></label>
							<input type="time" class="input" bind:value={newBooking.startTime} />
						</div>
						<div>
							<label class="label">结束时间 <span class="text-red-500">*</span></label>
							<input type="time" class="input" bind:value={newBooking.endTime} />
						</div>
					</div>

					<div>
						<label class="label">选择教练排班（可选）</label>
						<select class="select" bind:value={newBooking.scheduleId}>
							<option value="">不选择排班</option>
							{#each availableSchedules as schedule}
								<option value={schedule.id}>
									{schedule.coachName} - {schedule.type} ({dayjs(schedule.startAt).format('HH:mm')}-{dayjs(schedule.endAt).format('HH:mm')}) - {schedule.bookedCount}/{schedule.capacity}人
								</option>
							{/each}
						</select>
						{#if availableSchedules.length === 0 && newBooking.date}
							<p class="text-xs text-gray-400 mt-1">该日期暂无可用排班</p>
						{/if}
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label class="label">来访人数</label>
							<input type="number" class="input" min="1" bind:value={newBooking.guestCount} />
						</div>
						<div>
							<label class="label">支付方式</label>
							<select class="select" bind:value={newBooking.paymentMethod}>
								<option value="wallet">储值卡扣款</option>
								<option value="cash">现金</option>
								<option value="card">刷卡</option>
							</select>
						</div>
					</div>

					<div>
						<label class="label">
							<input type="checkbox" bind:checked={newBooking.includeCoaching} class="mr-2" />
							包含教学服务 (+¥200/小时)
						</label>
					</div>

					<div>
						<label class="label">备注</label>
						<textarea class="input" rows="2" placeholder="可选备注..." bind:value={newBooking.remark}></textarea>
					</div>
				</div>
			</div>

			<div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
				<button class="btn btn-secondary" on:click={() => showBookingModal = false}>
					取消
				</button>
				<button class="btn btn-primary" on:click={handleCreateBooking}>
					创建预约
				</button>
			</div>
		</div>
	</div>
{/if}

<ExceptionDrawer
	bookingId={selectedBookingId}
	open={drawerOpen}
	on:close={handleDrawerClose}
	on:updated={(e) => handleBookingUpdated(e.detail)}
/>
