<script lang="ts">
	import { onMount } from 'svelte';
	import { api, statusMap, appealTypeMap } from '$lib/api';
	import { user, rolePermissions } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	let appeals = [];
	let selectedAppeal = null;
	let filterStatus = '';
	let loading = false;
	let timeline = [];

	$: permissions = $user ? rolePermissions[$user.role] : null;

	async function loadAppeals() {
		loading = true;
		try {
			appeals = await api.getAppeals(filterStatus || undefined);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function selectAppeal(appeal) {
		selectedAppeal = appeal;
		timeline = await api.getTimeline(appeal.order_id);
	}

	let reviewForm = {
		status: 'approved',
		review_note: '',
		subsidy: 10
	};

	async function handleReview() {
		if (!selectedAppeal) return;
		await api.reviewAppeal(selectedAppeal.id, {
			status: reviewForm.status,
			review_note: reviewForm.review_note,
			subsidy: reviewForm.subsidy
		});
		await loadAppeals();
		selectAppeal(appeals.find(a => a.id === selectedAppeal.id));
	}

	async function calculateSubsidy() {
		if (!selectedAppeal) return;
		const result = await api.calculateSubsidy({
			type: selectedAppeal.type,
			base_fee: selectedAppeal.order.delivery_fee,
			delay_time: 20
		});
		reviewForm.subsidy = result.amount;
	}

	onMount(() => {
		loadAppeals();
	});

	$: filterStatus, loadAppeals();
</script>

<div class="flex h-[calc(100vh-73px)]">
	<div class="w-1/2 border-r border-gray-200 flex flex-col bg-white">
		<div class="p-4 border-b border-gray-200 flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<h2 class="text-lg font-semibold">
					{#if $user?.role === 'runner'}
						我的申诉
					{:else}
						申诉处理
					{/if}
				</h2>
				<select
					bind:value={filterStatus}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm"
				>
					<option value="">全部状态</option>
					<option value="pending">待审核</option>
					<option value="approved">已通过</option>
					<option value="rejected">已驳回</option>
				</select>
			</div>
			{#if $user?.role === 'runner' || $user?.role === 'customer_service'}
				<a
					href="/appeals/new"
					class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
				>
					+ 提交申诉
				</a>
			{/if}
		</div>

		<div class="flex-1 overflow-auto">
			{#if loading}
				<div class="flex items-center justify-center h-full text-gray-500">加载中...</div>
			{:else if appeals.length === 0}
				<div class="flex items-center justify-center h-full text-gray-500">暂无申诉</div>
			{:else}
				{#each appeals as appeal}
					<div
						class="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
						class:bg-purple-50={selectedAppeal?.id === appeal.id}
						on:click={() => selectAppeal(appeal)}
					>
						<div class="flex items-center justify-between mb-2">
							<span class="font-mono text-sm text-gray-600">{appeal.order.order_no}</span>
							<span class="px-2 py-1 text-xs rounded-full
								{appeal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
								{appeal.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
								{appeal.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}">
								{appeal.status === 'pending' ? '待审核' : 
								 appeal.status === 'approved' ? '已通过' : '已驳回'}
							</span>
						</div>
						<div class="text-sm font-medium text-gray-900 mb-1">
							{appealTypeMap[appeal.type] || appeal.type}
						</div>
						<div class="text-sm text-gray-500 mb-2 line-clamp-2">{appeal.reason}</div>
						<div class="flex items-center justify-between text-xs text-gray-500">
							<span>{appeal.runner.name}</span>
							<span>{appeal.created_at?.substring(0, 10)}</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<div class="w-1/2 flex flex-col bg-gray-50">
		{#if !selectedAppeal}
			<div class="flex-1 flex items-center justify-center text-gray-500">
				选择左侧申诉查看详情
			</div>
		{:else}
			<div class="p-6 border-b border-gray-200 bg-white">
				<div class="flex items-center justify-between">
					<div>
						<h3 class="text-xl font-bold">{selectedAppeal.order.order_no}</h3>
						<span class="px-3 py-1 text-sm rounded-full
							{selectedAppeal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
							{selectedAppeal.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
							{selectedAppeal.status === 'rejected' ? 'bg-red-100 text-red-700' : ''}">
							{selectedAppeal.status === 'pending' ? '待审核' : 
							 selectedAppeal.status === 'approved' ? '已通过' : '已驳回'}
						</span>
					</div>
				</div>
			</div>

			<div class="flex-1 overflow-auto p-6 space-y-6">
				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">申诉信息</h4>
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-gray-500">类型</span>
							<span class="font-medium">{appealTypeMap[selectedAppeal.type] || selectedAppeal.type}</span>
						</div>
						<div>
							<div class="text-gray-500 mb-1">申诉原因</div>
							<div class="bg-gray-50 p-3 rounded-lg text-sm">{selectedAppeal.reason}</div>
						</div>
						{#if selectedAppeal.evidence_url}
							<div>
								<div class="text-gray-500 mb-1">证据截图</div>
								<div class="bg-gray-100 h-40 rounded-lg flex items-center justify-center text-gray-400">
									📷 {selectedAppeal.evidence_url}
								</div>
							</div>
						{/if}
						<div class="flex items-center justify-between">
							<span class="text-gray-500">提交时间</span>
							<span class="font-medium">{selectedAppeal.created_at}</span>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">订单信息</h4>
					<div class="space-y-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-500">商家</span>
							<span>{selectedAppeal.order.merchant_name}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-500">配送费</span>
							<span>¥{selectedAppeal.order.delivery_fee?.toFixed(2)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-500">当前状态</span>
							<span class={statusMap[selectedAppeal.order.status]?.color || ''}>
								{statusMap[selectedAppeal.order.status]?.label || selectedAppeal.order.status}
							</span>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">骑手信息</h4>
					<div class="flex items-center space-x-4">
						<div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
							{selectedAppeal.runner.name[0]}
						</div>
						<div>
							<div class="font-medium">{selectedAppeal.runner.name}</div>
							<div class="text-sm text-gray-500">{selectedAppeal.runner.phone}</div>
						</div>
					</div>
				</div>

				{#if selectedAppeal.status === 'pending' && $user?.role === 'manager'}
					<div class="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500">
						<h4 class="font-semibold mb-4 text-gray-900">审核处理</h4>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">审核结果</label>
								<select
									bind:value={reviewForm.status}
									class="w-full px-4 py-2 border border-gray-300 rounded-lg"
								>
									<option value="approved">通过申诉</option>
									<option value="rejected">驳回申诉</option>
								</select>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">审核备注</label>
								<textarea
									bind:value={reviewForm.review_note}
									class="w-full px-4 py-2 border border-gray-300 rounded-lg"
									rows="3"
									placeholder="请输入审核备注..."
								/>
							</div>
							{#if reviewForm.status === 'approved'}
								<div>
									<div class="flex items-center justify-between mb-1">
										<label class="text-sm font-medium text-gray-700">补贴金额 (元)</label>
										<button
											on:click={calculateSubsidy}
											class="text-sm text-blue-600 hover:underline"
										>
											智能计算
										</button>
									</div>
									<input
										type="number"
										bind:value={reviewForm.subsidy}
										class="w-full px-4 py-2 border border-gray-300 rounded-lg"
									/>
								</div>
							{/if}
							<button
								on:click={handleReview}
								class="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
							>
								提交审核
							</button>
						</div>
					</div>
				{/if}

				{#if selectedAppeal.status !== 'pending'}
					<div class="bg-white rounded-xl p-5 shadow-sm">
						<h4 class="font-semibold mb-4 text-gray-900">审核结果</h4>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-gray-500">审核人</span>
								<span class="font-medium">{selectedAppeal.reviewer?.name || '-'}</span>
							</div>
							<div>
								<div class="text-gray-500 mb-1">审核备注</div>
								<div class="bg-gray-50 p-3 rounded-lg text-sm">{selectedAppeal.review_note || '-'}</div>
							</div>
							{#if selectedAppeal.subsidy}
								<div class="flex items-center justify-between">
									<span class="text-gray-500">补贴金额</span>
									<span class="font-medium text-green-600">¥{selectedAppeal.subsidy.amount?.toFixed(2)}</span>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<div class="bg-white rounded-xl p-5 shadow-sm">
					<h4 class="font-semibold mb-4 text-gray-900">订单时间线</h4>
					<div class="space-y-4">
						{#each timeline as event, i}
							<div class="flex">
								<div class="flex flex-col items-center mr-4">
									<div class="w-3 h-3 rounded-full bg-purple-500"></div>
									{#if i < timeline.length - 1}
										<div class="w-0.5 h-full bg-gray-200 mt-1"></div>
									{/if}
								</div>
								<div class="flex-1 pb-4">
									<div class="text-sm font-medium text-gray-900">{event.content}</div>
									<div class="text-xs text-gray-500 mt-1">{event.created_at}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
