<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ArrowLeft, Clock, User, MapPin, Package, Play, CheckCircle, XCircle, AlertTriangle, Eye, Plus } from 'lucide-svelte';
	import { getHeaders, userRole } from '$lib/stores';

	let defect = null;
	let users = [];
	let spareParts = [];
	let spareUsages = [];
	let reviewRecords = [];
	let loading = true;
	let selectedAssignee = '';
	let actionRemark = '';
	let showActionModal = false;
	let showSpareModal = false;
	let showReviewModal = false;
	let currentAction = '';
	let selectedSparePart = '';
	let spareQuantity = 1;
	let spareRemark = '';
	let reviewPowerRecovery = '';
	let reviewConclusion = '';
	let reviewResult = '';
	let reviewRemark = '';

	async function loadData() {
		const id = $page.params.id;
		try {
			const [defectRes, usersRes, partsRes, usagesRes, reviewsRes] = await Promise.all([
				fetch(`http://localhost:8080/api/defects/${id}`, { headers: getHeaders() }),
				fetch('http://localhost:8080/api/users', { headers: getHeaders() }),
				fetch('http://localhost:8080/api/spare-parts', { headers: getHeaders() }),
				fetch(`http://localhost:8080/api/defects/${id}/spare-usages`, { headers: getHeaders() }),
				fetch(`http://localhost:8080/api/defects/${id}/reviews`, { headers: getHeaders() })
			]);
			defect = await defectRes.json();
			users = await usersRes.json();
			spareParts = await partsRes.json();
			spareUsages = await usagesRes.json();
			reviewRecords = await reviewsRes.json();
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	function openActionModal(action) {
		currentAction = action;
		showActionModal = true;
		actionRemark = '';
	}

	async function executeAction() {
		if (!currentAction) return;

		let status = '';
		switch (currentAction) {
			case 'assign':
				status = 'assigned';
				break;
			case 'start':
				status = 'in_progress';
				break;
			case 'submit':
				status = 'pending_review';
				break;
			case 'approve':
				status = 'closed';
				break;
			case 'reject':
				status = 'rejected';
				break;
			case 'review':
				status = 'need_review';
				break;
		}

		try {
			await fetch(`http://localhost:8080/api/defects/${defect.id}/status`, {
				method: 'PUT',
				headers: getHeaders(),
				body: JSON.stringify({
					status,
					remark: actionRemark,
					assignee_id: selectedAssignee
				})
			});
			showActionModal = false;
			loadData();
		} catch (e) {
			console.error(e);
		}
	}

	onMount(() => {
		loadData();
	});

	$: role = $userRole;

	const statusLabels = {
		pending: '待处理',
		assigned: '已派单',
		in_progress: '处理中',
		pending_review: '待审核',
		rejected: '已驳回',
		closed: '已关闭',
		need_review: '需回查'
	};

	function canAssign() {
		return role === 'station_master' && defect?.status === 'pending';
	}

	function canStart() {
		return (role === 'inspector' || role === 'station_master') && 
		       (defect?.status === 'assigned' || defect?.status === 'rejected');
	}

	function canSubmit() {
		return (role === 'inspector' || role === 'station_master') && defect?.status === 'in_progress';
	}

	function canApprove() {
		return role === 'station_master' && defect?.status === 'pending_review';
	}

	function canReject() {
		return role === 'station_master' && defect?.status === 'pending_review';
	}

	function canNeedReview() {
		return role === 'station_master' && 
		       (defect?.status === 'pending_review' || defect?.status === 'closed');
	}

	function canUseSpare() {
		return (role === 'inspector' || role === 'station_master') && 
		       (defect?.status === 'in_progress');
	}

	function canReview() {
		return role === 'station_master' && defect?.status === 'need_review';
	}

	async function submitReview() {
		if (!reviewResult || !reviewPowerRecovery || !reviewConclusion) return;
		
		try {
			await fetch(`http://localhost:8080/api/defects/${defect.id}/reviews`, {
				method: 'POST',
				headers: getHeaders(),
				body: JSON.stringify({
					power_recovery: reviewPowerRecovery,
					conclusion: reviewConclusion,
					result: reviewResult,
					remark: reviewRemark
				})
			});
			showReviewModal = false;
			reviewPowerRecovery = '';
			reviewConclusion = '';
			reviewResult = '';
			reviewRemark = '';
			loadData();
		} catch (e) {
			console.error(e);
		}
	}

	async function useSpare() {
		if (!selectedSparePart || spareQuantity <= 0) return;
		
		try {
			await fetch(`http://localhost:8080/api/defects/${defect.id}/spare-usages`, {
				method: 'POST',
				headers: getHeaders(),
				body: JSON.stringify({
					spare_part_id: selectedSparePart,
					quantity: spareQuantity,
					remark: spareRemark
				})
			});
			showSpareModal = false;
			selectedSparePart = '';
			spareQuantity = 1;
			spareRemark = '';
			loadData();
		} catch (e) {
			console.error(e);
		}
	}

	function formatDate(dateStr) {
		const date = new Date(dateStr);
		return date.toLocaleString('zh-CN');
	}
</script>

<div class="detail-page">
	<header class="page-header">
		<div class="header-left">
			<a href="/defects" class="back-btn">
				<ArrowLeft size={20} />
			</a>
			<div>
				<h1>缺陷详情</h1>
				<p class="subtitle">ID: {defect?.id?.slice(0, 8)}</p>
			</div>
		</div>
		<div class="status-display">
			<span class="status-badge status-{defect?.status}">{statusLabels[defect?.status]}</span>
		</div>
	</header>

	{#if loading}
		<div class="loading">加载中...</div>
	{:else if defect}
		<div class="content-grid">
			<div class="main-content">
				<div class="card">
					<div class="card-header">
						<h2>{defect.title}</h2>
						<span class="priority priority-{defect.priority}">
							{defect.priority === 'high' ? '高优先级' : defect.priority === 'medium' ? '中优先级' : '低优先级'}
						</span>
					</div>
					<div class="info-grid">
						<div class="info-item">
							<MapPin size={16} />
							<span class="label">位置</span>
							<span class="value">{defect.location || '-'}</span>
						</div>
						<div class="info-item">
							<Package size={16} />
							<span class="label">设备</span>
							<span class="value">{defect.device || '-'}</span>
						</div>
						<div class="info-item">
							<User size={16} />
							<span class="label">上报人</span>
							<span class="value">{defect.reporter_name}</span>
						</div>
						<div class="info-item">
							<User size={16} />
							<span class="label">处理人</span>
							<span class="value">{defect.assignee_name || '未分配'}</span>
						</div>
						{#if defect.downtime_minutes}
							<div class="info-item">
								<Clock size={16} />
								<span class="label">停机时长</span>
								<span class="value highlight">{defect.downtime_minutes}分钟</span>
							</div>
						{/if}
					</div>

					<div class="section">
						<h3>详细描述</h3>
						<p class="description">{defect.description || '暂无描述'}</p>
					</div>

					{#if spareUsages.length > 0}
						<div class="section">
							<div class="section-header">
								<h3>备件领用明细</h3>
							</div>
							<div class="spare-list">
								{#each spareUsages as usage}
									<div class="spare-item">
										<div class="spare-info">
											<span class="spare-name">{usage.spare_part_name}</span>
											<span class="spare-model">{usage.spare_part_model}</span>
										</div>
										<div class="spare-quantity">x{usage.quantity} {usage.unit}</div>
										<div class="spare-meta">
											<span>领用人: {usage.operator_name}</span>
											<span>{formatDate(usage.created_at)}</span>
										</div>
										{#if usage.remark}
											<div class="spare-remark">{usage.remark}</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if reviewRecords.length > 0}
						<div class="section">
							<div class="section-header">
								<h3>回查记录</h3>
							</div>
							<div class="review-list">
								{#each reviewRecords as record}
									<div class="review-item">
										<div class="review-header">
											<span class="review-result result-{record.result}">
												{record.result === 'pass' ? '✓ 回查通过' : '✗ 回查不通过'}
											</span>
											<span class="review-time">{formatDate(record.review_time)}</span>
										</div>
										<div class="review-meta">回查人: {record.reviewer_name}</div>
										<div class="review-content">
											<div class="review-row">
												<span class="review-label">发电恢复情况</span>
												<span class="review-value">{record.power_recovery}</span>
											</div>
											<div class="review-row">
												<span class="review-label">回查结论</span>
												<span class="review-value">{record.conclusion}</span>
											</div>
											{#if record.remark}
												<div class="review-row">
													<span class="review-label">备注</span>
													<span class="review-value">{record.remark}</span>
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<div class="card timeline-card">
					<div class="card-header">
						<h2>状态时间轴</h2>
					</div>
					<div class="timeline">
						{#each defect.histories as history}
							<div class="timeline-item">
								<div class="timeline-dot"></div>
								<div class="timeline-content">
									<div class="timeline-header">
										<span class="action">{history.action}</span>
										<span class="time">{formatDate(history.created_at)}</span>
									</div>
									<div class="operator">操作人: {history.operator_name}</div>
									{#if history.remark}
										<div class="remark">{history.remark}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="sidebar">
				<div class="card">
					<div class="card-header">
						<h2>操作</h2>
					</div>
					<div class="action-list">
						{#if canAssign()}
							<button class="action-btn" on:click={() => openActionModal('assign')}>
								<User size={18} />
								<span>派单</span>
							</button>
						{/if}
						{#if canStart()}
							<button class="action-btn primary" on:click={() => openActionModal('start')}>
								<Play size={18} />
								<span>开始处理</span>
							</button>
						{/if}
						{#if canSubmit()}
							<button class="action-btn primary" on:click={() => openActionModal('submit')}>
								<CheckCircle size={18} />
								<span>提交整改</span>
							</button>
						{/if}
						{#if canUseSpare()}
							<button class="action-btn" on:click={() => showSpareModal = true}>
								<Package size={18} />
								<span>领用备件</span>
							</button>
						{/if}
						{#if canApprove()}
							<button class="action-btn success" on:click={() => openActionModal('approve')}>
								<CheckCircle size={18} />
								<span>审核通过</span>
							</button>
						{/if}
						{#if canReject()}
							<button class="action-btn danger" on:click={() => openActionModal('reject')}>
								<XCircle size={18} />
								<span>驳回</span>
							</button>
						{/if}
						{#if canNeedReview()}
							<button class="action-btn warning" on:click={() => openActionModal('review')}>
								<AlertTriangle size={18} />
								<span>标记需回查</span>
							</button>
						{/if}
						{#if canReview()}
							<button class="action-btn primary" on:click={() => showReviewModal = true}>
								<CheckCircle size={18} />
								<span>回查登记</span>
							</button>
						{/if}
						{#if !canAssign() && !canStart() && !canSubmit() && !canApprove() && !canReject() && !canNeedReview() && !canReview()}
							<div class="no-actions">当前状态无可用操作</div>
						{/if}
					</div>
				</div>

				<div class="card role-tip">
					<div class="tip-icon">💡</div>
					<div class="tip-content">
						<div class="tip-title">当前角色</div>
						<div class="tip-desc">
							{role === 'station_master' ? '站长' : role === 'inspector' ? '巡检工程师' : '运维内勤'}
						</div>
						<div class="tip-note">可在左侧切换角色体验不同权限</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if showActionModal}
		<div class="modal-overlay" on:click={() => showActionModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>
						{currentAction === 'assign' ? '派单' : 
						 currentAction === 'start' ? '开始处理' :
						 currentAction === 'submit' ? '提交整改' :
						 currentAction === 'approve' ? '审核通过' :
						 currentAction === 'reject' ? '驳回' : '标记需回查'}
					</h3>
					<button class="close-btn" on:click={() => showActionModal = false}>×</button>
				</div>
				<div class="modal-body">
					{#if currentAction === 'assign'}
						<div class="form-group">
							<label>选择处理人</label>
							<select bind:value={selectedAssignee}>
								<option value="">请选择</option>
								{#each users.filter(u => u.role === 'inspector') as user}
									<option value={user.id}>{user.name}</option>
								{/each}
							</select>
						</div>
					{/if}
					<div class="form-group">
						<label>备注说明</label>
						<textarea bind:value={actionRemark} rows="3" placeholder="输入备注信息"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-ghost" on:click={() => showActionModal = false}>取消</button>
					<button class="btn btn-primary" on:click={executeAction}>确认</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showSpareModal}
		<div class="modal-overlay" on:click={() => showSpareModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>领用备件</h3>
					<button class="close-btn" on:click={() => showSpareModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>选择备件</label>
						<select bind:value={selectedSparePart}>
							<option value="">请选择备件</option>
							{#each spareParts as part}
								<option value={part.id}>{part.name} ({part.model}) - 库存: {part.stock}{part.unit}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label>领用数量</label>
						<input type="number" bind:value={spareQuantity} min="1" placeholder="请输入数量" />
					</div>
					<div class="form-group">
						<label>备注说明</label>
						<textarea bind:value={spareRemark} rows="2" placeholder="领用说明"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-ghost" on:click={() => showSpareModal = false}>取消</button>
					<button class="btn btn-primary" on:click={useSpare}>确认领用</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showReviewModal}
		<div class="modal-overlay" on:click={() => showReviewModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>回查登记</h3>
					<button class="close-btn" on:click={() => showReviewModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>发电恢复情况 *</label>
						<textarea bind:value={reviewPowerRecovery} rows="2" placeholder="描述发电恢复情况，如：发电量已恢复至故障前95%"></textarea>
					</div>
					<div class="form-group">
						<label>回查结论 *</label>
						<textarea bind:value={reviewConclusion} rows="2" placeholder="回查结论描述"></textarea>
					</div>
					<div class="form-group">
						<label>回查结果 *</label>
						<select bind:value={reviewResult}>
							<option value="">请选择</option>
							<option value="pass">回查通过 - 关闭工单</option>
							<option value="fail">回查不通过 - 退回处理中</option>
						</select>
					</div>
					<div class="form-group">
						<label>备注说明</label>
						<textarea bind:value={reviewRemark} rows="2" placeholder="其他补充说明"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-ghost" on:click={() => showReviewModal = false}>取消</button>
					<button class="btn btn-primary" on:click={submitReview} disabled={!reviewResult || !reviewPowerRecovery || !reviewConclusion}>确认提交</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.detail-page {
		padding: 24px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.back-btn {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #64748b;
		text-decoration: none;
		transition: all 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.back-btn:hover {
		background: #f1f5f9;
		color: #1e293b;
	}

	.page-header h1 {
		font-size: 24px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 4px 0;
	}

	.subtitle {
		color: #64748b;
		margin: 0;
		font-size: 14px;
	}

	.status-badge {
		padding: 6px 14px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
	}

	.status-pending { background: #f1f5f9; color: #475569; }
	.status-assigned { background: #dbeafe; color: #2563eb; }
	.status-in_progress { background: #fef3c7; color: #d97706; }
	.status-pending_review { background: #ede9fe; color: #7c3aed; }
	.status-rejected { background: #fee2e2; color: #dc2626; }
	.status-closed { background: #dcfce7; color: #16a34a; }
	.status-need_review { background: #fef3c7; color: #d97706; }

	.loading {
		text-align: center;
		padding: 48px;
		color: #64748b;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 24px;
	}

	.card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		margin-bottom: 24px;
		overflow: hidden;
	}

	.card:last-child {
		margin-bottom: 0;
	}

	.card-header {
		padding: 20px 24px;
		border-bottom: 1px solid #f1f5f9;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.card-header h2 {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.priority {
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 13px;
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

	.info-grid {
		padding: 20px 24px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
		border-bottom: 1px solid #f1f5f9;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #64748b;
	}

	.info-item .label {
		font-size: 13px;
	}

	.info-item .value {
		color: #1e293b;
		font-weight: 500;
	}

	.info-item .value.highlight {
		color: #dc2626;
	}

	.section {
		padding: 20px 24px;
	}

	.section h3 {
		font-size: 14px;
		font-weight: 600;
		color: #475569;
		margin: 0 0 8px 0;
	}

	.description {
		color: #1e293b;
		line-height: 1.6;
		margin: 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.spare-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.spare-item {
		background: #f8fafc;
		border-radius: 8px;
		padding: 12px 16px;
		border-left: 3px solid #2563eb;
	}

	.spare-info {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}

	.spare-name {
		font-weight: 600;
		color: #1e293b;
		font-size: 14px;
	}

	.spare-model {
		font-size: 12px;
		color: #64748b;
	}

	.spare-quantity {
		font-size: 14px;
		font-weight: 600;
		color: #2563eb;
		margin-bottom: 6px;
	}

	.spare-meta {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: #64748b;
		margin-bottom: 4px;
	}

	.spare-remark {
		font-size: 13px;
		color: #475569;
		background: white;
		padding: 8px 12px;
		border-radius: 6px;
		margin-top: 8px;
	}

	.review-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.review-item {
		background: #f8fafc;
		border-radius: 8px;
		padding: 16px;
		border-left: 4px solid;
	}

	.review-item.result-pass {
		border-left-color: #16a34a;
	}

	.review-item.result-fail {
		border-left-color: #dc2626;
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.review-result {
		font-weight: 600;
		font-size: 14px;
		padding: 4px 10px;
		border-radius: 6px;
	}

	.review-result.result-pass {
		background: #dcfce7;
		color: #16a34a;
	}

	.review-result.result-fail {
		background: #fee2e2;
		color: #dc2626;
	}

	.review-time {
		font-size: 12px;
		color: #94a3b8;
	}

	.review-meta {
		font-size: 13px;
		color: #64748b;
		margin-bottom: 12px;
	}

	.review-content {
		background: white;
		border-radius: 6px;
		padding: 12px;
	}

	.review-row {
		display: flex;
		gap: 12px;
		padding: 6px 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.review-row:last-child {
		border-bottom: none;
	}

	.review-label {
		font-size: 13px;
		color: #64748b;
		min-width: 100px;
		flex-shrink: 0;
	}

	.review-value {
		font-size: 13px;
		color: #1e293b;
		flex: 1;
	}

	.timeline-card {
		margin-top: 24px;
	}

	.timeline {
		padding: 24px;
	}

	.timeline-item {
		display: flex;
		gap: 16px;
		padding-bottom: 24px;
		position: relative;
	}

	.timeline-item:last-child {
		padding-bottom: 0;
	}

	.timeline-item:not(:last-child)::after {
		content: '';
		position: absolute;
		left: 7px;
		top: 24px;
		width: 2px;
		height: calc(100% - 24px);
		background: #e2e8f0;
	}

	.timeline-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #2563eb;
		flex-shrink: 0;
		margin-top: 4px;
	}

	.timeline-content {
		flex: 1;
	}

	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.timeline-header .action {
		font-weight: 600;
		color: #1e293b;
		font-size: 14px;
	}

	.timeline-header .time {
		font-size: 12px;
		color: #94a3b8;
	}

	.operator {
		font-size: 13px;
		color: #64748b;
		margin-bottom: 4px;
	}

	.remark {
		font-size: 13px;
		color: #475569;
		background: #f8fafc;
		padding: 8px 12px;
		border-radius: 6px;
	}

	.action-list {
		padding: 16px;
	}

	.action-btn {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		margin-bottom: 8px;
		transition: all 0.2s;
		background: #f1f5f9;
		color: #1e293b;
	}

	.action-btn:hover {
		background: #e2e8f0;
	}

	.action-btn.primary {
		background: #2563eb;
		color: white;
	}

	.action-btn.primary:hover {
		background: #1d4ed8;
	}

	.action-btn.success {
		background: #16a34a;
		color: white;
	}

	.action-btn.success:hover {
		background: #15803d;
	}

	.action-btn.danger {
		background: #dc2626;
		color: white;
	}

	.action-btn.danger:hover {
		background: #b91c1c;
	}

	.action-btn.warning {
		background: #d97706;
		color: white;
	}

	.action-btn.warning:hover {
		background: #b45309;
	}

	.no-actions {
		padding: 24px;
		text-align: center;
		color: #94a3b8;
		font-size: 14px;
	}

	.role-tip {
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
		border: none;
		display: flex;
		gap: 12px;
		padding: 16px;
	}

	.tip-icon {
		font-size: 24px;
	}

	.tip-title {
		font-weight: 600;
		color: #78350f;
		font-size: 14px;
		margin-bottom: 2px;
	}

	.tip-desc {
		color: #92400e;
		font-size: 13px;
		margin-bottom: 4px;
	}

	.tip-note {
		font-size: 12px;
		color: #a16207;
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
		max-width: 440px;
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

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		border: none;
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

	.btn-ghost {
		background: transparent;
		color: #64748b;
	}

	.btn-ghost:hover {
		background: #f1f5f9;
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
</style>
