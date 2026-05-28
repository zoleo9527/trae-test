<script>
	import { onMount } from 'svelte';
	import { exceptionApi, authApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		getExceptionTypeLabel,
		getExceptionStatusLabel,
		getExceptionStatusClass,
		getSeverityLabel,
		getSeverityClass,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let exceptions = [];
	let users = [];
	let filterStatus = '';
	let filterType = '';
	let filterSeverity = '';
	let filterNeedReview = '';

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: urlStatus = $page.url.searchParams.get('status') || '';
	$: urlType = $page.url.searchParams.get('type') || '';
	$: urlSeverity = $page.url.searchParams.get('severity') || '';
	$: urlNeedReview = $page.url.searchParams.get('needReview') || '';

	onMount(() => {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}
		if (urlStatus) filterStatus = urlStatus;
		if (urlType) filterType = urlType;
		if (urlSeverity) filterSeverity = urlSeverity;
		if (urlNeedReview) filterNeedReview = urlNeedReview;
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [excData, usersData] = await Promise.all([
				exceptionApi.list({
					status: filterStatus || undefined,
					type: filterType || undefined,
					severity: filterSeverity || undefined,
					needReview: filterNeedReview === 'true' ? true : filterNeedReview === 'false' ? false : undefined
				}),
				authApi.listUsers()
			]);
			exceptions = excData;
			users = usersData;
		} catch (e) {
			console.error('Failed to load exceptions:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	$: if (filterStatus || filterType || filterSeverity || filterNeedReview) {
		loadData();
	}

	function openException(id) {
		selectedExceptionId = id;
		exceptionDrawerOpen = true;
	}

	function canCreate() {
		return currentUser && (currentUser.role !== 'planner');
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<h1 class="page-title">异常中心</h1>
		<div class="page-actions">
			{#if canCreate()}
				<button class="btn btn-primary" on:click={() => {}}>
					➕ 上报异常
				</button>
			{/if}
		</div>
	</div>

	<div class="filter-bar">
		<select bind:value={filterStatus}>
			<option value="">全部状态</option>
			<option value="open">待处理</option>
			<option value="handling">处理中</option>
			<option value="resolved">已解决</option>
			<option value="review">已复核</option>
		</select>
		<select bind:value={filterType}>
			<option value="">全部类型</option>
			<option value="inventory">库存异常</option>
			<option value="display">陈列异常</option>
			<option value="timing">时效异常</option>
			<option value="order">订单异常</option>
			<option value="other">其他异常</option>
		</select>
		<select bind:value={filterSeverity}>
			<option value="">全部严重程度</option>
			<option value="low">低</option>
			<option value="medium">中</option>
			<option value="high">高</option>
		</select>
		<select bind:value={filterNeedReview}>
			<option value="">是否需复核</option>
			<option value="true">需复核</option>
			<option value="false">无需复核</option>
		</select>
		<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else}
		{#if exceptions.length > 0}
			<div style="overflow-x: auto;">
				<table class="table">
					<thead>
						<tr>
							<th>类型</th>
							<th>标题</th>
							<th>严重程度</th>
							<th>关联信息</th>
							<th>状态</th>
							<th>上报人</th>
							<th>处理人</th>
							<th>上报时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{#each exceptions as exc}
							<tr>
								<td><span class="badge">{getExceptionTypeLabel(exc.type)}</span></td>
								<td style="font-weight: 500;">{exc.title}</td>
								<td>
									<span class={`badge ${getSeverityClass(exc.severity)}`}>
										{getSeverityLabel(exc.severity)}
									</span>
								</td>
								<td>
									{#if exc.storeName}
										<div style="font-size: 13px;">{exc.storeCode} - {exc.storeName}</div>
									{/if}
									{#if exc.productName}
										<div style="font-size: 12px; color: #6b7280;">{exc.productSku} - {exc.productName}</div>
									{/if}
									{#if exc.needReview}
										<span class="badge status-reviewing" style="margin-top: 4px;">需复核</span>
									{/if}
								</td>
								<td><span class={`badge ${getExceptionStatusClass(exc.status)}`}>{getExceptionStatusLabel(exc.status)}</span></td>
								<td>{exc.reportedByName}</td>
								<td>{exc.assignedToName || '-'}</td>
								<td>{formatDate(exc.createdAt)}</td>
								<td>
									<button class="btn btn-sm btn-primary" on:click={() => openException(exc.id)}>
										处理
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">✅</div>
				暂无异常记录
			</div>
		{/if}
	{/if}
</AppLayout>
