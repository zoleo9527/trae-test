<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let products = [];
	let categoryFilter = '';
	let showModal = false;
	let isEditing = false;
	let selectedProduct = null;

	let productForm = {
		name: '',
		category: '面包',
		price: 0,
		cost: 0,
		status: 'active'
	};

	$: filteredProducts = products.filter(p =>
		!categoryFilter || p.category === categoryFilter
	);

	onMount(loadProducts);

	async function loadProducts() {
		const res = await api.getProducts();
		products = res.data || [];
	}

	function openNew() {
		productForm = { name: '', category: '面包', price: 0, cost: 0, status: 'active' };
		isEditing = false;
		showModal = true;
	}

	function openEdit(product) {
		selectedProduct = product;
		productForm = { ...product };
		isEditing = true;
		showModal = true;
	}

	async function handleSave() {
		if (isEditing) {
			await api.updateProduct(selectedProduct.id, productForm);
		} else {
			await api.createProduct(productForm);
		}
		showModal = false;
		loadProducts();
	}
</script>

<div>
	<div class="filters">
		<select class="input" bind:value={categoryFilter}>
			<option value="">全部分类</option>
			<option value="面包">面包</option>
			<option value="蛋糕">蛋糕</option>
			<option value="饮品">饮品</option>
		</select>
		<button class="btn btn-primary" on:click={openNew}>+ 新增产品</button>
	</div>

	<div class="card">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>产品名称</th>
						<th>分类</th>
						<th>售价</th>
						<th>成本</th>
						<th>毛利率</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredProducts as product}
						<tr>
							<td><strong>{product.name}</strong></td>
							<td>{product.category}</td>
							<td>¥{product.price.toFixed(2)}</td>
							<td>¥{product.cost.toFixed(2)}</td>
							<td>
								{product.price > 0
									? `${(((product.price - product.cost) / product.price) * 100).toFixed(1)}%`
									: '-'}
							</td>
							<td><span class="badge {product.status}">{product.status === 'active' ? '在售' : '停售'}</span></td>
							<td>
								<button class="btn btn-sm btn-outline" on:click={() => openEdit(product)}>编辑</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if showModal}
		<div class="modal-overlay" on:click={() => showModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>{isEditing ? '编辑产品' : '新增产品'}</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>产品名称</label>
						<input type="text" class="input" bind:value={productForm.name} style="width: 100%;" />
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>分类</label>
							<select class="input" bind:value={productForm.category} style="width: 100%;">
								<option value="面包">面包</option>
								<option value="蛋糕">蛋糕</option>
								<option value="饮品">饮品</option>
							</select>
						</div>
						<div class="form-group">
							<label>状态</label>
							<select class="input" bind:value={productForm.status} style="width: 100%;">
								<option value="active">在售</option>
								<option value="inactive">停售</option>
							</select>
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>售价</label>
							<input type="number" class="input" bind:value={productForm.price} style="width: 100%;" />
						</div>
						<div class="form-group">
							<label>成本</label>
							<input type="number" class="input" bind:value={productForm.cost} style="width: 100%;" />
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleSave}>保存</button>
				</div>
			</div>
		</div>
	{/if}
</div>
