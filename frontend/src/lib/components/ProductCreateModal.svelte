<script>
	import { createEventDispatcher } from 'svelte';
	import { productApi } from '$lib/api';
	import { getErrorMessage, isAuthError } from '$lib/utils';

	export let open = false;
	export let stores = [];

	const dispatch = createEventDispatcher();

	let form = {
		sku: '',
		name: '',
		brandPartner: '',
		category: '文具',
		retailPrice: 0,
		costPrice: 0,
		description: '',
		imageUrl: '',
		planOnShelfDate: '',
		planOffShelfDate: '',
		targetStores: []
	};

	let loading = false;
	let error = '';

	function handleClose() {
		open = false;
		resetForm();
	}

	function resetForm() {
		form = {
			sku: '',
			name: '',
			brandPartner: '',
			category: '文具',
			retailPrice: 0,
			costPrice: 0,
			description: '',
			imageUrl: '',
			planOnShelfDate: '',
			planOffShelfDate: '',
			targetStores: []
		};
		error = '';
	}

	function toggleStore(storeId) {
		const idx = form.targetStores.indexOf(storeId);
		if (idx > -1) {
			form.targetStores.splice(idx, 1);
		} else {
			form.targetStores.push(storeId);
		}
	}

	async function handleSubmit() {
		if (!form.sku || !form.name || !form.brandPartner || !form.planOnShelfDate || !form.planOffShelfDate) {
			error = '请填写必填项';
			return;
		}
		if (form.targetStores.length === 0) {
			error = '请至少选择一家门店';
			return;
		}

		loading = true;
		error = '';
		try {
			await productApi.create(form);
			dispatch('created');
			handleClose();
		} catch (e) {
			error = '创建失败: ' + getErrorMessage(e);
		} finally {
			loading = false;
		}
	}
</script>

{#if open}
	<div class="modal-overlay" on:click={handleClose}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="modal-title">新建联名商品</h3>
				<button class="modal-close" on:click={handleClose}>×</button>
			</div>
			<div class="modal-body">
				{#if error}
					<div class="alert alert-danger">{error}</div>
				{/if}

				<div class="form-row">
					<div class="form-group">
						<label class="form-label">SKU编码 *</label>
						<input class="form-input" bind:value={form.sku} placeholder="如: COLLAB-2024-001" />
					</div>
					<div class="form-group">
						<label class="form-label">品牌合作方 *</label>
						<input class="form-input" bind:value={form.brandPartner} placeholder="如: 故宫文创" />
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">商品名称 *</label>
					<input class="form-input" bind:value={form.name} placeholder="如: 故宫联名钢笔礼盒" />
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label">分类</label>
						<select class="form-select" bind:value={form.category}>
							<option value="文具">文具</option>
							<option value="配饰">配饰</option>
							<option value="家居">家居</option>
							<option value="食品">食品</option>
							<option value="数码">数码</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label">零售价 (元)</label>
						<input class="form-input" type="number" bind:value={form.retailPrice} />
					</div>
					<div class="form-group">
						<label class="form-label">成本价 (元)</label>
						<input class="form-input" type="number" bind:value={form.costPrice} />
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label class="form-label">计划上架日期 *</label>
						<input class="form-input" type="date" bind:value={form.planOnShelfDate} />
					</div>
					<div class="form-group">
						<label class="form-label">计划下架日期 *</label>
						<input class="form-input" type="date" bind:value={form.planOffShelfDate} />
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">商品描述</label>
					<textarea class="form-textarea" bind:value={form.description} rows={3} placeholder="商品卖点、规格等信息" />
				</div>

				<div class="form-group">
					<label class="form-label">覆盖门店 *</label>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
						{#each stores as store}
							<label class="checkbox" style="cursor: pointer; margin: 0; padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">
								<input
									type="checkbox"
									checked={form.targetStores.includes(store.id)}
									on:change={() => toggleStore(store.id)}
								/>
								{store.code} - {store.name}
							</label>
						{/each}
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn btn-secondary" on:click={handleClose}>取消</button>
				<button class="btn btn-primary" on:click={handleSubmit} disabled={loading}>
					{#if loading}创建中...{:else}创建{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
