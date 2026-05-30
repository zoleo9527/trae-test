<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingApi, memberApi } from '$lib/api/client';
	import type { Booking, Member } from '$lib/types';
	import { STATUS_COLORS, STATUS_LABELS, EXCEPTION_SEVERITY_COLORS, EXCEPTION_TYPE_LABELS } from '$lib/types';
	import ExceptionDrawer from '$lib/components/ExceptionDrawer.svelte';
	import dayjs from 'dayjs';

	let bookings: Booking[] = [];
	let members: Member[] = [];
	let loading = true;
	let statusFilter = '';
	let dateFilter = dayjs().format('YYYY-MM-DD');
	let searchQuery = '';

	let selectedBookingId: string | null = null;
	let drawerOpen = false;

	$: filteredBookings = bookings.filter(b => {
		const matchesStatus = !statusFilter || b.status === statusFilter;
		const matchesDate = !dateFilter || dayjs(b.startAt).format('YYYY-MM-DD') === dateFilter;
		const matchesSearch = !searchQuery ||
			b.memberName.includes(searchQuery) ||
			b.bayNumber.includes(searchQuery) ||
			b.memberPhone.includes(searchQuery);
		return matchesStatus && matchesDate && matchesSearch;
	});

	onMount(async () => {
		try {
			[bookings, members] = await Promise.all([
				bookingApi.list(),
				memberApi.list()
			]);
		} finally {
			loading = false;
		}
	});

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
		<button class="btn btn-primary">
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

<ExceptionDrawer
	bookingId={selectedBookingId}
	open={drawerOpen}
	on:close={() => drawerOpen = false}
	on:updated={(e) => handleBookingUpdated(e.detail)}
/>
