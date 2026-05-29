<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api';
	import { user } from '$lib/stores/auth';

	let subsidies = [];
	let selectedSubsidy = null;
	let filterStatus = '';
	let loading = false;

	async function loadSubsidies() {
		loading = true;
		try {
			subsidies = await api.getSubsidies(filterStatus || undefined);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadSubsidies();
	});

	$: filterStatus, loadSubsidies();
</script>

<div class="p-8">
	<div class="bg-white rounded-xl shadow-sm">
		<div class="p-4 border-b border-gray-200 flex items-center justify-between">
			<div class="flex items-center space-x-4">
				<h2 class="text-lg font-semibold">
					{#if $user?.role === 'runner'}
						我的补贴
					{:else}
						补贴管理
					{/if}
				</h2>
				<select
					bind:value={filterStatus}
					class="px-3 py-2 border border-gray-300 rounded-lg text-sm"
				>
					<option value="">全部状态</option>
					<option value="pending">待发放</option>
					<option value="paid">已发放</option>
				</select>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">骑手</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联申诉</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#if loading}
						<tr>
							<td colspan="7" class="px-6 py-8 text-center text-gray-500">加载中...</td>
						</tr>
					{:else if subsidies.length === 0}
						<tr>
							<td colspan="7" class="px-6 py-8 text-center text-gray-500">暂无补贴记录</td>
						</tr>
					{:else}
						{#each subsidies as subsidy}
							<tr 
								class="hover:bg-gray-50 cursor-pointer"
								on:click={() => selectedSubsidy = selectedSubsidy?.id === subsidy.id ? null : subsidy}
							>
								<td class="px-6 py-4 text-sm font-mono">{subsidy.order.order_no}</td>
								<td class="px-6 py-4">
									<div class="flex items-center">
										<div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm mr-2">
											{subsidy.runner.name[0]}
										</div>
										<span class="text-sm">{subsidy.runner.name}</span>
									</div>
								</td>
								<td class="px-6 py-4 text-sm font-medium text-green-600">¥{subsidy.amount.toFixed(2)}</td>
								<td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{subsidy.reason}</td>
								<td class="px-6 py-4">
									{#if subsidy.appeal}
										<span class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
											#{subsidy.appeal.id}
										</span>
									{:else}
										<span class="text-gray-400 text-sm">-</span>
									{/if}
								</td>
								<td class="px-6 py-4">
									<span class="px-2 py-1 text-xs rounded-full
										{subsidy.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
										{subsidy.status === 'pending' ? '待发放' : '已发放'}
									</span>
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">{subsidy.created_at?.substring(0, 10)}</td>
							</tr>
							{#if selectedSubsidy?.id === subsidy.id}
								<tr class="bg-gray-50">
									<td colspan="7" class="px-6 py-4">
										<div class="grid grid-cols-3 gap-6 text-sm">
											<div>
												<div class="text-gray-500 mb-1">商家</div>
												<div class="font-medium">{subsidy.order.merchant_name}</div>
											</div>
											<div>
												<div class="text-gray-500 mb-1">配送地址</div>
												<div>{subsidy.order.delivery_address}</div>
											</div>
											<div>
												<div class="text-gray-500 mb-1">配送费</div>
												<div>¥{subsidy.order.delivery_fee?.toFixed(2)}</div>
											</div>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
