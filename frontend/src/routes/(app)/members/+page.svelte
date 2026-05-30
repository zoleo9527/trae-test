<script lang="ts">
	import { onMount } from 'svelte';
	import { memberApi, walletApi } from '$lib/api/client';
	import type { Member, WalletRecord } from '$lib/types';
	import { auth } from '$lib/stores/auth';
	import dayjs from 'dayjs';

	let members: Member[] = [];
	let loading = true;
	let searchQuery = '';
	let selectedMember: Member | null = null;
	let showWalletModal = false;
	let walletRecords: WalletRecord[] = [];
	let rechargeAmount = '';
	let rechargeRemark = '';

	$: filteredMembers = members.filter(m =>
		!searchQuery ||
		m.name.includes(searchQuery) ||
		m.phone.includes(searchQuery) ||
		m.level.includes(searchQuery)
	);

	$: canManage = $auth.user?.role === 'reception' || $auth.user?.role === 'venue_manager';

	onMount(async () => {
		try {
			members = await memberApi.list();
		} finally {
			loading = false;
		}
	});

	async function openWallet(member: Member) {
		selectedMember = member;
		try {
			const result = await walletApi.listRecords(member.id);
			walletRecords = result.records;
		} catch (e) {
			walletRecords = [];
		}
		showWalletModal = true;
	}

	async function handleRecharge() {
		if (!selectedMember || !rechargeAmount) return;
		try {
			const amount = parseFloat(rechargeAmount);
			await walletApi.recharge(selectedMember.id, {
				amount,
				remark: rechargeRemark || '前台充值'
			});
			const result = await walletApi.listRecords(selectedMember.id);
			walletRecords = result.records;

			const idx = members.findIndex(m => m.id === selectedMember!.id);
			if (idx !== -1 && result.wallet) {
				members[idx].wallet = result.wallet;
				members = members;
			}
			rechargeAmount = '';
			rechargeRemark = '';
		} catch (e: any) {
			alert(e.message);
		}
	}

	function formatDate(date: string) {
		return dayjs(date).format('YYYY-MM-DD');
	}

	function formatDateTime(date: string) {
		return dayjs(date).format('MM-DD HH:mm');
	}

	function getLevelColor(level: string) {
		switch (level) {
			case '钻石会员': return 'bg-purple-100 text-purple-700';
			case '金卡会员': return 'bg-yellow-100 text-yellow-700';
			case '银卡会员': return 'bg-gray-100 text-gray-700';
			default: return 'bg-green-100 text-green-700';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">会员储值</h1>
			<p class="text-gray-500">管理会员信息和储值账户</p>
		</div>
	</div>

	<div class="card p-4">
		<div class="flex gap-4">
			<div class="flex-1">
				<label class="label">搜索会员</label>
				<input
					type="text"
					class="input"
					placeholder="输入姓名、电话或会员等级..."
					bind:value={searchQuery}
				/>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
		</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="table">
				<thead>
					<tr>
						<th>会员</th>
						<th>电话</th>
						<th>等级</th>
						<th>入会时间</th>
						<th>累计消费</th>
						<th>到店次数</th>
						<th>储值余额</th>
						{#if canManage}
							<th>操作</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#if filteredMembers.length === 0}
						<tr>
							<td colspan="8" class="text-center py-12 text-gray-400">
								暂无会员
							</td>
						</tr>
					{:else}
						{#each filteredMembers as member}
							<tr>
								<td>
									<div class="flex items-center gap-3">
										<div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
											<span class="font-medium text-gray-600">{member.name.charAt(0)}</span>
										</div>
										<span class="font-medium text-gray-900">{member.name}</span>
									</div>
								</td>
								<td>{member.phone}</td>
								<td>
									<span class="badge {getLevelColor(member.level)}">
										{member.level}
									</span>
								</td>
								<td>{formatDate(member.joinDate)}</td>
								<td>¥{member.totalSpent.toFixed(2)}</td>
								<td>{member.totalVisits} 次</td>
								<td>
									<span class="font-medium text-green-600">
										¥{member.wallet?.balance.toFixed(2) || '0.00'}
									</span>
								</td>
								{#if canManage}
									<td>
										<button
											class="btn btn-outline text-sm"
											on:click={() => openWallet(member)}
										>
											账户明细
										</button>
									</td>
								{/if}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showWalletModal && selectedMember}
	<div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" on:click={() => showWalletModal = false}>
		<div class="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" on:click|stopPropagation>
			<div class="p-6 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold text-gray-900">{selectedMember.name} 的账户</h2>
						<p class="text-gray-500">{selectedMember.phone} · {selectedMember.level}</p>
					</div>
					<button
						class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						on:click={() => showWalletModal = false}
					>
						<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-4 mt-4">
					<div class="bg-green-50 rounded-xl p-4">
						<p class="text-sm text-green-600">当前余额</p>
						<p class="text-2xl font-bold text-green-700">
							¥{selectedMember.wallet?.balance.toFixed(2) || '0.00'}
						</p>
					</div>
					<div class="bg-gray-50 rounded-xl p-4">
						<p class="text-sm text-gray-600">累计充值</p>
						<p class="text-2xl font-bold text-gray-700">
							¥{selectedMember.wallet?.totalRecharged.toFixed(2) || '0.00'}
						</p>
					</div>
				</div>

				{#if canManage}
					<div class="mt-4 p-4 bg-gray-50 rounded-xl">
						<h3 class="font-medium text-gray-900 mb-3">储值充值</h3>
						<div class="flex gap-3">
							<div class="flex-1">
								<input
									type="number"
									class="input"
									placeholder="充值金额"
									bind:value={rechargeAmount}
								/>
							</div>
							<div class="flex-1">
								<input
									type="text"
									class="input"
									placeholder="备注（可选）"
									bind:value={rechargeRemark}
								/>
							</div>
							<button class="btn btn-primary" on:click={handleRecharge}>
								确认充值
							</button>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex-1 overflow-y-auto p-6">
				<h3 class="font-medium text-gray-900 mb-4">交易记录</h3>
				{#if walletRecords.length === 0}
					<div class="text-center py-8 text-gray-400">
						暂无交易记录
					</div>
				{:else}
					<div class="space-y-3">
						{#each walletRecords as record}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
								<div>
									<p class="font-medium text-gray-900">{record.type}</p>
									<p class="text-sm text-gray-500">{record.remark}</p>
									<p class="text-xs text-gray-400 mt-1">{formatDateTime(record.createdAt)}</p>
								</div>
								<div class="text-right">
									<p class={`font-bold ${record.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
										{record.amount >= 0 ? '+' : ''}¥{Math.abs(record.amount).toFixed(2)}
									</p>
									<p class="text-xs text-gray-400">余额: ¥{record.balanceAfter.toFixed(2)}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
