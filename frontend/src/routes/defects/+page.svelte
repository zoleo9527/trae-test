<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Plus, Filter, CheckSquare, Trash2 } from 'lucide-svelte';
	import { getHeaders } from '$lib/stores';

	let defects = [];
	let showCreateModal = false;
	let selectedIds = new Set();
	let showBatchModal = false;
	let batchStatus = '';
	let batchRemark = '';
	let currentFilter = 'all';

	let newDefect = {
		title: '',
		description: '',
		device: '',
		location: '',
		priority: 'medium',
		remark: ''
	};

	async function loadDefects() {
		const status = $page.url.searchParams.get('status');
		if (status) currentFilter = status;
		
		let url = 'http://localhost:8080/api/defects';
		if (currentFilter !== 'all') {
			url += `?status=${currentFilter}`;
		}
		
		try {
			const res = await fetch(url, {
				headers: getHeaders()
			});
			defects = await res.json();
		} catch (e) {
			console.error(e);
		}
	}

	async function createDefect() {
		if (!newDefect.title) return;
		
		try {
			await fetch('http://localhost:8080/api/defects', {
				method: 'POST',
				headers: getHeaders(),
				body: JSON.stringify(newDefect)
			});
			showCreateModal = false;
			newDefect = { title: '', description: '', device: '', location: '', priority: 'medium', remark: '' };
			loadDefects();
		} catch (e) {
			console.error(e);
		}
	}

	function toggleSelect(id) {
		if (selectedIds.has(id)) {
			selectedIds.delete(id);
		} else {
			selectedIds.add(id);
		}
		selectedIds = new Set(selectedIds);
	}

	function toggleSelectAll() {
		if (selectedIds.size === defects.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(defects.map(d => d.id));
		}
	}

	async function batchUpdate() {
		if (!batchStatus || selectedIds.size === 0) return;
		
		try {
			await fetch('http://localhost:8080/api/defects/batch-status', {
				method: 'POST',
				headers: getHeaders(),
				body: JSON.stringify({
					ids: Array.from(selectedIds),
					status: batchStatus,
					remark: batchRemark
				})
			});
			showBatchModal = false;
			selectedIds = new Set();
			batchStatus = '';
			batchRemark = '';
			loadDefects();
		} catch (e) {
			console.error(e);
		}
	}

	function setFilter(status) {
		currentFilter = status;
		loadDefects();
	}

	onMount(() => {
		loadDefects();
	});

	const statusLabels = {
		pending: '待处理',
		assigned: '已派单',
		in_progress: '处理中',
		pending_review: '待审核',
		rejected: '已驳回',
		closed: '已关闭',
		need_review: '需回查'
	};

	const filters = [
		{ key: 'all', label: '全部' },
		{ key: 'pending', label: '待处理' },
		{ key: 'assigned', label: '已派单' },
		{ key: 'in_progress', label: '处理中' },
		{ key: 'pending_review', label: '待审核' },
		{ key: 'rejected', label: '已驳回' },
		{ key: 'need_review', label: '需回查' },
		{ key: 'closed', label: '已关闭' }
	];
</script>

<div class="defects-page">
	<header class="page-header">
		<div>
			<h1>缺陷管理</h1>
			<p class="subtitle">管理所有设备缺陷登记与整改流程</p>
		</div>
		<div class="header-actions">
			{#if selectedIds.size > 0}
				<button class="btn btn-secondary" on:click={() => showBatchModal = true}>
					<CheckSquare size={18} />
					批量处理 ({selectedIds.size})
				</button>
			{/if}
			<button class="btn btn-primary" on:click={() => showCreateModal = true}>
				<Plus size={18} />
				登记缺陷
			</button>
		</div>
	</header>

	<div class="filter-bar">
		{#each filters as f}
			<button class="filter-btn" class:active={currentFilter === f.key} on:click={() => setFilter(f.key)}>
				{f.label}
			</button>
		{/each}
	</div>

	<div class="table-container">
		<table class="data-table">
			<thead>
				<tr>
					<th style="width: 40px;">
						<input type="checkbox" on:change={toggleSelectAll} checked={selectedIds.size === defects.length && defects.length > 0} />
					</th>
					<th>优先级</th>
					<th>缺陷标题</th>
					<th>设备位置</th>
					<th>状态</th>
					<th>上报人</th>
					<th>处理人</th>
					<th>停机时长</th>
					<th>创建时间</th>
				</tr>
			</thead>
			<tbody>
				{#each defects as defect}
					<tr on:click={() => location.href = `/defects/${defect.id}`}>
						<td on:click|stopPropagation>
							<input type="checkbox" checked={selectedIds.has(defect.id)} on:change={() => toggleSelect(defect.id)} />
						</td>
						<td>
							<span class="priority priority-{defect.priority}">{defect.priority === 'high' ? '高' : defect.priority === 'medium' ? '中' : '低'}</span>
						</td>
						<td class="title-cell">
							<span>{defect.title}</span>
						</td>
						<td>{defect.location}</td>
						<td>
							<span class="status-badge status-{defect.status}">{statusLabels[defect.status]}</span>
						</td>
						<td>{defect.reporter_name}</td>
						<td>{defect.assignee_name || '-'}</td>
						<td>{defect.downtime_minutes ? `${defect.downtime_minutes}分钟` : '-'}</td>
						<td>{new Date(defect.created_at).toLocaleDateString()}</td>
					</tr>
				{:else}
					<tr>
						<td colspan="9" class="empty-cell">暂无缺陷记录</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if showCreateModal}
		<div class="modal-overlay" on:click={() => showCreateModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>登记缺陷</h3>
					<button class="close-btn" on:click={() => showCreateModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>缺陷标题 *</label>
						<input type="text" bind:value={newDefect.title} placeholder="简要描述缺陷问题" />
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>设备位置</label>
							<input type="text" bind:value={newDefect.location} placeholder="如：1号方阵-3区" />
						</div>
						<div class="form-group">
							<label>设备型号</label>
							<input type="text" bind:value={newDefect.device} placeholder="设备型号" />
						</div>
					</div>
					<div class="form-group">
						<label>优先级</label>
						<select bind:value={newDefect.priority}>
							<option value="low">低</option>
							<option value="medium">中</option>
							<option value="high">高</option>
						</select>
					</div>
					<div class="form-group">
						<label>详细描述</label>
						<textarea bind:value={newDefect.description} rows="3" placeholder="详细描述缺陷现象"></textarea>
					</div>
					<div class="form-group">
						<label>备注</label>
						<textarea bind:value={newDefect.remark} rows="2" placeholder="其他补充信息"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-ghost" on:click={() => showCreateModal = false}>取消</button>
					<button class="btn btn-primary" on:click={createDefect}>提交</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showBatchModal}
		<div class="modal-overlay" on:click={() => showBatchModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>批量处理 ({selectedIds.size} 项)</h3>
					<button class="close-btn" on:click={() => showBatchModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>目标状态</label>
						<select bind:value={batchStatus}>
							<option value="">请选择</option>
							<option value="assigned">已派单</option>
							<option value="in_progress">处理中</option>
							<option value="pending_review">待审核</option>
							<option value="closed">已关闭</option>
							<option value="need_review">需回查</option>
						</select>
					</div>
					<div class="form-group">
						<label>批量备注</label>
						<textarea bind:value={batchRemark} rows="2" placeholder="批量处理说明"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-ghost" on:click={() => showBatchModal = false}>取消</button>
					<button class="btn btn-primary" on:click={batchUpdate}>确认批量处理</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.defects-page {
		padding: 24px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 20px;
	}

	.page-header h1 {
		font-size: 28px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 4px 0;
	}

	.subtitle {
		color: #64748b;
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 12px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		border: none;
		text-decoration: none;
		transition: all 0.2s;
		font-size: 14px;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
	}

	.btn-primary:hover {
		background: #1d4ed8;
	}

	.btn-secondary {
		background: #f1f5f9;
		color: #1e293b;
	}

	.btn-secondary:hover {
		background: #e2e8f0;
	}

	.btn-ghost {
		background: transparent;
		color: #64748b;
	}

	.btn-ghost:hover {
		background: #f1f5f9;
	}

	.filter-bar {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 8px 16px;
		border: none;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		color: #64748b;
		transition: all 0.2s;
	}

	.filter-btn:hover {
		background: #f1f5f9;
	}

	.filter-btn.active {
		background: #2563eb;
		color: white;
	}

	.table-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table th {
		background: #f8fafc;
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		font-size: 13px;
		color: #475569;
		border-bottom: 1px solid #e2e8f0;
	}

	.data-table td {
		padding: 12px 16px;
		border-bottom: 1px solid #f1f5f9;
		font-size: 14px;
		color: #1e293b;
		cursor: pointer;
	}

	.data-table tr:hover td {
		background: #f8fafc;
	}

	.data-table tr:last-child td {
		border-bottom: none;
	}

	.title-cell {
		font-weight: 500;
	}

	.priority {
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
	}

	.priority-high {
		background: #fee2e2;
		color: #dc2626;
	}

	.priority-medium {
		background: #fef3c7;
		color: #d97706;
	}

	.priority-low {
		background: #dcfce7;
		color: #16a34a;
	}

	.status-badge {
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-pending { background: #f1f5f9; color: #475569; }
	.status-assigned { background: #dbeafe; color: #2563eb; }
	.status-in_progress { background: #fef3c7; color: #d97706; }
	.status-pending_review { background: #ede9fe; color: #7c3aed; }
	.status-rejected { background: #fee2e2; color: #dc2626; }
	.status-closed { background: #dcfce7; color: #16a34a; }
	.status-need_review { background: #fef3c7; color: #d97706; }

	.empty-cell {
		text-align: center;
		padding: 48px !important;
		color: #94a3b8;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: white;
		border-radius: 12px;
		width: 100%;
		max-width: 520px;
		max-height: 90vh;
		overflow: auto;
	}

	.modal-header {
		padding: 20px 24px;
		border-bottom: 1px solid #f1f5f9;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #64748b;
		line-height: 1;
	}

	.modal-body {
		padding: 24px;
	}

	.modal-footer {
		padding: 16px 24px;
		border-top: 1px solid #f1f5f9;
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
		font-weight: 500;
		color: #334155;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #2563eb;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
</style>
