<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingApi } from '$lib/api/client';
	import type { Exception, Booking } from '$lib/types';
	import dayjs from 'dayjs';
	import ExceptionDrawer from '$lib/components/ExceptionDrawer.svelte';

	let exceptions: Exception[] = [];
	let bookings: Record<string, Booking> = {};
	let loading = true;
	let statusFilter = 'pending';
	let typeFilter = '';
	let selectedBookingId = '';
	let drawerOpen = false;

	$: filteredExceptions = exceptions.filter(e => {
		const matchesStatus = !statusFilter || e.status === statusFilter;
		const matchesType = !typeFilter || e.type === typeFilter;
		return matchesStatus && matchesType;
	});

	$: pendingCount = exceptions.filter(e => e.status === 'pending').length;
	$: processingCount = exceptions.filter(e => e.status === 'processing').length;
	$: resolvedCount = exceptions.filter(e => e.status === 'resolved').length;
	$: types = [...new Set(exceptions.map(e => e.type))];

	onMount(async () => {
		try {
			const result = await bookingApi.listExceptions();
			exceptions = result;
		} finally {
			loading = false;
		}
	});

	async function openBookingDetail(bookingId: string) {
		selectedBookingId = bookingId;
		drawerOpen = true;
	}

	function formatDateTime(date: string) {
		return dayjs(date).format('MM-DD HH:mm');
	}

	function getTypeColor(type: string) {
		switch (type) {
			case 'no_show': return 'bg-red-100 text-red-700';
			case 'late': return 'bg-orange-100 text-orange-700';
			case 'overstay': return 'bg-purple-100 text-purple-700';
			case 'payment_issue': return 'bg-yellow-100 text-yellow-700';
			case 'equipment_damage': return 'bg-rose-100 text-rose-700';
			case 'complaint': return 'bg-red-100 text-red-700';
			case 'schedule_conflict': return 'bg-amber-100 text-amber-700';
			case 'bay_issue': return 'bg-gray-100 text-gray-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getTypeLabel(type: string) {
		switch (type) {
			case 'no_show': return '未到场';
			case 'late': return '迟到';
			case 'overstay': return '超时';
			case 'payment_issue': return '支付问题';
			case 'equipment_damage': return '器材损坏';
			case 'complaint': return '客户投诉';
			case 'schedule_conflict': return '排班冲突';
			case 'bay_issue': return '打位故障';
			default: return type;
		}
	}

	function getPriorityColor(priority: string) {
		switch (priority) {
			case 'high': return 'bg-red-100 text-red-700';
			case 'medium': return 'bg-yellow-100 text-yellow-700';
			case 'low': return 'bg-green-100 text-green-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getPriorityLabel(priority: string) {
		switch (priority) {
			case 'high': return '高';
			case 'medium': return '中';
			case 'low': return '低';
			default: return priority;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending': return 'bg-red-100 text-red-700';
			case 'processing': return 'bg-blue-100 text-blue-700';
			case 'resolved': return 'bg-green-100 text-green-700';
			case 'closed': return 'bg-gray-100 text-gray-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'pending': return '待处理';
			case 'processing': return '处理中';
			case 'resolved': return '已解决';
			case 'closed': return '已关闭';
			default: return status;
		}
	}

	async function handleBookingUpdated(updated: Booking) {
		if (updated.exceptions) {
			exceptions = exceptions.map(e => {
				const matching = updated.exceptions?.find(ne => ne.id === e.id);
				return matching || e;
			});
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">异常处理</h1>
			<p class="text-gray-500">查看和处理所有异常工单</p>
		</div>
	</div>

	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ label: '待处理', count: pendingCount, color: 'red', value: 'pending' },
			{ label: '处理中', count: processingCount, color: 'blue', value: 'processing' },
			{ label: '已解决', count: resolvedCount, color: 'green', value: 'resolved' },
			{ label: '全部', count: exceptions.length, color: 'gray', value: '' }
		] as const}
			<button
				class="card p-5 text-left transition-all {statusFilter === tab.value ? 'ring-2 ring-offset-2 ' +
					(tab.color === 'red' ? 'ring-red-500' :
					 tab.color === 'blue' ? 'ring-blue-500' :
					 tab.color === 'green' ? 'ring-green-500' : 'ring-gray-500')
					: 'hover:bg-gray-50'}"
				on:click={() => statusFilter = tab.value}
			>
				<p class="text-sm text-gray-500">{tab.label}</p>
				<p class="text-3xl font-bold text-gray-900 mt-1">{tab.count}</p>
			</button>
		{/each}
	</div>

	<div class="card p-4">
		<div class="flex gap-4">
			<div class="w-48">
				<label class="label">异常类型</label>
				<select class="select" bind:value={typeFilter}>
					<option value="">全部类型</option>
					{#each types as type}
						<option value={type}>{getTypeLabel(type)}</option>
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
		<div class="card overflow-hidden">
			{#if filteredExceptions.length === 0}
				<div class="p-12 text-center text-gray-400">
					暂无异常记录
				</div>
			{:else}
				<table class="table">
					<thead>
						<tr>
							<th>异常编号</th>
							<th>异常类型</th>
							<th>优先级</th>
							<th>状态</th>
							<th>相关会员</th>
							<th>上报人</th>
							<th>上报时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredExceptions as exp}
							<tr>
								<td>
									<span class="font-mono text-sm text-gray-600">#{exp.id.slice(0, 8)}</span>
								</td>
								<td>
									<span class="badge {getTypeColor(exp.type)}">
										{getTypeLabel(exp.type)}
									</span>
								</td>
								<td>
									<span class="badge {getPriorityColor(exp.priority)}">
										{getPriorityLabel(exp.priority)}
									</span>
								</td>
								<td>
									<span class="badge {getStatusColor(exp.status)}">
										{getStatusLabel(exp.status)}
									</span>
								</td>
								<td>
									{exp.memberName || '-'}
								</td>
								<td>
									{exp.reportedByName}
								</td>
								<td>{formatDateTime(exp.createdAt)}</td>
								<td>
									<button
										class="btn btn-outline text-sm"
										on:click={() => openBookingDetail(exp.bookingId)}
									>
										查看详情
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/if}
</div>

<ExceptionDrawer
	bookingId={selectedBookingId}
	open={drawerOpen}
	on:close={() => drawerOpen = false}
	on:updated={(e) => handleBookingUpdated(e.detail)}
/>
