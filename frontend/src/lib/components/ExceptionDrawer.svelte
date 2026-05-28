<script>
	import { exceptionApi, authApi } from '$lib/api';
	import { user } from '$lib/stores/user';
	import { onMount } from 'svelte';
	import { getErrorMessage, isAuthError } from '$lib/utils';

	export let open = false;
	export let exceptionId = null;

	let exception = null;
	let logs = [];
	let users = [];
	let loading = false;
	let resolutionNote = '';
	let needReview = true;
	let reviewNote = '';
	let assignTo = '';
	let activeTab = 'detail';

	$: currentUser = $user;

	async function loadException() {
		if (!exceptionId) return;
		loading = true;
		try {
			const data = await exceptionApi.get(exceptionId);
			exception = data.exception;
			logs = data.logs;
			if (exception.assignedTo) {
				assignTo = exception.assignedTo;
			}
		} catch (e) {
			console.error('Failed to load exception:', e);
		} finally {
			loading = false;
		}
	}

	async function loadUsers() {
		try {
			users = await authApi.listUsers();
		} catch (e) {
			console.error('Failed to load users:', e);
		}
	}

	async function handleAssign() {
		if (!exception || !assignTo) return;
		try {
			exception = await exceptionApi.assign(exception.id, assignTo);
			await loadException();
		} catch (e) {
			alert('分配失败: ' + getErrorMessage(e));
		}
	}

	async function handleResolve() {
		if (!exception || !resolutionNote) return;
		try {
			exception = await exceptionApi.resolve(exception.id, resolutionNote, needReview);
			await loadException();
		} catch (e) {
			alert('处理失败: ' + getErrorMessage(e));
		}
	}

	async function handleReview() {
		if (!exception || !reviewNote) return;
		try {
			exception = await exceptionApi.review(exception.id, reviewNote);
			await loadException();
		} catch (e) {
			alert('复核失败: ' + getErrorMessage(e));
		}
	}

	async function handleReopen() {
		if (!exception) return;
		try {
			exception = await exceptionApi.reopen(exception.id);
			await loadException();
		} catch (e) {
			alert('重开失败: ' + getErrorMessage(e));
		}
	}

	function close() {
		open = false;
		exception = null;
		logs = [];
		resolutionNote = '';
		reviewNote = '';
		activeTab = 'detail';
	}

	$: if (open && exceptionId) {
		loadException();
		loadUsers();
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleString('zh-CN');
	}

	function getStatusLabel(status) {
		const map = {
			open: '待处理',
			handling: '处理中',
			resolved: '已解决',
			review: '已复核'
		};
		return map[status] || status;
	}

	function getStatusClass(status) {
		const map = {
			open: 'status-open',
			handling: 'status-handling',
			resolved: 'status-resolved',
			review: 'status-review'
		};
		return map[status] || '';
	}

	function getTypeLabel(type) {
		const map = {
			inventory: '库存异常',
			display: '陈列异常',
			timing: '时效异常',
			order: '订单异常',
			other: '其他异常'
		};
		return map[type] || type;
	}

	function getSeverityLabel(severity) {
		const map = {
			low: '低',
			medium: '中',
			high: '高'
		};
		return map[severity] || severity;
	}

	function getSeverityClass(severity) {
		const map = {
			low: 'severity-low',
			medium: 'severity-medium',
			high: 'severity-high'
		};
		return map[severity] || '';
	}

	function canResolve() {
		if (!exception || !currentUser) return false;
		if (exception.status === 'open' || exception.status === 'handling') {
			return currentUser.role === 'warehouse' || currentUser.role === 'manager';
		}
		return false;
	}

	function canReview() {
		if (!exception || !currentUser) return false;
		return exception.status === 'resolved' && exception.needReview && currentUser.role === 'manager';
	}

	function canAssign() {
		if (!exception || !currentUser) return false;
		return exception.status === 'open' && currentUser.role === 'manager';
	}

	function canReopen() {
		if (!exception || !currentUser) return false;
		return (exception.status === 'resolved' || exception.status === 'review') && currentUser.role === 'manager';
	}
</script>

<div class="drawer-backdrop" class:open on:click={close} />
<div class="drawer" class:open>
	<div class="drawer-header">
		<div class="drawer-title">
			<h3>异常详情</h3>
			{#if exception}
				<span class={`status-badge ${getStatusClass(exception.status)}`}>
					{getStatusLabel(exception.status)}
				</span>
			{/if}
		</div>
		<button class="close-btn" on:click={close}>×</button>
	</div>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else if exception}
		<div class="drawer-tabs">
			<button class={activeTab === 'detail' ? 'active' : ''} on:click={() => (activeTab = 'detail')}>
				详情
			</button>
			<button class={activeTab === 'logs' ? 'active' : ''} on:click={() => (activeTab = 'logs')}>
				操作留痕 ({logs.length})
			</button>
		</div>

		<div class="drawer-content">
			{#if activeTab === 'detail'}
				<div class="exception-detail">
					<div class="detail-section">
						<div class="detail-row">
							<label>异常类型</label>
							<span class="type-badge">{getTypeLabel(exception.type)}</span>
						</div>
						<div class="detail-row">
							<label>严重程度</label>
							<span class={`severity-badge ${getSeverityClass(exception.severity)}`}>
								{getSeverityLabel(exception.severity)}
							</span>
						</div>
						<div class="detail-row">
							<label>标题</label>
							<span class="detail-value">{exception.title}</span>
						</div>
						<div class="detail-row">
							<label>描述</label>
							<p class="detail-desc">{exception.description}</p>
						</div>
					</div>

					{#if exception.productName || exception.storeName}
						<div class="detail-section">
							<h4>关联信息</h4>
							{#if exception.productName}
								<div class="detail-row">
									<label>关联商品</label>
									<span class="detail-value">{exception.productSku} - {exception.productName}</span>
								</div>
							{/if}
							{#if exception.storeName}
								<div class="detail-row">
									<label>关联门店</label>
									<span class="detail-value">{exception.storeCode} - {exception.storeName}</span>
								</div>
							{/if}
							{#if exception.orderNo}
								<div class="detail-row">
									<label>关联订单</label>
									<span class="detail-value">{exception.orderNo}</span>
								</div>
							{/if}
						</div>
					{/if}

					<div class="detail-section">
						<h4>处理信息</h4>
						<div class="detail-row">
							<label>上报人</label>
							<span class="detail-value">{exception.reportedByName}</span>
						</div>
						<div class="detail-row">
							<label>上报时间</label>
							<span class="detail-value">{formatDate(exception.createdAt)}</span>
						</div>
						{#if exception.assignedToName}
							<div class="detail-row">
								<label>处理人</label>
								<span class="detail-value">{exception.assignedToName}</span>
							</div>
						{/if}
						{#if exception.resolutionNote}
							<div class="detail-row">
								<label>处理说明</label>
								<p class="detail-desc">{exception.resolutionNote}</p>
							</div>
						{/if}
						{#if exception.resolvedAt}
							<div class="detail-row">
								<label>解决时间</label>
								<span class="detail-value">{formatDate(exception.resolvedAt)}</span>
							</div>
						{/if}
						{#if exception.reviewNote}
							<div class="detail-row">
								<label>复核意见</label>
								<p class="detail-desc">{exception.reviewNote}</p>
							</div>
						{/if}
						{#if exception.reviewedByName}
							<div class="detail-row">
								<label>复核人</label>
								<span class="detail-value">{exception.reviewedByName}</span>
							</div>
						{/if}
					</div>

					{#if canAssign()}
						<div class="action-section">
							<h4>分配处理</h4>
							<div class="form-row">
								<select bind:value={assignTo}>
									<option value="">请选择处理人</option>
									{#each users as u}
										<option value={u.id}>{u.name} ({u.role === 'warehouse' ? '仓管' : u.role === 'manager' ? '店长' : '企划'})</option>
									{/each}
								</select>
								<button class="btn btn-primary" on:click={handleAssign} disabled={!assignTo}>
									分配
								</button>
							</div>
						</div>
					{/if}

					{#if canResolve()}
						<div class="action-section">
							<h4>处理异常</h4>
							<textarea
								bind:value={resolutionNote}
								placeholder="请输入处理说明..."
								rows={4}
							/>
							<label class="checkbox">
								<input type="checkbox" bind:checked={needReview} />
								需要店长复核
							</label>
							<button class="btn btn-success" on:click={handleResolve} disabled={!resolutionNote}>
								标记为已解决
							</button>
						</div>
					{/if}

					{#if canReview()}
						<div class="action-section">
							<h4>复核处理</h4>
							<textarea
								bind:value={reviewNote}
								placeholder="请输入复核意见..."
								rows={4}
							/>
							<button class="btn btn-primary" on:click={handleReview} disabled={!reviewNote}>
								确认复核
							</button>
						</div>
					{/if}

					{#if canReopen()}
						<div class="action-section">
							<button class="btn btn-warning" on:click={handleReopen}>
								重新打开
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="logs-section">
					{#each logs as log}
						<div class="log-item">
							<div class="log-header">
								<span class="log-action">{log.action}</span>
								<span class="log-time">{formatDate(log.createdAt)}</span>
							</div>
							<div class="log-body">
								<span class="log-operator">
									{log.operatorName} ({log.operatorRole === 'warehouse' ? '仓管' : log.operatorRole === 'manager' ? '店长' : '企划'})
								</span>
								{#if log.remark}
									<p class="log-remark">{log.remark}</p>
								{/if}
							</div>
						</div>
					{/each}
					{#if logs.length === 0}
						<div class="empty">暂无操作记录</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		z-index: 1000;
	}

	.drawer-backdrop.open {
		opacity: 1;
		visibility: visible;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: -500px;
		width: 500px;
		height: 100vh;
		background: #fff;
		box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
		transition: right 0.3s ease;
		z-index: 1001;
		display: flex;
		flex-direction: column;
	}

	.drawer.open {
		right: 0;
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px 24px;
		border-bottom: 1px solid #e5e7eb;
	}

	.drawer-title {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.drawer-title h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 28px;
		cursor: pointer;
		color: #6b7280;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #374151;
	}

	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}

	.status-open {
		background: #fef2f2;
		color: #dc2626;
	}

	.status-handling {
		background: #fef3c7;
		color: #d97706;
	}

	.status-resolved {
		background: #dcfce7;
		color: #16a34a;
	}

	.status-review {
		background: #dbeafe;
		color: #2563eb;
	}

	.drawer-tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
		padding: 0 24px;
	}

	.drawer-tabs button {
		background: none;
		border: none;
		padding: 16px 0;
		margin-right: 24px;
		font-size: 14px;
		color: #6b7280;
		cursor: pointer;
		border-bottom: 2px solid transparent;
	}

	.drawer-tabs button.active {
		color: #2563eb;
		border-bottom-color: #2563eb;
		font-weight: 500;
	}

	.drawer-content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}

	.loading {
		text-align: center;
		padding: 40px;
		color: #6b7280;
	}

	.detail-section {
		margin-bottom: 24px;
	}

	.detail-section h4 {
		margin: 0 0 16px 0;
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.detail-row {
		display: flex;
		margin-bottom: 12px;
	}

	.detail-row label {
		width: 100px;
		flex-shrink: 0;
		color: #6b7280;
		font-size: 14px;
	}

	.detail-value {
		flex: 1;
		color: #111827;
		font-size: 14px;
	}

	.detail-desc {
		flex: 1;
		color: #111827;
		font-size: 14px;
		margin: 0;
		line-height: 1.6;
	}

	.type-badge {
		padding: 2px 10px;
		background: #f3f4f6;
		border-radius: 4px;
		font-size: 12px;
		color: #374151;
	}

	.severity-badge {
		padding: 2px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	.severity-low {
		background: #dcfce7;
		color: #16a34a;
	}

	.severity-medium {
		background: #fef3c7;
		color: #d97706;
	}

	.severity-high {
		background: #fef2f2;
		color: #dc2626;
	}

	.action-section {
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid #e5e7eb;
	}

	.action-section h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.form-row {
		display: flex;
		gap: 12px;
	}

	select,
	textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		resize: vertical;
	}

	select:focus,
	textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	textarea {
		margin-bottom: 12px;
	}

	.checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
		font-size: 14px;
		color: #374151;
		cursor: pointer;
	}

	.btn {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #2563eb;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.btn-success {
		background: #16a34a;
		color: white;
	}

	.btn-success:hover:not(:disabled) {
		background: #15803d;
	}

	.btn-warning {
		background: #d97706;
		color: white;
	}

	.btn-warning:hover:not(:disabled) {
		background: #b45309;
	}

	.logs-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.log-item {
		background: #f9fafb;
		border-radius: 8px;
		padding: 16px;
	}

	.log-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.log-action {
		font-weight: 500;
		color: #2563eb;
		font-size: 14px;
	}

	.log-time {
		font-size: 12px;
		color: #9ca3af;
	}

	.log-operator {
		font-size: 13px;
		color: #6b7280;
	}

	.log-remark {
		margin: 8px 0 0 0;
		font-size: 14px;
		color: #374151;
		line-height: 1.6;
	}

	.empty {
		text-align: center;
		padding: 40px;
		color: #9ca3af;
		font-size: 14px;
	}
</style>
