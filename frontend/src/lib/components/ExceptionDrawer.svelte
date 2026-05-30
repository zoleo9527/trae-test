<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Booking, Exception, ExceptionType, ExceptionSeverity, ExceptionStatus } from '$lib/types';
	import {
		STATUS_COLORS,
		STATUS_LABELS,
		EXCEPTION_SEVERITY_COLORS,
		EXCEPTION_SEVERITY_LABELS,
		EXCEPTION_STATUS_COLORS,
		EXCEPTION_STATUS_LABELS,
		EXCEPTION_TYPE_LABELS
	} from '$lib/types';
	import { bookingApi } from '$lib/api/client';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import 'dayjs/locale/zh-cn';

	dayjs.extend(relativeTime);
	dayjs.locale('zh-cn');

	export let bookingId: string | null = null;
	export let open = false;

	const dispatch = createEventDispatcher<{ close: void; updated: Booking }>();

	let booking: Booking | null = null;
	let loading = false;
	let activeTab = 'overview';
	let showResolveForm = false;
	let showExceptionForm = false;
	let followUpNote = '';

	let resolveForm = {
		resolution: '',
		refundAmount: 0,
		penaltyAmount: 0,
		status: 'resolved' as ExceptionStatus
	};

	let newExceptionForm = {
		type: 'other' as ExceptionType,
		severity: 'medium' as ExceptionSeverity,
		title: '',
		description: ''
	};

	$: if (open && bookingId) {
		loadBooking();
	}

	$: activeExceptions = booking?.exceptions?.filter(e => e.status === 'open' || e.status === 'investigating') || [];
	$: resolvedExceptions = booking?.exceptions?.filter(e => e.status === 'resolved' || e.status === 'closed') || [];

	async function loadBooking() {
		if (!bookingId) return;
		loading = true;
		try {
			booking = await bookingApi.get(bookingId);
		} finally {
			loading = false;
		}
	}

	function close() {
		open = false;
		dispatch('close');
	}

	async function handleCheckIn() {
		if (!booking) return;
		try {
			booking = await bookingApi.checkIn(booking.id);
			dispatch('updated', booking);
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function handleCheckOut() {
		if (!booking) return;
		try {
			const result = await bookingApi.checkOut(booking.id);
			booking = result.booking;
			dispatch('updated', booking);
			if (result.warning) {
				alert(result.warning);
			}
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function handleCreateException() {
		if (!booking || !newExceptionForm.title || !newExceptionForm.description) {
			alert('请填写完整信息');
			return;
		}

		try {
			const ex = await bookingApi.createException(booking.id, newExceptionForm);
			booking = await bookingApi.get(booking.id);
			showExceptionForm = false;
			newExceptionForm = { type: 'other', severity: 'medium', title: '', description: '' };
			dispatch('updated', booking);
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function handleResolveException(exception: Exception) {
		if (!booking) return;

		try {
			const ex = await bookingApi.resolveException(exception.id, resolveForm);
			booking = await bookingApi.get(booking.id);
			showResolveForm = false;
			resolveForm = { resolution: '', refundAmount: 0, penaltyAmount: 0, status: 'resolved' };
			dispatch('updated', booking);
		} catch (e: any) {
			alert(e.message);
		}
	}

	async function handleAddFollowUp(exceptionId: string) {
		if (!followUpNote.trim()) return;
		try {
			await bookingApi.addFollowUp(exceptionId, { note: followUpNote });
			booking = await bookingApi.get(bookingId!);
			followUpNote = '';
			dispatch('updated', booking);
		} catch (e: any) {
			alert(e.message);
		}
	}

	function formatTime(date: string) {
		return dayjs(date).format('YYYY-MM-DD HH:mm');
	}

	function fromNow(date: string) {
		return dayjs(date).fromNow();
	}

	function formatAmount(amount: number) {
		return amount.toFixed(2);
	}
</script>

{#if open}
	<div class="drawer-overlay" on:click={close}></div>

	<div class="drawer {open ? 'drawer-open' : 'drawer-closed'}">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<div class="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
			</div>
		{:else if booking}
			<div class="flex flex-col h-full">
				<div class="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<h2 class="text-xl font-bold text-gray-900">{booking.memberName}</h2>
								<span class="badge {STATUS_COLORS[booking.status]}">{STATUS_LABELS[booking.status]}</span>
								{#if booking.exceptions && booking.exceptions.length > 0}
									<span class="badge bg-orange-100 text-orange-700">
										{booking.exceptions.length} 个异常
									</span>
								{/if}
							</div>
							<div class="text-sm text-gray-500 space-y-1">
								<p>📞 {booking.memberPhone}</p>
								<p>🏌️ {booking.bayNumber} · {dayjs(booking.startAt).format('HH:mm')} - {dayjs(booking.endAt).format('HH:mm')} · {booking.durationHours}小时</p>
								{#if booking.coachName}
									<p>👨‍🏫 教练: {booking.coachName}</p>
								{/if}
								<p>💰 应付: ¥{formatAmount(booking.totalAmount)} / 已付: ¥{formatAmount(booking.paidAmount)}</p>
							</div>
						</div>
						<button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" on:click={close}>
							<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					</div>

					<div class="flex gap-2 mt-4">
						{#if booking.status === 'confirmed'}
							<button class="btn btn-primary" on:click={handleCheckIn}>签到</button>
						{/if}
						{#if booking.status === 'checked_in'}
							<button class="btn btn-primary" on:click={handleCheckOut}>签出结算</button>
						{/if}
						<button class="btn btn-warning" on:click={() => showExceptionForm = true}>
							记录异常
						</button>
					</div>
				</div>

				<div class="border-b border-gray-200">
					<nav class="flex gap-8 px-6">
						{#each [
							{ id: 'overview', label: '概览' },
							{ id: 'exceptions', label: '异常处理' },
							{ id: 'wallet', label: '储值记录' },
							{ id: 'equipment', label: '器材借还' },
							{ id: 'audit', label: '操作留痕' }
						] as const}
							<button
								class="py-3 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id
									? 'border-green-600 text-green-600'
									: 'border-transparent text-gray-500 hover:text-gray-700'}"
								on:click={() => activeTab = tab.id}
							>
								{tab.label}
								{#if tab.id === 'exceptions' && activeExceptions.length > 0}
									<span class="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
										{activeExceptions.length}
									</span>
								{/if}
							</button>
						{/each}
					</nav>
				</div>

				<div class="flex-1 overflow-y-auto p-6 scrollbar-thin">
					{#if activeTab === 'overview'}
						<div class="space-y-6">
							<div class="card p-4">
								<h3 class="font-semibold text-gray-900 mb-4">预约信息</h3>
								<div class="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span class="text-gray-500">会员等级</span>
										<p class="font-medium">{booking.member?.level || '-'}</p>
									</div>
									<div>
										<span class="text-gray-500">累计消费</span>
										<p class="font-medium">¥{formatAmount(booking.member?.totalSpent || 0)}</p>
									</div>
									<div>
										<span class="text-gray-500">到店次数</span>
										<p class="font-medium">{booking.member?.totalVisits || 0} 次</p>
									</div>
									<div>
										<span class="text-gray-500">储值余额</span>
										<p class="font-medium text-green-600">¥{formatAmount(booking.member?.wallet?.balance || 0)}</p>
									</div>
									<div>
										<span class="text-gray-500">来访人数</span>
										<p class="font-medium">{booking.guestCount} 人</p>
									</div>
									<div>
										<span class="text-gray-500">含教学</span>
										<p class="font-medium">{booking.includeCoaching ? '是' : '否'}</p>
									</div>
									<div>
										<span class="text-gray-500">签到时间</span>
										<p class="font-medium">{booking.checkInTime ? formatTime(booking.checkInTime) : '-'}</p>
									</div>
									<div>
										<span class="text-gray-500">签出时间</span>
										<p class="font-medium">{booking.checkOutTime ? formatTime(booking.checkOutTime) : '-'}</p>
									</div>
								</div>
								{#if booking.remark}
									<div class="mt-4 pt-4 border-t border-gray-100">
										<span class="text-gray-500 text-sm">备注</span>
										<p class="font-medium mt-1">{booking.remark}</p>
									</div>
								{/if}
							</div>

							{#if activeExceptions.length > 0}
								<div class="card border-orange-200 p-4 bg-orange-50">
									<h3 class="font-semibold text-orange-900 mb-4">待处理异常</h3>
									<div class="space-y-3">
										{#each activeExceptions as ex}
											<div class="bg-white rounded-lg p-4 border border-orange-100">
												<div class="flex items-start justify-between mb-2">
													<div class="flex items-center gap-2">
														<span class="badge {EXCEPTION_SEVERITY_COLORS[ex.severity]}">
															{EXCEPTION_SEVERITY_LABELS[ex.severity]}
														</span>
														<span class="badge {EXCEPTION_STATUS_COLORS[ex.status]}">
															{EXCEPTION_STATUS_LABELS[ex.status]}
														</span>
														<span class="text-sm text-gray-500">{EXCEPTION_TYPE_LABELS[ex.type]}</span>
													</div>
													<span class="text-xs text-gray-400">{fromNow(ex.createdAt)}</span>
												</div>
												<h4 class="font-medium text-gray-900">{ex.title}</h4>
												<p class="text-sm text-gray-600 mt-1">{ex.description}</p>
												<p class="text-xs text-gray-400 mt-2">上报人: {ex.reportedByName}</p>

												{#if ex.followUps && ex.followUps.length > 0}
													<div class="mt-3 pt-3 border-t border-gray-100">
														<p class="text-xs text-gray-500 mb-2">跟进记录</p>
														<div class="space-y-2">
															{#each ex.followUps as fu}
																<div class="text-sm">
																	<span class="text-gray-900 font-medium">{fu.operatorName}:</span>
																	<span class="text-gray-600 ml-1">{fu.note}</span>
																	<span class="text-gray-400 text-xs ml-2">{formatTime(fu.createdAt)}</span>
																</div>
															{/each}
														</div>
													</div>
												{/if}

												<div class="mt-3 flex gap-2">
													<button
														class="btn btn-secondary text-sm"
														on:click={() => {
															showResolveForm = true;
															activeTab = 'exceptions';
														}}
													>
														处理
													</button>
													<div class="flex-1 flex gap-2">
														<input
															type="text"
															class="input text-sm"
															placeholder="添加跟进记录..."
															bind:value={followUpNote}
															on:keydown={(e) => {
																if (e.key === 'Enter') handleAddFollowUp(ex.id);
															}}
														/>
														<button
															class="btn btn-outline text-sm"
															on:click={() => handleAddFollowUp(ex.id)}
														>
															发送
														</button>
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>

					{:else if activeTab === 'exceptions'}
						<div class="space-y-6">
							{#if showExceptionForm}
								<div class="card p-4 border-green-200">
									<h3 class="font-semibold text-gray-900 mb-4">记录新异常</h3>
									<div class="space-y-4">
										<div class="grid grid-cols-2 gap-4">
											<div>
												<label class="label">异常类型</label>
												<select class="select" bind:value={newExceptionForm.type}>
													{#each Object.entries(EXCEPTION_TYPE_LABELS) as [value, label]}
														<option value={value}>{label}</option>
													{/each}
												</select>
											</div>
											<div>
												<label class="label">严重程度</label>
												<select class="select" bind:value={newExceptionForm.severity}>
													{#each Object.entries(EXCEPTION_SEVERITY_LABELS) as [value, label]}
														<option value={value}>{label}</option>
													{/each}
												</select>
											</div>
										</div>
										<div>
											<label class="label">标题</label>
											<input
												type="text"
												class="input"
												placeholder="简要描述问题"
												bind:value={newExceptionForm.title}
											/>
										</div>
										<div>
											<label class="label">详细描述</label>
											<textarea
												class="input min-h-24"
												placeholder="详细描述异常情况..."
												bind:value={newExceptionForm.description}
											></textarea>
										</div>
										<div class="flex gap-2 justify-end">
											<button class="btn btn-secondary" on:click={() => showExceptionForm = false}>
												取消
											</button>
											<button class="btn btn-primary" on:click={handleCreateException}>
												提交
											</button>
										</div>
									</div>
								</div>
							{/if}

							{#if showResolveForm}
								<div class="card p-4 border-blue-200">
									<h3 class="font-semibold text-gray-900 mb-4">处理异常</h3>
									<div class="space-y-4">
										<div>
											<label class="label">处理结果</label>
											<textarea
												class="input min-h-24"
												placeholder="描述处理方案和结果..."
												bind:value={resolveForm.resolution}
											></textarea>
										</div>
										<div class="grid grid-cols-2 gap-4">
											<div>
												<label class="label">退款金额 (¥)</label>
												<input
													type="number"
													class="input"
													min="0"
													step="0.01"
													bind:value={resolveForm.refundAmount}
												/>
											</div>
											<div>
												<label class="label">违约金 (¥)</label>
												<input
													type="number"
													class="input"
													min="0"
													step="0.01"
													bind:value={resolveForm.penaltyAmount}
												/>
											</div>
										</div>
										<div>
											<label class="label">状态</label>
											<select class="select" bind:value={resolveForm.status}>
												<option value="resolved">已解决</option>
												<option value="closed">已关闭</option>
											</select>
										</div>
										<div class="flex gap-2 justify-end">
											<button class="btn btn-secondary" on:click={() => showResolveForm = false}>
												取消
											</button>
											<button
												class="btn btn-primary"
												on:click={() => {
													if (activeExceptions.length > 0) {
														handleResolveException(activeExceptions[0]);
													}
												}}
											>
												确认处理
											</button>
										</div>
									</div>
								</div>
							{/if}

							{#if activeExceptions.length > 0}
								<div>
									<h3 class="font-semibold text-gray-900 mb-4">处理中 ({activeExceptions.length})</h3>
									<div class="space-y-3">
										{#each activeExceptions as ex}
											<div class="card p-4">
												<div class="flex items-start justify-between mb-3">
													<div class="flex items-center gap-2">
														<span class="badge {EXCEPTION_SEVERITY_COLORS[ex.severity]}">
															{EXCEPTION_SEVERITY_LABELS[ex.severity]}
														</span>
														<span class="badge {EXCEPTION_STATUS_COLORS[ex.status]}">
															{EXCEPTION_STATUS_LABELS[ex.status]}
														</span>
													</div>
													<button
														class="btn btn-primary text-sm"
														on:click={() => {
															showResolveForm = true;
															resolveForm = {
																resolution: ex.resolution || '',
																refundAmount: ex.refundAmount || 0,
																penaltyAmount: ex.penaltyAmount || 0,
																status: 'resolved'
															};
														}}
													>
														处理
													</button>
												</div>
												<h4 class="font-medium text-gray-900">{ex.title}</h4>
												<p class="text-sm text-gray-600 mt-1">{ex.description}</p>
												<div class="mt-3 pt-3 border-t border-gray-100">
													<p class="text-xs text-gray-500 mb-2">处理时间线</p>
													<div class="space-y-4">
														<div class="timeline-item">
															<p class="text-sm font-medium text-gray-900">{ex.reportedByName} 上报</p>
															<p class="text-xs text-gray-500">{formatTime(ex.createdAt)}</p>
														</div>
														{#each ex.followUps || [] as fu}
															<div class="timeline-item">
																<p class="text-sm font-medium text-gray-900">{fu.operatorName}</p>
																<p class="text-sm text-gray-600">{fu.note}</p>
																<p class="text-xs text-gray-500">{formatTime(fu.createdAt)}</p>
															</div>
														{/each}
													</div>
													<div class="mt-4 flex gap-2">
														<input
															type="text"
															class="input text-sm"
															placeholder="添加跟进记录..."
															bind:value={followUpNote}
															on:keydown={(e) => {
																if (e.key === 'Enter') handleAddFollowUp(ex.id);
															}}
														/>
														<button
															class="btn btn-outline text-sm"
															on:click={() => handleAddFollowUp(ex.id)}
														>
															发送
														</button>
													</div>
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							{#if resolvedExceptions.length > 0}
								<div class="mt-8">
									<h3 class="font-semibold text-gray-900 mb-4">已处理 ({resolvedExceptions.length})</h3>
									<div class="space-y-3">
										{#each resolvedExceptions as ex}
											<details class="card p-4">
												<summary class="cursor-pointer flex items-center justify-between">
													<div class="flex items-center gap-2">
														<span class="badge {EXCEPTION_STATUS_COLORS[ex.status]}">
															{EXCEPTION_STATUS_LABELS[ex.status]}
														</span>
														<span class="font-medium">{ex.title}</span>
													</div>
													<span class="text-sm text-gray-500">
														{ex.resolvedAt ? formatTime(ex.resolvedAt) : ''}
													</span>
												</summary>
												<div class="mt-4 pt-4 border-t border-gray-100">
													<p class="text-sm text-gray-600 mb-3">{ex.description}</p>
													<div class="bg-green-50 rounded-lg p-4">
														<p class="text-sm font-medium text-green-900 mb-2">处理结果</p>
														<p class="text-sm text-green-800">{ex.resolution}</p>
														<div class="flex gap-4 mt-2 text-sm">
															{#if ex.refundAmount && ex.refundAmount > 0}
																<span class="text-green-600">退款: ¥{formatAmount(ex.refundAmount)}</span>
															{/if}
															{#if ex.penaltyAmount && ex.penaltyAmount > 0}
																<span class="text-red-600">违约金: ¥{formatAmount(ex.penaltyAmount)}</span>
															{/if}
														</div>
														<p class="text-xs text-green-600 mt-2">处理人: {ex.resolvedByName}</p>
													</div>
												</div>
											</details>
										{/each}
									</div>
								</div>
							{/if}

							{#if !booking.exceptions || booking.exceptions.length === 0}
								<div class="text-center py-12 text-gray-400">
									该预约暂无异常记录
								</div>
							{/if}
						</div>

					{:else if activeTab === 'wallet'}
						<div class="space-y-4">
							<div class="card p-4">
								<h3 class="font-semibold text-gray-900 mb-4">账户信息</h3>
								<div class="flex items-center justify-between">
									<div>
										<p class="text-sm text-gray-500">当前余额</p>
										<p class="text-2xl font-bold text-green-600">
											¥{formatAmount(booking.member?.wallet?.balance || 0)}
										</p>
									</div>
									<div class="text-right">
										<p class="text-sm text-gray-500">累计充值</p>
										<p class="text-xl font-medium text-gray-900">
											¥{formatAmount(booking.member?.wallet?.totalRecharged || 0)}
										</p>
									</div>
								</div>
							</div>

							<div class="card">
								<div class="p-4 border-b border-gray-100">
									<h3 class="font-semibold text-gray-900">交易记录</h3>
								</div>
								{#if booking.walletRecords && booking.walletRecords.length > 0}
									<div class="divide-y divide-gray-100">
										{#each booking.walletRecords as record}
											<div class="p-4">
												<div class="flex items-center justify-between">
													<div>
														<p class="font-medium text-gray-900">{record.type}</p>
														<p class="text-sm text-gray-500">{record.remark}</p>
														<p class="text-xs text-gray-400 mt-1">
															{formatTime(record.createdAt)} · {record.remark}
														</p>
													</div>
													<div class="text-right">
														<p class={`font-medium ${record.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
															{record.amount >= 0 ? '+' : ''}¥{formatAmount(record.amount)}
														</p>
														<p class="text-xs text-gray-400">余额: ¥{formatAmount(record.balanceAfter)}</p>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="p-8 text-center text-gray-400">
										暂无交易记录
									</div>
								{/if}
							</div>
						</div>

					{:else if activeTab === 'equipment'}
						<div class="space-y-4">
							<div class="card">
								<div class="p-4 border-b border-gray-100">
									<h3 class="font-semibold text-gray-900">器材租借记录</h3>
								</div>
								{#if booking.equipmentRentals && booking.equipmentRentals.length > 0}
									<div class="divide-y divide-gray-100">
										{#each booking.equipmentRentals as rental}
											<div class="p-4">
												<div class="flex items-start justify-between">
													<div class="flex-1">
														<div class="flex items-center gap-2">
															<p class="font-medium text-gray-900">{rental.equipmentName}</p>
															<span class="badge {rental.returnedAt ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
																{rental.returnedAt ? '已归还' : '使用中'}
															</span>
															{#if rental.damageReported}
																<span class="badge bg-red-100 text-red-700">有损坏</span>
															{/if}
														</div>
														<div class="text-sm text-gray-500 mt-2 space-y-1">
															<p>借出: {formatTime(rental.rentedAt)}</p>
															{#if rental.returnedAt}
																<p>归还: {formatTime(rental.returnedAt)}</p>
															{/if}
															<p>借出时状态: {rental.conditionOut}</p>
															{#if rental.conditionIn}
																<p>归还时状态: {rental.conditionIn}</p>
															{/if}
															{#if rental.damageNote}
																<p class="text-red-600">损坏说明: {rental.damageNote}</p>
															{/if}
														</div>
													</div>
													<div class="text-right">
														<p class="font-medium text-gray-900">¥{formatAmount(rental.fee)}</p>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<div class="p-8 text-center text-gray-400">
										暂无器材租借记录
									</div>
								{/if}
							</div>
						</div>

					{:else if activeTab === 'audit'}
						<div class="card">
							<div class="p-4 border-b border-gray-100">
								<h3 class="font-semibold text-gray-900">操作留痕</h3>
								<p class="text-sm text-gray-500 mt-1">所有操作均有记录，可追溯可追责</p>
							</div>
							{#if booking.auditLogs && booking.auditLogs.length > 0}
								<div class="divide-y divide-gray-100">
									{#each booking.auditLogs as log}
										<div class="p-4">
											<div class="flex items-start justify-between">
												<div>
													<div class="flex items-center gap-2">
														<span class="text-sm font-medium text-gray-900">{log.action}</span>
														<span class="text-xs text-gray-400">{log.entityType}</span>
													</div>
													{#if log.oldValue}
														<p class="text-sm text-gray-500 mt-1">
															<span class="text-gray-400">旧值:</span> {log.oldValue}
														</p>
													{/if}
													{#if log.newValue}
														<p class="text-sm text-gray-600">
															<span class="text-gray-400">新值:</span> {log.newValue}
														</p>
													{/if}
												</div>
												<div class="text-right">
													<p class="text-sm font-medium text-gray-900">{log.userName}</p>
													<p class="text-xs text-gray-400">{formatTime(log.createdAt)}</p>
													{#if log.ipAddress}
														<p class="text-xs text-gray-400">{log.ipAddress}</p>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<div class="p-8 text-center text-gray-400">
									暂无操作记录
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
