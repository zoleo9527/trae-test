<script lang="ts">
	import { onMount } from 'svelte';
	import { equipmentApi } from '$lib/api/client';
	import type { Equipment, EquipmentRental } from '$lib/types';
	import { auth } from '$lib/stores/auth';
	import dayjs from 'dayjs';

	let equipment: Equipment[] = [];
	let rentals: EquipmentRental[] = [];
	let loading = true;
	let activeTab = 'list';
	let statusFilter = '';
	let categoryFilter = '';

	$: categories = [...new Set(equipment.map(e => e.category))];
	$: filteredEquipment = equipment.filter(e => {
		const matchesStatus = !statusFilter || e.status === statusFilter;
		const matchesCategory = !categoryFilter || e.category === categoryFilter;
		return matchesStatus && matchesCategory;
	});
	$: activeRentals = rentals.filter(r => !r.returnedAt);
	$: canManage = $auth.user?.role === 'reception' || $auth.user?.role === 'venue_manager';

	onMount(async () => {
		try {
			[equipment, rentals] = await Promise.all([
				equipmentApi.list(),
				equipmentApi.listRentals()
			]);
		} finally {
			loading = false;
		}
	});

	function formatDateTime(date: string) {
		return dayjs(date).format('MM-DD HH:mm');
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'available': return 'bg-green-100 text-green-700';
			case 'in_use': return 'bg-blue-100 text-blue-700';
			case 'maintenance': return 'bg-yellow-100 text-yellow-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusLabel(status: string) {
		switch (status) {
			case 'available': return '可用';
			case 'in_use': return '使用中';
			case 'maintenance': return '维护中';
			default: return status;
		}
	}

	function getConditionColor(condition: string) {
		switch (condition) {
			case 'new': return 'bg-green-100 text-green-700';
			case 'good': return 'bg-blue-100 text-blue-700';
			case 'fair': return 'bg-yellow-100 text-yellow-700';
			case 'damaged': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}

	function getConditionLabel(condition: string) {
		switch (condition) {
			case 'new': return '全新';
			case 'good': return '良好';
			case 'fair': return '一般';
			case 'damaged': return '损坏';
			default: return condition;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">器材管理</h1>
			<p class="text-gray-500">管理器材借还和库存</p>
		</div>
		{#if canManage}
			<button class="btn btn-primary">
				+ 新增器材
			</button>
		{/if}
	</div>

	<div class="border-b border-gray-200">
		<nav class="flex gap-8">
			{#each [
				{ id: 'list', label: '器材清单', count: equipment.length },
				{ id: 'rentals', label: '借出中', count: activeRentals.length }
			] as tab}
				<button
					class="py-3 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id
						? 'border-green-600 text-green-600'
						: 'border-transparent text-gray-500 hover:text-gray-700'}"
					on:click={() => activeTab = tab.id}
				>
					{tab.label}
					<span class="ml-1.5 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">
						{tab.count}
					</span>
				</button>
			{/each}
		</nav>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
		</div>
	{:else if activeTab === 'list'}
		<div class="card p-4">
			<div class="flex gap-4 mb-4">
				<div class="w-40">
					<label class="label">状态</label>
					<select class="select" bind:value={statusFilter}>
						<option value="">全部</option>
						<option value="available">可用</option>
						<option value="in_use">使用中</option>
						<option value="maintenance">维护中</option>
					</select>
				</div>
				<div class="w-40">
					<label class="label">分类</label>
					<select class="select" bind:value={categoryFilter}>
						<option value="">全部</option>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<div class="card overflow-hidden">
			<table class="table">
				<thead>
					<tr>
						<th>器材名称</th>
						<th>分类</th>
						<th>品牌</th>
						<th>序列号</th>
						<th>状态</th>
						<th>成色</th>
						<th>日租金</th>
						{#if canManage}
							<th>操作</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#if filteredEquipment.length === 0}
						<tr>
							<td colspan="8" class="text-center py-12 text-gray-400">
								暂无器材
							</td>
						</tr>
					{:else}
						{#each filteredEquipment as item}
							<tr>
								<td>
									<span class="font-medium text-gray-900">{item.name}</span>
								</td>
								<td>{item.category}</td>
								<td>{item.brand}</td>
								<td class="font-mono text-sm text-gray-500">{item.serialNumber}</td>
								<td>
									<span class="badge {getStatusColor(item.status)}">
										{getStatusLabel(item.status)}
									</span>
								</td>
								<td>
									<span class="badge {getConditionColor(item.condition)}">
										{getConditionLabel(item.condition)}
									</span>
								</td>
								<td>¥{item.dailyRate.toFixed(2)}</td>
								{#if canManage}
									<td>
										{#if item.status === 'available'}
											<button class="btn btn-outline text-sm">借出</button>
										{:else if item.status === 'in_use'}
											<button class="btn btn-primary text-sm">归还</button>
										{/if}
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="card overflow-hidden">
			{#if activeRentals.length === 0}
				<div class="p-12 text-center text-gray-400">
					暂无借出器材
				</div>
			{:else}
				<table class="table">
					<thead>
						<tr>
							<th>器材</th>
							<th>会员</th>
							<th>借出时间</th>
							<th>借出状态</th>
							<th>费用</th>
							{#if canManage}
								<th>操作</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each activeRentals as rental}
							<tr>
								<td>
									<span class="font-medium text-gray-900">{rental.equipmentName}</span>
								</td>
								<td>
									{rental.memberId}
								</td>
								<td>{formatDateTime(rental.rentedAt)}</td>
								<td>
									<span class="badge bg-blue-100 text-blue-700">
										{getConditionLabel(rental.conditionOut)}
									</span>
								</td>
								<td>¥{rental.fee.toFixed(2)}</td>
								{#if canManage}
									<td>
										<button class="btn btn-primary text-sm">归还</button>
									</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/if}
</div>
