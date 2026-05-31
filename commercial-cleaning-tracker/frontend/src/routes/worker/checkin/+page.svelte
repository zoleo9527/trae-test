<script lang="ts">
	import { onMount } from 'svelte';
	import Layout from '$lib/components/Layout.svelte';
	import { getShifts, createCheckIn, checkOut, currentUser } from '$lib/stores';
	import type { Shift } from '$lib/types';

	let shifts: Shift[] = [];
	let loading = true;
	let selectedShift: Shift | null = null;
	let showCheckInModal = false;
	let checkInLocation = '';
	let checkInRemark = '';

	async function loadData() {
		try {
			if ($currentUser) {
				shifts = await getShifts({ workerId: $currentUser.id });
			}
		} finally {
			loading = false;
		}
	}

	function openCheckInModal(shift: Shift) {
		selectedShift = shift;
		checkInLocation = shift.schedule?.project?.address || '';
		checkInRemark = '';
		showCheckInModal = true;
	}

	async function handleCheckIn() {
		if (!selectedShift) return;
		try {
			await createCheckIn({
				shiftId: selectedShift.id,
				location: checkInLocation,
				remark: checkInRemark
			});
			showCheckInModal = false;
			loadData();
			alert('打卡成功！');
		} catch (e) {
			alert('打卡失败');
		}
	}

	async function handleCheckOut(shift: Shift) {
		const ci = shift.checkIns?.[0];
		if (!ci) return;
		try {
			await checkOut(ci.id);
			loadData();
			alert('签退成功！');
		} catch (e) {
			alert('签退失败');
		}
	}

	onMount(() => loadData());
</script>

<Layout title="打卡" activeMenu="checkin">
	{#if loading}
		<p>加载中...</p>
	{:else}
		<div class="checkin-list">
			{#each shifts as shift}
				{@const ci = shift.checkIns?.[0]}
				<div class="checkin-card">
					<div class="card-header">
						<h3>{shift.schedule?.project?.name || '项目'}</h3>
						<span class="date">{new Date(shift.date).toLocaleDateString()}</span>
					</div>
					<div class="card-body">
						<div class="time-info">
							<span class="time">{shift.startTime} - {shift.endTime}</span>
							<span class="area">{shift.area}</span>
						</div>
						{#if ci}
							<div class="checkin-status">
								<div class="status-item">
									<span class="label">上班打卡</span>
									<span class="value">{ci.checkInTime ? new Date(ci.checkInTime).toLocaleTimeString() : '-'}</span>
								</div>
								<div class="status-item">
									<span class="label">下班签退</span>
									<span class="value">{ci.checkOutTime ? new Date(ci.checkOutTime).toLocaleTimeString() : '-'}</span>
								</div>
								<div class="status-item {ci.status}">
									<span class="label">状态</span>
									<span class="value">
										{{ normal: '正常', late: '迟到', early: '早退', missing: '未打卡', exception: '异常' }[ci.status]}
									</span>
								</div>
							</div>
							{#if ci.checkInTime && !ci.checkOutTime}
								<button class="checkout-btn" on:click={() => handleCheckOut(shift)}>
									签退
								</button>
							{/if}
						{:else}
							<button class="checkin-btn" on:click={() => openCheckInModal(shift)}>
								上班打卡
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showCheckInModal && selectedShift}
		<div class="modal-overlay" on:click={() => (showCheckInModal = false)}>
			<div class="modal" on:click|stopPropagation>
				<h3>上班打卡</h3>
				<p class="sub">{selectedShift.schedule?.project?.name} - {new Date(selectedShift.date).toLocaleDateString()}</p>
				
				<div class="form-group">
					<label>打卡位置</label>
					<input type="text" bind:value={checkInLocation} />
				</div>
				<div class="form-group">
					<label>备注</label>
					<textarea bind:value={checkInRemark} rows="3" placeholder="如有异常请说明..."></textarea>
				</div>

				<div class="modal-actions">
					<button on:click={() => (showCheckInModal = false)}>取消</button>
					<button class="primary-btn" on:click={handleCheckIn}>确认打卡</button>
				</div>
			</div>
		</div>
	{/if}
</Layout>

<style>
	.checkin-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.checkin-card {
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
		overflow: hidden;
	}
	.card-header {
		padding: 16px 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.card-header h3 { margin: 0; font-size: 16px; }
	.date { font-size: 14px; opacity: 0.9; }
	.card-body { padding: 20px; }
	.time-info {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
	}
	.time { color: #667eea; font-weight: 500; }
	.area { color: #718096; }
	.checkin-status {
		display: flex;
		gap: 20px;
		padding: 16px;
		background: #f7fafc;
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.status-item {
		text-align: center;
		flex: 1;
	}
	.status-item .label {
		display: block;
		font-size: 12px;
		color: #718096;
		margin-bottom: 4px;
	}
	.status-item .value {
		font-weight: 600;
		color: #2d3748;
	}
	.status-item.normal .value { color: #48bb78; }
	.status-item.late .value { color: #ed8936; }
	.status-item.early .value { color: #ed8936; }
	.status-item.missing .value { color: #e53e3e; }
	.status-item.exception .value { color: #e53e3e; }
	.checkin-btn, .checkout-btn {
		width: 100%;
		padding: 12px;
		border: none;
		border-radius: 6px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
	}
	.checkin-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
	}
	.checkout-btn {
		background: #48bb78;
		color: white;
	}
	.modal-overlay {
		position: fixed; inset: 0;
		background: rgba(0,0,0,0.5);
		display: flex; align-items: center; justify-content: center;
		z-index: 1000;
	}
	.modal {
		background: white;
		padding: 24px;
		border-radius: 12px;
		width: 100%;
		max-width: 400px;
	}
	.modal h3 { margin: 0 0 4px 0; }
	.sub { color: #718096; margin: 0 0 20px 0; }
	.form-group { margin-bottom: 16px; }
	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 14px;
		color: #4a5568;
	}
	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		box-sizing: border-box;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 20px;
	}
	.modal-actions button {
		padding: 10px 20px;
		border: 1px solid #e2e8f0;
		background: white;
		border-radius: 6px;
		cursor: pointer;
	}
	.modal-actions .primary-btn {
		background: #667eea;
		color: white;
		border: none;
	}
</style>
