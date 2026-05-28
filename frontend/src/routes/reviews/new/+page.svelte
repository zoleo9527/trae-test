<script>
	import { onMount } from 'svelte';
	import { reviewApi, productApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import { formatCurrency, getErrorMessage, isAuthError } from '$lib/utils';

	let loading = true;
	let products = [];
	let submitting = false;
	let error = '';

	let exceptionDrawerOpen = false;
	let selectedExceptionId = null;

	$: urlProductId = $page.url.searchParams.get('productId') || '';

	let form = {
		productId: '',
		productSku: '',
		productName: '',
		reviewType: 'sales',
		totalQuantity: 0,
		totalSales: 0,
		totalRevenue: 0,
		inventoryLeft: 0,
		displayScore: 5,
		timingScore: 5,
		salesScore: 5,
		overallScore: 5,
		problems: [],
		lessons: [],
		improvements: [],
		reviewedBy: '',
		reviewedByName: '',
		reviewedAt: ''
	};

	let newProblem = '';
	let newLesson = '';
	let newImprovement = '';

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
			const productsData = await productApi.list({ status: 'off_shelf,reviewing' });
			products = productsData;
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

	function addProblem() {
		if (!newProblem.trim()) return;
		form.problems = [...form.problems, newProblem.trim()];
		newProblem = '';
	}

	function removeProblem(index) {
		form.problems = form.problems.filter((_, i) => i !== index);
	}

	function addLesson() {
		if (!newLesson.trim()) return;
		form.lessons = [...form.lessons, newLesson.trim()];
		newLesson = '';
	}

	function removeLesson(index) {
		form.lessons = form.lessons.filter((_, i) => i !== index);
	}

	function addImprovement() {
		if (!newImprovement.trim()) return;
		form.improvements = [...form.improvements, newImprovement.trim()];
		newImprovement = '';
	}

	function removeImprovement(index) {
		form.improvements = form.improvements.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		if (!form.productId) {
			error = '请选择商品';
			return;
		}

		if (selectedProduct) {
			form.productSku = selectedProduct.sku;
			form.productName = selectedProduct.name;
		}

		submitting = true;
		error = '';
		try {
			await reviewApi.create(form);
			goto('/reviews');
		} catch (e) {
			error = '创建失败: ' + getErrorMessage(e);
		} finally {
			submitting = false;
		}
	}

	function getReviewTypeLabel(type) {
		const labels = {
			sales: '销售复盘',
			display: '陈列复盘',
			timing: '时效复盘',
			overall: '全面复盘'
		};
		return labels[type] || type;
	}
</script>

<AppLayout bind:exceptionDrawerOpen bind:selectedExceptionId>
	<div class="page-header">
		<div>
			<button class="btn btn-secondary" style="margin-right: 12px;" on:click={() => goto('/reviews')}>
				← 返回
			</button>
			<span style="font-size: 24px; font-weight: 600;">新建复盘</span>
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
				<label class="form-label">复盘类型</label>
				<div style="display: flex; gap: 12px; flex-wrap: wrap;">
					{#each ['sales', 'display', 'timing', 'overall'] as t}
						<label class="checkbox" style="padding: 12px 16px; border: 2px solid {form.reviewType === t ? '#2563eb' : '#e5e7eb'}; border-radius: 8px; cursor: pointer; flex: 1; text-align: center; min-width: 120px;">
							<input
								type="radio"
								bind:group={form.reviewType}
								value={t}
								style="display: none;"
							/>
							{getReviewTypeLabel(t)}
						</label>
					{/each}
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">销售数据</h3>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">累计销量</label>
						<input class="form-input" type="number" min="0" bind:value={form.totalQuantity} />
					</div>
					<div class="form-group">
						<label class="form-label">周期销量</label>
						<input class="form-input" type="number" min="0" bind:value={form.totalSales} />
					</div>
					<div class="form-group">
						<label class="form-label">周期销售额</label>
						<input class="form-input" type="number" min="0" bind:value={form.totalRevenue} />
					</div>
					<div class="form-group">
						<label class="form-label">剩余库存</label>
						<input class="form-input" type="number" min="0" bind:value={form.inventoryLeft} />
					</div>
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">各项评分</h3>
				<div class="form-row">
					<div class="form-group">
						<label class="form-label">销售表现 (0-10)</label>
						<input class="form-input" type="number" min="0" max="10" bind:value={form.salesScore} />
					</div>
					<div class="form-group">
						<label class="form-label">陈列效果 (0-10)</label>
						<input class="form-input" type="number" min="0" max="10" bind:value={form.displayScore} />
					</div>
					<div class="form-group">
						<label class="form-label">时效表现 (0-10)</label>
						<input class="form-input" type="number" min="0" max="10" bind:value={form.timingScore} />
					</div>
					<div class="form-group">
						<label class="form-label">综合评分 (0-10)</label>
						<input class="form-input" type="number" min="0" max="10" bind:value={form.overallScore} style="font-weight: 600; color: #2563eb;" />
					</div>
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">问题列表</h3>
				{#if form.problems.length > 0}
					<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
						{#each form.problems as problem, index}
							<div style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
								<div style="font-weight: 500; color: #dc2626;">{problem}</div>
								<button class="btn btn-secondary btn-sm" on:click={() => removeProblem(index)}>删除</button>
							</div>
						{/each}
					</div>
				{/if}
				<div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
					<div class="form-group">
						<label class="form-label">问题描述</label>
						<input class="form-input" bind:value={newProblem} placeholder="输入问题描述" />
					</div>
					<button class="btn btn-secondary" on:click={addProblem} disabled={!newProblem.trim()}>+ 添加问题</button>
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">经验总结</h3>
				{#if form.lessons.length > 0}
					<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
						{#each form.lessons as lesson, index}
							<div style="padding: 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
								<div style="font-weight: 500; color: #d97706;">📝 {lesson}</div>
								<button class="btn btn-secondary btn-sm" on:click={() => removeLesson(index)}>删除</button>
							</div>
						{/each}
					</div>
				{/if}
				<div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
					<div class="form-group">
						<label class="form-label">经验描述</label>
						<input class="form-input" bind:value={newLesson} placeholder="输入经验总结" />
					</div>
					<button class="btn btn-secondary" on:click={addLesson} disabled={!newLesson.trim()}>+ 添加经验</button>
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">改进建议</h3>
				{#if form.improvements.length > 0}
					<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
						{#each form.improvements as improvement, index}
							<div style="padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
								<div style="font-weight: 500; color: #16a34a;">💡 {improvement}</div>
								<button class="btn btn-secondary btn-sm" on:click={() => removeImprovement(index)}>删除</button>
							</div>
						{/each}
					</div>
				{/if}
				<div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
					<div class="form-group">
						<label class="form-label">建议描述</label>
						<input class="form-input" bind:value={newImprovement} placeholder="输入改进建议" />
					</div>
					<button class="btn btn-secondary" on:click={addImprovement} disabled={!newImprovement.trim()}>+ 添加建议</button>
				</div>
			</div>

			<div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
				<button class="btn btn-secondary" on:click={() => goto('/reviews')}>取消</button>
				<button class="btn btn-primary" on:click={handleSubmit} disabled={submitting}>
					{#if submitting}提交中...{:else}提交复盘{/if}
				</button>
			</div>
		</div>
	{/if}
</AppLayout>
