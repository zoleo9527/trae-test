<script>
	import { onMount } from 'svelte';
	import { inspectionApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getInspectionStatusLabel,
		getInspectionStatusClass,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let inspections = [];
	let filterStatus = '';

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: urlStatus = $page.url.searchParams.get('status') || '';

	onMount(() => {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}
		if (urlStatus) filterStatus = urlStatus;
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			inspections = await inspectionApi.list({ status: filterStatus || undefined });
		} catch (e) {
			console.error('Failed to load inspections:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	$: if (filterStatus) {
		loadData();
	}

	function canCreate() {
		return currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">巡店检查</h1>
		<div class="page-actions">
			{#if canCreate()}
				<button class="btn btn-primary" on:click={() => goto('/inspections/new')}>
					🔍 新增巡店
				</button>
			{/if}
		</div>
	</div>

	<div class="filter-bar">
		<select bind:value={filterStatus}>
			<option value="">全部状态</option>
			<option value="pending">待检查</option>
			<option value="passed">已通过</option>
			<option value="exception">有异常</option>
			<option value="closed">已关闭</option>
		</select>
		<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else}
		{#if inspections.length > 0}
			<div style="overflow-x: auto;">
				<table class="table">
					<thead>
						<tr>
							<th>商品</th>
							<th>门店</th>
							<th>陈列正确</th>
							<th>预期库存</th>
							<th>实际库存</th>
							<th>偏差</th>
							<th>状态</th>
							<th>检查人</th>
							<th>检查时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each inspections as insp}
							<tr>
								<td>
									<div style="font-weight: 500;">{insp.productName}</div>
									<div style="font-size: 12px; color: #6b7280;">{insp.productSku}</div>
								</td>
								<td>{insp.storeCode} - {insp.storeName}</td>
								<td>
									<span class={`badge ${insp.displayCorrect ? 'status-passed' : 'status-rejected'}`}>
										{insp.displayCorrect ? '是' : '否'}
									</span>
								</td>
								<td>{insp.expectedQty}</td>
								<td>{insp.actualQty}</td>
								<td style="color: {insp.deviationQty !== 0 ? '#dc2626' : '#16a34a'}; font-weight: 600;">
									{insp.deviationQty > 0 ? '+' : ''}{insp.deviationQty}
								</td>
								<td><span class={`badge ${getInspectionStatusClass(insp.status)}`}>{getInspectionStatusLabel(insp.status)}</span></td>
								<td>{insp.inspectorName}</td>
								<td>{formatDate(insp.createdAt)}</td>
								<td>
									<button class="btn btn-sm btn-secondary" on:click={() => goto(`/inspections/${insp.id}`)}>
										查看
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">🔍</div>
				暂无巡店记录
			</div>
		{/if}
	{/if}
</AppLayout>
