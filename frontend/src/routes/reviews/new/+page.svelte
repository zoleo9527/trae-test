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
		reviewType: 'weekly',
		issues: [],
		suggestions: [],
		salesScore: 5,
		displayScore: 5,
		inventoryScore: 5,
		overallScore: 5,
		summary: ''
	};

	let newIssueTitle = '';
	let newIssueDescription = '';
	let newSuggestionTitle = '';
	let newSuggestionDescription = '';

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
			const productsData = await productApi.list({ status: 'on_shelf' });
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

	function addIssue() {
		if (!newIssueTitle.trim()) return;
		form.issues = [...form.issues, {
			title: newIssueTitle.trim(),
			description: newIssueDescription.trim()
		}];
		newIssueTitle = '';
		newIssueDescription = '';
	}

	function removeIssue(index) {
		form.issues = form.issues.filter((_, i) => i !== index);
	}

	function addSuggestion() {
		if (!newSuggestionTitle.trim()) return;
		form.suggestions = [...form.suggestions, {
			title: newSuggestionTitle.trim(),
			description: newSuggestionDescription.trim()
		}];
		newSuggestionTitle = '';
		newSuggestionDescription = '';
	}

	function removeSuggestion(index) {
		form.suggestions = form.suggestions.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		if (!form.productId) {
			error = '请选择商品';
			return;
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
				<div style="display: flex; gap: 12px;">
					{#each ['weekly', 'monthly', 'custom'] as t}
						<label class="checkbox" style="padding: 12px 16px; border: 2px solid {form.reviewType === t ? '#2563eb' : '#e5e7eb'}; border-radius: 8px; cursor: pointer; flex: 1; text-align: center;">
							<input
								type="radio"
								bind:group={form.reviewType}
								value={t}
								style="display: none;"
							/>
							{t === 'weekly' ? '周复盘' : t === 'monthly' ? '月复盘' : '自定义'}
						</label>
					{/each}
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
						<label class="form-label">库存管理 (0-10)</label>
						<input class="form-input" type="number" min="0" max="10" bind:value={form.inventoryScore} />
					</div>
					<div class="form-group">
						<label class="form-label">综合评分 (0-10)</label>
						<input class="form-input" type="number" min="0" max="10" bind:value={form.overallScore} style="font-weight: 600; color: #2563eb;" />
					</div>
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">问题列表</h3>
				{#if form.issues.length > 0}
					<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
						{#each form.issues as issue, index}
							<div style="padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
								<div>
									<div style="font-weight: 500; color: #dc2626;">{issue.title}</div>
									{#if issue.description}
										<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">{issue.description}</div>
									{/if}
								</div>
								<button class="btn btn-secondary btn-sm" on:click={() => removeIssue(index)}>删除</button>
							</div>
						{/each}
					</div>
				{/if}
				<div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
					<div class="form-group">
						<label class="form-label">问题标题</label>
						<input class="form-input" bind:value={newIssueTitle} placeholder="输入问题标题" />
					</div>
					<div class="form-group">
						<label class="form-label">问题描述</label>
						<textarea class="form-textarea" bind:value={newIssueDescription} rows={2} placeholder="输入问题描述（可选）" />
					</div>
					<button class="btn btn-secondary" on:click={addIssue} disabled={!newIssueTitle.trim()}>+ 添加问题</button>
				</div>
			</div>

			<div class="section" style="margin: 24px 0; padding: 0;">
				<h3 class="section-title">改进建议</h3>
				{#if form.suggestions.length > 0}
					<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
						{#each form.suggestions as suggestion, index}
							<div style="padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
								<div>
									<div style="font-weight: 500; color: #16a34a;">💡 {suggestion.title}</div>
									{#if suggestion.description}
										<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">{suggestion.description}</div>
									{/if}
								</div>
								<button class="btn btn-secondary btn-sm" on:click={() => removeSuggestion(index)}>删除</button>
							</div>
						{/each}
					</div>
				{/if}
				<div style="padding: 16px; background: #f9fafb; border-radius: 8px;">
					<div class="form-group">
						<label class="form-label">建议标题</label>
						<input class="form-input" bind:value={newSuggestionTitle} placeholder="输入建议标题" />
					</div>
					<div class="form-group">
						<label class="form-label">建议描述</label>
						<textarea class="form-textarea" bind:value={newSuggestionDescription} rows={2} placeholder="输入建议描述（可选）" />
					</div>
					<button class="btn btn-secondary" on:click={addSuggestion} disabled={!newSuggestionTitle.trim()}>+ 添加建议</button>
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">复盘总结</label>
				<textarea class="form-textarea" bind:value={form.summary} rows={4} placeholder="请输入复盘总结" />
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
