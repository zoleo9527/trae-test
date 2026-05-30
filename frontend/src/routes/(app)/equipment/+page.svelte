<script lang="ts">
	import { onMount } from 'svelte';
	import { equipmentApi, bookingApi, memberApi } from '$lib/api/client';
	import type { Equipment, EquipmentRental, Booking, Member } from '$lib/types';
	import { auth } from '$lib/stores/auth';
	import dayjs from 'dayjs';

	let equipment: Equipment[] = [];
	let rentals: EquipmentRental[] = [];
	let bookings: Booking[] = [];
	let members: Member[] = [];
	let loading = true;
	let activeTab = 'list';
	let statusFilter = '';
	let categoryFilter = '';

	let showBorrowModal = false;
	let showReturnModal = false;
	let selectedEquipment: Equipment | null = null;
	let selectedRental: EquipmentRental | null = null;

	let borrowForm = {
		bookingId: '',
		memberId: ''
	};

	let returnForm = {
		conditionIn: 'good',
		damageReported: false,
		damageNote: ''
	};

	$: categories = [...new Set(equipment.map(e => e.category))];
	$: filteredEquipment = equipment.filter(e => {
		const matchesStatus = !statusFilter || e.status === statusFilter;
		const matchesCategory = !categoryFilter || e.category === categoryFilter;
		return matchesStatus && matchesCategory;
	});
	$: activeRentals = rentals.filter(r => !r.returnedAt);
	$: availableBookings = bookings.filter(b => b.status === 'checked_in');
	$: canManage = $auth.user?.role === 'reception' || $auth.user?.role === 'venue_manager';

	onMount(async () => {
		try {
			[equipment, rentals, bookings, members] = await Promise.all([
				equipmentApi.list(),
				equipmentApi.listRentals(),
				bookingApi.list(),
				memberApi.list()
			]);
		} finally {
			loading = false;
		}
	});

	function formatDateTime(date: string) {
		return dayjs(date).format('MM-DD HH:mm');
	}

	function getMemberName(memberId: string) {
		const member = members.find(m => m.id === memberId);
		return member ? member.name : memberId;
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

	function openBorrowModal(equipment: Equipment) {
		selectedEquipment = equipment;
		borrowForm = {
			bookingId: availableBookings[0]?.id || '',
			memberId: availableBookings[0]?.memberId || ''
		};
		showBorrowModal = true;
	}

	$: if (borrowForm.bookingId) {
		const booking = bookings.find(b => b.id === borrowForm.bookingId);
		if (booking) {
			borrowForm.memberId = booking.memberId;
		}
	}

	function openReturnModalFromEquipment(equipment: Equipment) {
		const rental = activeRentals.find(r => r.equipmentId === equipment.id);
		if (rental) {
			openReturnModal(rental);
		}
	}

	function openReturnModal(rental: EquipmentRental) {
		selectedRental = rental;
		returnForm = {
			conditionIn: 'good',
			damageReported: false,
			damageNote: ''
		};
		showReturnModal = true;
	}

	async function handleBorrow() {
		if (!selectedEquipment || !borrowForm.bookingId) {
			alert('请选择关联预约');
			return;
		}

		try {
			await equipmentApi.borrow(selectedEquipment.id, {
				bookingId: borrowForm.bookingId,
				memberId: borrowForm.memberId
			});

			showBorrowModal = false;
			selectedEquipment = null;
			[equipment, rentals] = await Promise.all([
				equipmentApi.list(),
				equipmentApi.listRentals()
			]);
		} catch (e: any) {
			alert(e.message || '借出失败');
		}
	}

	async function handleReturn() {
		if (!selectedRental) return;

		try {
			await equipmentApi.return(selectedRental.equipmentId, {
				conditionIn: returnForm.conditionIn,
				damageReported: returnForm.damageReported,
				damageNote: returnForm.damageNote
			});

			showReturnModal = false;
			selectedRental = null;
			[equipment, rentals] = await Promise.all([
				equipmentApi.list(),
				equipmentApi.listRentals()
			]);

			if (returnForm.damageReported) {
				alert('器材损坏，已自动提醒创建异常单');
			}
		} catch (e: any) {
			alert(e.message || '归还失败');
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
											<button class="btn btn-outline text-sm" on:click={() => openBorrowModal(item)}>
												借出
											</button>
										{:else if item.status === 'in_use'}
											<button class="btn btn-primary text-sm" on:click={() => openReturnModalFromEquipment(item)}>
												归还
											</button>
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
									{getMemberName(rental.memberId)}
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
										<button class="btn btn-primary text-sm" on:click={() => openReturnModal(rental)}>
											归还
										</button>
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

{#if showBorrowModal && selectedEquipment}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showBorrowModal = false}>
		<div class="bg-white rounded-2xl w-full max-w-md" on:click|stopPropagation>
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">借出器材</h2>
					<button class="p-2 hover:bg-gray-100 rounded-lg" on:click={() => showBorrowModal = false}>
						<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			</div>

			<div class="p-6 space-y-4">
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm text-gray-500">器材</p>
					<p class="font-medium text-gray-900">{selectedEquipment.name} - {selectedEquipment.brand}</p>
					<p class="text-sm text-gray-500">日租金：¥{selectedEquipment.dailyRate.toFixed(2)}</p>
				</div>

				<div>
					<label class="label">关联预约 <span class="text-red-500">*</span></label>
					<select class="select" bind:value={borrowForm.bookingId}>
						<option value="">请选择预约</option>
						{#each availableBookings as booking}
							<option value={booking.id}>
								{booking.memberName} - {booking.bayNumber} ({dayjs(booking.startAt).format('HH:mm')}-{dayjs(booking.endAt).format('HH:mm')})
							</option>
						{/each}
					</select>
					{#if availableBookings.length === 0}
						<p class="text-xs text-gray-400 mt-1">当前没有进行中的预约</p>
					{/if}
				</div>

				<div>
					<label class="label">会员</label>
					<select class="select" bind:value={borrowForm.memberId}>
						<option value="">请选择会员</option>
						{#each members as member}
							<option value={member.id}>{member.name} - {member.phone}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
				<button class="btn btn-secondary" on:click={() => showBorrowModal = false}>
					取消
				</button>
				<button class="btn btn-primary" on:click={handleBorrow} disabled={!borrowForm.bookingId}>
					确认借出
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showReturnModal && selectedRental}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showReturnModal = false}>
		<div class="bg-white rounded-2xl w-full max-w-md" on:click|stopPropagation>
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-gray-900">归还器材</h2>
					<button class="p-2 hover:bg-gray-100 rounded-lg" on:click={() => showReturnModal = false}>
						<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			</div>

			<div class="p-6 space-y-4">
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="text-sm text-gray-500">器材</p>
					<p class="font-medium text-gray-900">{selectedRental.equipmentName}</p>
					<p class="text-sm text-gray-500">
						借出时间：{formatDateTime(selectedRental.rentedAt)}
					</p>
					<p class="text-sm text-gray-500">
						借出成色：{getConditionLabel(selectedRental.conditionOut)}
					</p>
				</div>

				<div>
					<label class="label">归还成色 <span class="text-red-500">*</span></label>
					<select class="select" bind:value={returnForm.conditionIn}>
						<option value="new">全新</option>
						<option value="good">良好</option>
						<option value="fair">一般</option>
						<option value="damaged">损坏</option>
					</select>
				</div>

				<div>
					<label class="label">
						<input type="checkbox" bind:checked={returnForm.damageReported} class="mr-2" />
						有损坏需要记录
					</label>
				</div>

				{#if returnForm.damageReported || returnForm.conditionIn === 'damaged'}
					<div>
						<label class="label">损坏说明</label>
						<textarea class="input" rows="3" placeholder="请描述损坏情况..." bind:value={returnForm.damageNote}></textarea>
					</div>
				{/if}
			</div>

			<div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
				<button class="btn btn-secondary" on:click={() => showReturnModal = false}>
					取消
				</button>
				<button class="btn btn-primary" on:click={handleReturn}>
					确认归还
				</button>
			</div>
		</div>
	</div>
{/if}
