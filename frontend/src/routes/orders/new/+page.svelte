<script>
	import { onMount } from 'svelte';
	import { orderApi, productApi, storeApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { getOrderTypeLabel, formatCurrency, getErrorMessage, isAuthError } from '$lib/utils';

	let loading = true;
	let products = [];
	let stores = [];
	let submitting = false;
	let error = '';

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: urlType = $page.url.searchParams.get('type') || 'restock';
	$: urlProductId = $page.url.searchParams.get('productId') || '';

	let form = {
		type: urlType,
		productId: urlProductId,
		fromStoreId: '',
		toStoreId: '',
		quantity: 1,
		memberName: '',
		memberPhone: '',
		exchangePoints: 0,
		remark: ''
	};

	$: selectedProduct = products.find(p => p.id === form.productId);

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
			const [productsData, storesData] = await Promise.all([
				productApi.list({ status: 'on_shelf' }),
				storeApi.list()
			]);
			products = productsData;
			stores = storesData;
			if (stores.length > 0 && !form.toStoreId) {
				form.toStoreId = stores[0].id;
			}
			if (!form.type) {
				form.type = urlType || 'restock';
			}
			if (!form.productId && urlProductId) {
				form.productId = urlProductId;
			}
		} catch (e) {
			console.error('Failed to load data:', e);
			if (isAuthError(e)) {
				goto('/login');
			}
		} finally {
			loading = false;
		}
	}

	async function handleSubmit() {
		if (!form.productId || !form.toStoreId || form.quantity <= 0) {
			error = '请填写完整信息';
			return;
		}
		if (form.type === 'transfer' && !form.fromStoreId) {
			error = '请选择来源门店';
			return;
		}

		submitting = true;
		error = '';
		try {
			await orderApi.create(form);
			goto('/orders');
		} catch (e) {
			error = '创建失败: ' + getErrorMessage(e);
		} finally {
			submitting = false;
		}
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<div>
			<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/orders')}>
				← 返回
			</button>
			<span style="font-size: 24px; font-weight: 600;">新建{getOrderTypeLabel(form.type)}</span>
		</div>
	</div>

	{#if loading}
		<div style="text-align: center; padding: 60px; color: #6b7280;">
			<div class="loading-spinner" style="margin: 0 auto 16px;"></div>
			加载中...
		</div>
	{:else}
		<div class="section" style="max-width: 800px; margin: 0 auto;">
			{#if error}
				<div class="alert alert-danger">{error}</div>
			{/if}

			<div class="form-group">
				<label class="form-label">订单类型</label>
				<div style="display: flex; gap: 12px;">
					{#each ['restock', 'transfer', 'exchange'] as t}
						<label class="checkbox" style="padding: 12px 16px; border: 2px solid {form.type === t ? '#2563eb' : '#e5e7eb'}; border-radius: 8px; cursor: pointer; flex: 1; text-align: center;">
							<input
								type="radio"
								bind:group={form.type}
								value={t}
								style="display: none;"
							/>
							{getOrderTypeLabel(t)}
						</label>
					{/each}
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">联名商品 *</label>
				<select class="form-select" bind:value={form.productId}>
					<option value="">请选择商品</option>
					{#each products as p}
						<option value={p.id}>{p.name} ({p.sku}) - {formatCurrency(p.retailPrice)}</option>
					{/each}
				</select>
			</div>

			{#if selectedProduct}
				<div style="padding: 16px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
					<div style="font-weight: 500; margin-bottom: 4px;">{selectedProduct.name}</div>
					<div style="font-size: 13px; color: #6b7280;">
						品牌: {selectedProduct.brandPartner} | 零售价: {formatCurrency(selectedProduct.retailPrice)}
					</div>
				</div>
			{/if}

			{#if form.type === 'transfer'}
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">来源门店 *</label>
						<select class="form-select" bind:value={form.fromStoreId}>
							<option value="">请选择来源门店</option>
							{#each stores as s}
								<option value={s.id}>{s.code} - {s.name}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">目标门店 *</label>
						<select class="form-select" bind:value={form.toStoreId}>
							<option value="">请选择目标门店</option>
							{#each stores as s}
								<option value={s.id}>{s.code} - {s.name}</option>
							{/each}
						</select>
					</div>
				</div>
			{:else}
				<div class="form-group">
					<label class="form-label">目标门店 *</label>
					<select class="form-select" bind:value={form.toStoreId}>
						<option value="">请选择门店</option>
						{#each stores as s}
							<option value={s.id}>{s.code} - {s.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="form-group">
				<label class="form-label">数量 *</label>
				<input class="form-input" type="number" min="1" bind:value={form.quantity} />
			</div>

			{#if form.type === 'exchange'}
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">会员姓名</label>
						<input class="form-input" bind:value={form.memberName} placeholder="请输入会员姓名" />
					</div>
					<div class="form-group">
						<label class="form-label">会员手机号</label>
						<input class="form-input" bind:value={form.memberPhone} placeholder="请输入会员手机号" />
					</div>
					<div class="form-group">
						<label class="form-label">兑换积分</label>
						<input class="form-input" type="number" min="0" bind:value={form.exchangePoints} />
					</div>
				</div>
			{/if}

			<div class="form-group">
				<label class="form-label">备注</label>
				<textarea class="form-textarea" bind:value={form.remark} rows={3} placeholder="请输入备注信息" />
			</div>

			<div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
				<button class="btn btn-secondary" on:click={() => goto('/orders')}>取消</button>
				<button class="btn btn-primary" on:click={handleSubmit} disabled={submitting}>
					{#if submitting}提交中...{:else}提交订单{/if}
				</button>
			</div>
		</div>
	{/if}
</AppLayout>
