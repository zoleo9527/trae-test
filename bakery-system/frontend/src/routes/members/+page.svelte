<script>
	import { onMount } from 'svelte';
	import { api } from '$lib/api';

	let members = [];
	let searchQuery = '';
	let selectedMember = null;
	let showRechargeModal = false;
	let showMemberModal = false;
	let isEditing = false;

	let newMember = { name: '', phone: '', remark: '' };
	let rechargeForm = { amount: 0, bonus: 0, paymentType: 'cash', operator: '门店主理人', remark: '' };

	$: filteredMembers = members.filter(m =>
		m.name.includes(searchQuery) || m.phone.includes(searchQuery)
	);

	onMount(loadMembers);

	async function loadMembers() {
		const res = await api.getMembers();
		members = res.data || [];
	}

	async function handleSaveMember() {
		if (isEditing) {
			await api.updateMember(selectedMember.id, newMember);
		} else {
			await api.createMember(newMember);
		}
		showMemberModal = false;
		loadMembers();
		newMember = { name: '', phone: '', remark: '' };
	}

	function openEditMember(member) {
		selectedMember = member;
		newMember = { ...member };
		isEditing = true;
		showMemberModal = true;
	}

	function openNewMember() {
		newMember = { name: '', phone: '', remark: '' };
		isEditing = false;
		showMemberModal = true;
	}

	function openRecharge(member) {
		selectedMember = member;
		rechargeForm = { amount: 0, bonus: 0, paymentType: 'cash', operator: '门店主理人', remark: '' };
		showRechargeModal = true;
	}

	async function handleRecharge() {
		await api.recharge(selectedMember.id, rechargeForm);
		showRechargeModal = false;
		loadMembers();
	}

	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString('zh-CN');
	}
</script>

<div>
	<div class="filters">
		<input
			type="text"
			class="input"
			placeholder="搜索会员姓名或手机号..."
			bind:value={searchQuery}
		/>
		<button class="btn btn-primary" on:click={openNewMember}>+ 新增会员</button>
	</div>

	<div class="card">
		<div class="table-container">
			<table>
				<thead>
					<tr>
						<th>会员姓名</th>
						<th>手机号</th>
						<th>当前余额</th>
						<th>累计储值</th>
						<th>注册时间</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredMembers as member}
						<tr>
							<td><strong>{member.name}</strong></td>
							<td>{member.phone}</td>
							<td style="color: var(--success); font-weight: 600;">¥{member.balance.toFixed(2)}</td>
							<td>¥{member.totalRecharge.toFixed(2)}</td>
							<td>{formatDate(member.createdAt)}</td>
							<td><span class="badge {member.status}">{member.status === 'active' ? '正常' : '停用'}</span></td>
							<td>
								<div class="btn-group">
									<button class="btn btn-sm btn-outline" on:click={() => openEditMember(member)}>编辑</button>
									<button class="btn btn-sm btn-primary" on:click={() => openRecharge(member)}>储值</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if showMemberModal}
		<div class="modal-overlay" on:click={() => showMemberModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>{isEditing ? '编辑会员' : '新增会员'}</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showMemberModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>会员姓名</label>
						<input type="text" class="input" bind:value={newMember.name} style="width: 100%;" />
					</div>
					<div class="form-group">
						<label>手机号</label>
						<input type="text" class="input" bind:value={newMember.phone} style="width: 100%;" />
					</div>
					<div class="form-group">
						<label>备注</label>
						<textarea class="input" bind:value={newMember.remark} style="width: 100%; min-height: 80px;"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showMemberModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleSaveMember}>保存</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRechargeModal}
		<div class="modal-overlay" on:click={() => showRechargeModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>会员储值 - {selectedMember?.name}</h3>
					<button class="btn btn-sm btn-outline" on:click={() => showRechargeModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>当前余额</label>
						<div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">
							¥{selectedMember?.balance.toFixed(2)}
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label>储值金额</label>
							<input type="number" class="input" bind:value={rechargeForm.amount} style="width: 100%;" />
						</div>
						<div class="form-group">
							<label>赠送金额</label>
							<input type="number" class="input" bind:value={rechargeForm.bonus} style="width: 100%;" />
						</div>
					</div>
					<div class="form-group">
						<label>支付方式</label>
						<select class="input" bind:value={rechargeForm.paymentType} style="width: 100%;">
							<option value="cash">现金</option>
							<option value="wechat">微信</option>
							<option value="alipay">支付宝</option>
							<option value="card">银行卡</option>
						</select>
					</div>
					<div class="form-group">
						<label>操作人</label>
						<input type="text" class="input" bind:value={rechargeForm.operator} style="width: 100%;" />
					</div>
					<div class="form-group">
						<label>备注</label>
						<textarea class="input" bind:value={rechargeForm.remark} style="width: 100%; min-height: 60px;"></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-outline" on:click={() => showRechargeModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleRecharge}>确认储值</button>
				</div>
			</div>
		</div>
	{/if}
</div>
