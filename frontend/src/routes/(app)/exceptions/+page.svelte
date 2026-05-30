<script lang="ts">
	import { onMount } from 'svelte';
	import { bookingApi } from '$lib/api/client';
	import type { Exception, Booking, ExceptionStatus, ExceptionType } from '$lib/types';
	import { EXCEPTION_STATUS_COLORS, EXCEPTION_STATUS_LABELS, EXCEPTION_TYPE_LABELS, EXCEPTION_SEVERITY_COLORS, EXCEPTION_SEVERITY_LABELS } from '$lib/types';
	import dayjs from 'dayjs';
	import ExceptionDrawer from '$lib/components/ExceptionDrawer.svelte';

	interface ExceptionWithMember extends Exception {
		memberName?: string;
	}

	let exceptions: ExceptionWithMember[] = [];
	let loading = true;
	let statusFilter: ExceptionStatus | '' = 'open';
	let typeFilter: ExceptionType | '' = '';
	let selectedBookingId = '';
	let drawerOpen = false;

	$: filteredExceptions = exceptions.filter(e => {
		const matchesStatus = !statusFilter || e.status === statusFilter;
		const matchesType = !typeFilter || e.type === typeFilter;
		return matchesStatus && matchesType;
	});

	$: openCount = exceptions.filter(e => e.status === 'open').length;
	$: investigatingCount = exceptions.filter(e => e.status === 'investigating').length;
	$: resolvedCount = exceptions.filter(e => e.status === 'resolved').length;
	$: types = [...new Set(exceptions.map(e => e.type))];

	onMount(async () => {
		await refreshExceptions();
	});

	async function refreshExceptions() {
		try {
			exceptions = await bookingApi.listAllExceptions() as ExceptionWithMember[];
		} finally {
			loading = false;
		}
	}

	function openBookingDetail(bookingId: string) {
		selectedBookingId = bookingId;
		drawerOpen = true;
	}

	function formatDateTime(date: string) {
		return dayjs(date).format('MM-DD HH:mm');
	}

	async function handleBookingUpdated(updated: Booking) {
		if (updated.exceptions) {
			exceptions = exceptions.map(e => {
				const matching = updated.exceptions?.find(ne => ne.id === e.id);
				if (matching) {
					return { ...matching, memberName: e.memberName };
				}
				return e;
			});
		}
	}

	async function handleDrawerClose() {
		drawerOpen = false;
		await refreshExceptions();
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
			{ label: '待处理', count: openCount, color: 'red', value: 'open' as const },
			{ label: '处理中', count: investigatingCount, color: 'yellow', value: 'investigating' as const },
			{ label: '已解决', count: resolvedCount, color: 'green', value: 'resolved' as const },
			{ label: '全部', count: exceptions.length, color: 'gray', value: '' as const }
		]}
			<button
				class="card p-5 text-left transition-all {statusFilter === tab.value ? 'ring-2 ring-offset-2 ' +
					(tab.color === 'red' ? 'ring-red-500' :
					 tab.color === 'yellow' ? 'ring-yellow-500' :
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
						<option value={type}>{EXCEPTION_TYPE_LABELS[type] || type}</option>
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
									<span class="badge bg-gray-100 text-gray-700">
										{EXCEPTION_TYPE_LABELS[exp.type] || exp.type}
									</span>
								</td>
								<td>
									<span class="badge {EXCEPTION_SEVERITY_COLORS[exp.severity] || 'bg-gray-100 text-gray-700'}">
										{EXCEPTION_SEVERITY_LABELS[exp.severity] || exp.severity}
									</span>
								</td>
								<td>
									<span class="badge {EXCEPTION_STATUS_COLORS[exp.status] || 'bg-gray-100 text-gray-700'}">
										{EXCEPTION_STATUS_LABELS[exp.status] || exp.status}
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
	on:close={handleDrawerClose}
	on:updated={(e) => handleBookingUpdated(e.detail)}
/>
