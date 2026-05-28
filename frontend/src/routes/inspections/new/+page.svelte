<script>
	import { onMount } from 'svelte';
	import { inspectionApi, productApi, storeApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { formatCurrency, getErrorMessage, isAuthError } from '$lib/utils';

	let loading = true;
	let products = [];
	let stores = [];
	let submitting = false;
	let error = '';

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: urlProductId = $page.url.searchParams.get('productId') || '';

	let form = {
		productId: urlProductId,
		storeId: '',
		displayCorrect: true,
		displayPosition: '',
		photoUrls: [],
		inventoryCheck: true,
		expectedQty: 0,
		actualQty: 0,
		deviationQty: 0,
		issues: [],
		remark: ''
	};

	$: form.deviationQty = form.actualQty - form.expectedQty;
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
			if (stores.length > 0 && !form.storeId) {
				form.storeId = stores[0].id;
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
		if (!form.productId || !form.storeId) {
			error = '请选择商品和门店';
			return;
		}

		submitting = true;
		error = '';
		try {
			await inspectionApi.create(form);
			goto('/inspections');
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
			<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/inspections')}>
				← 返回
			</button>
			<span style="font-size: 24px; font-weight: 600;">新增巡店检查</span>
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

			<div class="form-group">
				<label class="form-label">门店 *</label>
				<select class="form-select" bind:value={form.storeId}>
					<option value="">请选择门店</option>
					{#each stores as s}
						<option value={s.id}>{s.code} - {s.name}</option>
					{/each}
				</select>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="form-label">陈列是否正确</label>
					<div style="display: flex; gap: 20px;">
						<label class="checkbox" style="cursor: pointer;">
							<input type="radio" bind:group={form.displayCorrect} value={true} />
							是
						</label>
						<label class="checkbox" style="cursor: pointer;">
							<input type="radio" bind:group={form.displayCorrect} value={false} />
							否
						</label>
					</div>
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">陈列位置</label>
				<input class="form-input" bind:value={form.displayPosition} placeholder="如: 入口堆头、收银台旁" />
			</div>

			<div class="form-row">
				<div class="form-group">
					<label class="form-label">预期库存</label>
					<input class="form-input" type="number" min="0" bind:value={form.expectedQty} />
				</div>
				<div class="form-group">
					<label class="form-label">实际库存</label>
					<input class="form-input" type="number" min="0" bind:value={form.actualQty} />
				</div>
				<div class="form-group">
					<label class="form-label">偏差</label>
					<input class="form-input" type="number" bind:value={form.deviationQty} disabled style="background: #f9fafb; color: {form.deviationQty !== 0 ? '#dc2626' : '#16a34a'}; font-weight: 600;" />
				</div>
			</div>

			{#if form.deviationQty !== 0 || !form.displayCorrect}
				<div class="alert alert-warning">
					{#if !form.displayCorrect}
						陈列不正确，{/if}
					{#if form.deviationQty !== 0}
						库存偏差 {form.deviationQty > 0 ? '+' : ''}{form.deviationQty}
					{/if}
					，系统将自动记录异常
				</div>
			{/if}

			<div class="form-group">
				<label class="form-label">备注</label>
				<textarea class="form-textarea" bind:value={form.remark} rows={3} placeholder="请输入巡店备注" />
			</div>

			<div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
				<button class="btn btn-secondary" on:click={() => goto('/inspections')}>取消</button>
				<button class="btn btn-primary" on:click={handleSubmit} disabled={submitting}>
					{#if submitting}提交中...{:else}提交检查{/if}
				</button>
			</div>
		</div>
	{/if}
</AppLayout>
