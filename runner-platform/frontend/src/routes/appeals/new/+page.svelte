<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api, appealTypeMap } from '$lib/api';
	import { user } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let orderId = $page.url.searchParams.get('order_id') || '';
	let appeal = {
		order_id: 0,
		runner_id: 0,
		type: 'timeout',
		reason: '',
		evidence_url: ''
	};

	let orders = [];
	let loading = false;
	let error = '';
	let selectedOrder = null;

	async function loadOrders() {
		orders = await api.getOrders();
		if (orderId) {
			appeal.order_id = parseInt(orderId);
			onOrderChange();
		}
	}

	function onOrderChange() {
		selectedOrder = orders.find(o => o.id === appeal.order_id);
		if (selectedOrder && selectedOrder.runner) {
			appeal.runner_id = selectedOrder.runner.id;
		}
	}

	async function handleSubmit() {
		if (!appeal.order_id || !appeal.reason) {
			error = '请填写完整信息';
			return;
		}

		if (!appeal.runner_id && selectedOrder && selectedOrder.runner) {
			appeal.runner_id = selectedOrder.runner.id;
		}

		if (!appeal.runner_id) {
			error = '该订单没有分配骑手，无法提交申诉';
			return;
		}

		loading = true;
		error = '';

		try {
			await api.createAppeal(appeal);
			goto('/appeals');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadOrders();
	});
</script>

<div class="p-8 max-w-2xl mx-auto">
	<div class="bg-white rounded-xl shadow-sm p-6">
		<h2 class="text-xl font-bold mb-6">提交申诉</h2>

		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">关联订单</label>
				<select
					bind:value={appeal.order_id}
					on:change={onOrderChange}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg"
					required
				>
					<option value={0}>选择订单</option>
					{#each orders as order}
						<option value={order.id}>{order.order_no} - {order.merchant_name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">申诉类型</label>
				<select
					bind:value={appeal.type}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg"
				>
					{#each Object.entries(appealTypeMap) as [key, val]}
						<option value={key}>{val}</option>
					{/each}
				</select>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">申诉原因</label>
				<textarea
					bind:value={appeal.reason}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg"
					rows="4"
					placeholder="请详细描述申诉原因..."
					required
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">证据链接（可选）</label>
				<input
					type="url"
					bind:value={appeal.evidence_url}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg"
					placeholder="https://..."
				/>
			</div>

			{#if error}
				<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
					{error}
				</div>
			{/if}

			<div class="flex space-x-4">
				<button
					type="button"
					on:click={() => goto('/appeals')}
					class="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
				>
					取消
				</button>
				<button
					type="submit"
					disabled={loading}
					class="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
				>
					{loading ? '提交中...' : '提交申诉'}
				</button>
			</div>
		</form>
	</div>
</div>
