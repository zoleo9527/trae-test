<script>
	import { onMount } from 'svelte';
	import { productApi, orderApi, inventoryApi, inspectionApi, exceptionApi, storeApi, reviewApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import {
		formatDate,
		formatDateShort,
		formatCurrency,
		getProductStatusLabel,
		getProductStatusClass,
		getOrderTypeLabel,
		getOrderStatusLabel,
		getOrderStatusClass,
		getInspectionStatusLabel,
		getInspectionStatusClass,
		getExceptionTypeLabel,
		getExceptionStatusLabel,
		getExceptionStatusClass,
		getRoleLabel,
		getErrorMessage,
		isAuthError
	} from '$lib/utils';

	let loading = true;
	let product = null;
	let logs = [];
	let orders = [];
	let inventory = [];
	let inspections = [];
	let exceptions = [];
	let stores = [];
	let reviews = [];
	let activeTab = 'detail';

	let approveRemark = '';
	let rejectReason = '';
	let showApproveModal = false;
	let showRejectModal = false;
	let actionLoading = false;

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: currentUser = $user;
	$: productId = $page.params.id;

	onMount(() => {
		if (!localStorage.getItem('token')) {
			goto('/login');
			return;
		}
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			const [productData, ordersData, inventoryData, inspectionsData, exceptionsData, storesData, reviewsData] = await Promise.all([
				productApi.get(productId),
				orderApi.list({}),
				inventoryApi.list({ productId }),
				inspectionApi.list({ productId }),
				exceptionApi.list({ productId }),
				storeApi.list(),
				reviewApi.list({ productId })
			]);
			product = productData.product;
			logs = productData.logs;
			orders = ordersData.filter(o => o.productId === productId);
			inventory = inventoryData;
			inspections = inspectionsData;
			exceptions = exceptionsData;
			stores = storesData;
			reviews = reviewsData;
		} catch (e) {
			console.error('Failed to load product detail:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		if (!product) return;
		actionLoading = true;
		try {
			product = await productApi.submit(product.id);
			await loadData();
		} catch (e) {
			alert('提交失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleApprove() {
		if (!product) return;
		actionLoading = true;
		try {
			product = await productApi.approve(product.id, approveRemark);
			showApproveModal = false;
			approveRemark = '';
			await loadData();
		} catch (e) {
			alert('审批失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleReject() {
		if (!product || !rejectReason) return;
		actionLoading = true;
		try {
			product = await productApi.reject(product.id, rejectReason);
			showRejectModal = false;
			rejectReason = '';
			await loadData();
		} catch (e) {
			alert('驳回失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleOnShelf() {
		if (!product) return;
		actionLoading = true;
		try {
			product = await productApi.onShelf(product.id);
			await loadData();
		} catch (e) {
			alert('上架失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	async function handleOffShelf() {
		if (!product) return;
		actionLoading = true;
		try {
			product = await productApi.offShelf(product.id);
			await loadData();
		} catch (e) {
			alert('下架失败: ' + getErrorMessage(e));
		} finally {
			actionLoading = false;
		}
	}

	function canSubmit() {
		return product && product.status === 'draft' &&
			currentUser && (currentUser.role === 'planner' || currentUser.role === 'manager');
	}

	function canApprove() {
		return product && product.status === 'pending' && currentUser && currentUser.role === 'manager';
	}

	function canOnShelf() {
		return product && product.status === 'approved' &&
			currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}

	function canOffShelf() {
		return product && product.status === 'on_shelf' &&
			currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}

	function canStartReview() {
		return product && product.status === 'off_shelf' &&
			currentUser && (currentUser.role === 'planner' || currentUser.role === 'manager');
	}

	function canViewReview() {
		return product && 
			(product.status === 'reviewing' || product.status === 'reviewed') && 
			currentUser;
	}

	function hasReview() {
		return reviews && reviews.length > 0;
	}

	function canCreateOrder() {
		return product && product.status === 'on_shelf' &&
			currentUser && (currentUser.role !== 'planner');
	}

	function canCreateInspection() {
		return product && product.status === 'on_shelf' &&
			currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager');
	}

	function getStoreName(storeId) {
		const store = stores.find(s => s.id === storeId);
		return store ? store.name : storeId;
	}

	function openException(id) {
		selectedExceptionId = id;
		exceptionDrawerOpen = true;
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else if product}
		<div class="page-header">
			<div>
				<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/products')}>
					← 返回
				</button>
				<span style="font-size: 24px; font-weight: 600;">{product.name}</span>
				<span class={`badge ${getProductStatusClass(product.status)}`} style="margin-left: 12px;">
					{getProductStatusLabel(product.status)}
				</span>
			</div>
			<div class="page-actions">
				{#if canSubmit()}
					<button class="btn btn-primary" on:click={handleSubmit} disabled={actionLoading}>
						📤 提交审批
					</button>
				{/if}
				{#if canApprove()}
					<button class="btn btn-success" on:click={() => (showApproveModal = true)} disabled={actionLoading}>
						✅ 通过
					</button>
					<button class="btn btn-danger" on:click={() => (showRejectModal = true)} disabled={actionLoading}>
						❌ 驳回
					</button>
				{/if}
				{#if canOnShelf()}
					<button class="btn btn-success" on:click={handleOnShelf} disabled={actionLoading}>
						📢 确认上架
					</button>
				{/if}
				{#if canOffShelf()}
					<button class="btn btn-warning" on:click={handleOffShelf} disabled={actionLoading}>
						📴 确认下架
					</button>
				{/if}
				{#if canStartReview()}
					<button class="btn btn-primary" on:click={() => goto(`/reviews/new?productId=${product.id}`)} disabled={actionLoading}>
						📊 开始复盘
					</button>
				{/if}
				{#if canViewReview()}
					<button class="btn btn-secondary" on:click={() => goto(`/reviews?productId=${product.id}`)} disabled={actionLoading}>
						📊 查看复盘
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={loadData}>🔄 刷新</button>
			</div>
		</div>

		<div class="tabs">
			<button class={activeTab === 'detail' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'detail')}>
				商品详情
			</button>
			<button class={activeTab === 'orders' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'orders')}>
				订单记录 ({orders.length})
			</button>
			<button class={activeTab === 'inventory' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'inventory')}>
				库存情况 ({inventory.length})
			</button>
			<button class={activeTab === 'inspections' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'inspections')}>
				巡店记录 ({inspections.length})
			</button>
			<button class={activeTab === 'exceptions' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'exceptions')}>
				异常记录 ({exceptions.length})
			</button>
			<button class={activeTab === 'logs' ? 'tab-btn active' : 'tab-btn'} on:click={() => (activeTab = 'logs')}>
				操作留痕 ({logs.length})
			</button>
		</div>

		{#if activeTab === 'detail'}
			<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
				<div class="section">
					<h3 class="section-title">基本信息</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">SKU编码</span>
							<span class="detail-value">{product.sku}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">品牌合作方</span>
							<span class="detail-value">{product.brandPartner}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">分类</span>
							<span class="detail-value">{product.category}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">零售价</span>
							<span class="detail-value" style="color: #dc2626; font-weight: 600;">{formatCurrency(product.retailPrice)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">成本价</span>
							<span class="detail-value">{formatCurrency(product.costPrice)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">创建人</span>
							<span class="detail-value">{product.createdByName}</span>
						</div>
					</div>

					{#if product.description}
						<div style="margin-top: 16px;">
							<div class="detail-label" style="margin-bottom: 8px;">商品描述</div>
							<p style="line-height: 1.8; color: #374151;">{product.description}</p>
						</div>
					{/if}
				</div>

				<div class="section">
					<h3 class="section-title">时间线</h3>
					<div class="timeline">
						<div class="timeline-item">
							<div class="timeline-item-title">创建商品</div>
							<div class="timeline-item-time">{formatDate(product.createdAt)}</div>
							<div class="timeline-item-content">{product.createdByName} 创建</div>
						</div>
						{#if product.approvedByName}
							<div class="timeline-item">
								<div class="timeline-item-title">审批通过</div>
								<div class="timeline-item-time">{formatDate(product.updatedAt)}</div>
								<div class="timeline-item-content">{product.approvedByName} 审批</div>
							</div>
						{/if}
						{#if product.actualOnShelfDate}
							<div class="timeline-item">
								<div class="timeline-item-title">上架</div>
								<div class="timeline-item-time">{formatDate(product.actualOnShelfDate)}</div>
							</div>
						{/if}
						{#if product.actualOffShelfDate}
							<div class="timeline-item">
								<div class="timeline-item-title">下架</div>
								<div class="timeline-item-time">{formatDate(product.actualOffShelfDate)}</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="section">
					<h3 class="section-title">销售数据</h3>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
						<div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
							<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">总销量</div>
							<div style="font-size: 24px; font-weight: 700; color: #2563eb;">{product.totalSales}</div>
						</div>
						<div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
							<div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">总销售额</div>
							<div style="font-size: 24px; font-weight: 700; color: #16a34a;">{formatCurrency(product.totalRevenue)}</div>
						</div>
					</div>
				</div>

				<div class="section">
					<h3 class="section-title">覆盖门店</h3>
					<div style="display: flex; flex-wrap: wrap; gap: 8px;">
						{#each product.targetStores as storeId}
							<span class="tag">{getStoreName(storeId)}</span>
						{/each}
					</div>
				</div>
			</div>

			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px;">
				<div class="section">
					<h3 class="section-title">计划时间</h3>
					<div class="detail-grid">
						<div class="detail-item">
							<span class="detail-label">计划上架</span>
							<span class="detail-value">{formatDateShort(product.planOnShelfDate)}</span>
						</div>
						<div class="detail-item">
							<span class="detail-label">计划下架</span>
							<span class="detail-value">{formatDateShort(product.planOffShelfDate)}</span>
						</div>
						{#if product.actualOnShelfDate}
							<div class="detail-item">
								<span class="detail-label">实际上架</span>
								<span class="detail-value">{formatDateShort(product.actualOnShelfDate)}</span>
							</div>
						{/if}
						{#if product.actualOffShelfDate}
							<div class="detail-item">
								<span class="detail-label">实际下架</span>
								<span class="detail-value">{formatDateShort(product.actualOffShelfDate)}</span>
							</div>
						{/if}
					</div>
				</div>

				{#if product.rejectReason}
					<div class="section">
						<h3 class="section-title" style="color: #dc2626;">驳回原因</h3>
						<p style="line-height: 1.8; color: #374151;">{product.rejectReason}</p>
					</div>
				{/if}

				{#if product.reviewNote}
					<div class="section">
						<h3 class="section-title" style="color: #7c3aed;">复盘记录</h3>
						<p style="line-height: 1.8; color: #374151;">{product.reviewNote}</p>
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'orders'}
			<div class="section">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
					<h3 class="section-title" style="margin: 0;">订单记录</h3>
					{#if canCreateOrder()}
						<div style="display: flex; gap: 8px;">
							<button class="btn btn-sm btn-primary" on:click={() => goto(`/orders/new?type=restock&productId=${product.id}`)}>
								➕ 创建补货单
							</button>
							<button class="btn btn-sm btn-secondary" on:click={() => goto(`/orders/new?type=transfer&productId=${product.id}`)}>
								🔄 发起调拨
							</button>
							<button class="btn btn-sm btn-success" on:click={() => goto(`/orders/new?type=exchange&productId=${product.id}`)}>
								🎁 会员兑换
							</button>
						</div>
					{/if}
				</div>
				{#if orders.length > 0}
					<table class="table">
						<thead>
							<tr>
								<th>订单号</th>
								<th>类型</th>
								<th>门店</th>
								<th>数量</th>
								<th>状态</th>
								<th>创建人</th>
								<th>创建时间</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each orders as order}
								<tr>
									<td>{order.orderNo}</td>
									<td><span class="badge">{getOrderTypeLabel(order.type)}</span></td>
									<td>{order.toStoreCode} - {order.toStoreCode ? getStoreName(order.toStoreId) : ''}</td>
									<td>{order.quantity}</td>
									<td><span class={`badge ${getOrderStatusClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span></td>
									<td>{order.createdByName}</td>
									<td>{formatDate(order.createdAt)}</td>
									<td>
										<button class="btn btn-sm btn-secondary" on:click={() => goto(`/orders/${order.id}`)}>
											查看
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">📋</div>
						暂无订单记录
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'inventory'}
			<div class="section">
				<h3 class="section-title">库存情况</h3>
				{#if inventory.length > 0}
					<table class="table">
						<thead>
							<tr>
								<th>门店</th>
								<th>总库存</th>
								<th>预留</th>
								<th>可用</th>
								<th>上次盘点</th>
								<th>偏差</th>
								<th>操作</th>
							</tr>
						</thead>
						<tbody>
							{#each inventory as inv}
								<tr>
									<td>{inv.storeCode} - {getStoreName(inv.storeId)}</td>
									<td>{inv.quantity}</td>
									<td>{inv.reservedQty}</td>
									<td style="font-weight: 600; color: {inv.availableQty > 0 ? '#16a34a' : '#dc2626'};">{inv.availableQty}</td>
									<td>{inv.lastCountDate ? formatDateShort(inv.lastCountDate) : '-'}</td>
									<td style="color: {inv.deviationQty !== 0 ? '#dc2626' : '#16a34a'};">{inv.deviationQty}</td>
									<td>
										{#if currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager')}
											<button class="btn btn-sm btn-primary" on:click={() => goto(`/inventory/${inv.id}`)}>
												盘点
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">📦</div>
						暂无库存数据
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'inspections'}
			<div class="section">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
					<h3 class="section-title" style="margin: 0;">巡店记录</h3>
					{#if canCreateInspection()}
						<button class="btn btn-sm btn-primary" on:click={() => goto(`/inspections/new?productId=${product.id}`)}>
							🔍 新增巡店
						</button>
					{/if}
				</div>
				{#if inspections.length > 0}
					<table class="table">
						<thead>
							<tr>
								<th>门店</th>
								<th>陈列正确</th>
								<th>陈列位置</th>
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
									<td>{insp.storeCode} - {insp.storeName}</td>
									<td>
										<span class={`badge ${insp.displayCorrect ? 'status-passed' : 'status-rejected'}`}>
											{insp.displayCorrect ? '是' : '否'}
										</span>
									</td>
									<td>{insp.displayPosition || '-'}</td>
									<td>{insp.expectedQty}</td>
									<td>{insp.actualQty}</td>
									<td style="color: {insp.deviationQty !== 0 ? '#dc2626' : '#16a34a'};">{insp.deviationQty}</td>
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
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">🔍</div>
						暂无巡店记录
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'exceptions'}
			<div class="section">
				<h3 class="section-title">异常记录</h3>
				{#if exceptions.length > 0}
					<table class="table">
						<thead>
							<tr>
								<th>类型</th>
								<th>标题</th>
								<th>严重程度</th>
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
									<td>{exc.title}</td>
									<td><span class={`badge ${exc.severity === 'high' ? 'status-rejected' : exc.severity === 'medium' ? 'status-pending' : 'status-passed'}`}>{exc.severity}</span></td>
									<td><span class={`badge ${getExceptionStatusClass(exc.status)}`}>{getExceptionStatusLabel(exc.status)}</span></td>
									<td>{exc.reportedByName}</td>
									<td>{exc.assignedToName || '-'}</td>
									<td>{formatDate(exc.createdAt)}</td>
									<td>
										{#if currentUser && (currentUser.role === 'warehouse' || currentUser.role === 'manager')}
											<button class="btn btn-sm btn-primary" on:click={() => openException(exc.id)}>
												处理
											</button>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">✅</div>
						暂无异常记录
					</div>
				{/if}
			</div>
		{/if}

		{#if activeTab === 'logs'}
			<div class="section">
				<h3 class="section-title">操作留痕</h3>
				{#if logs.length > 0}
					<div class="timeline">
						{#each logs as log}
							<div class="timeline-item">
								<div class="timeline-item-title">{log.action}</div>
								<div class="timeline-item-time">{formatDate(log.createdAt)}</div>
								<div class="timeline-item-content">
									<span style="color: #6b7280;">{log.operatorName}</span>
									<span style="color: #9ca3af; margin: 0 8px;">·</span>
									<span style="color: #9ca3af;">{getRoleLabel(log.operatorRole)}</span>
									{#if log.remark}
										<p style="margin-top: 8px; color: #374151;">{log.remark}</p>
									{/if}
									{#if log.oldValue && log.newValue}
										<div style="margin-top: 8px; font-size: 13px;">
											<span style="color: #dc2626;">- {log.oldValue}</span>
											<span style="margin: 0 8px;">→</span>
											<span style="color: #16a34a;">+ {log.newValue}</span>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state">
						<div class="empty-state-icon">📋</div>
						暂无操作记录
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	{#if showApproveModal}
		<div class="modal-overlay" on:click={() => (showApproveModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="modal-title">审批通过</h3>
					<button class="modal-close" on:click={() => (showApproveModal = false)}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">审批意见（可选）</label>
						<textarea class="form-textarea" bind:value={approveRemark} rows={4} placeholder="请输入审批意见" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showApproveModal = false)}>取消</button>
					<button class="btn btn-success" on:click={handleApprove} disabled={actionLoading}>
						{#if actionLoading}处理中...{:else}确认通过{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRejectModal}
		<div class="modal-overlay" on:click={() => (showRejectModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3 class="modal-title" style="color: #dc2626;">驳回申请</h3>
					<button class="modal-close" on:click={() => (showRejectModal = false)}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label">驳回原因 *</label>
						<textarea class="form-textarea" bind:value={rejectReason} rows={4} placeholder="请输入驳回原因" />
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-secondary" on:click={() => (showRejectModal = false)}>取消</button>
					<button class="btn btn-danger" on:click={handleReject} disabled={actionLoading || !rejectReason}>
						{#if actionLoading}处理中...{:else}确认驳回{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</AppLayout>
