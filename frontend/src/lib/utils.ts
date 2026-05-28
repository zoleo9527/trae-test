export function formatDate(dateStr: string): string {
	if (!dateStr) return '-';
	return new Date(dateStr).toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatDateShort(dateStr: string): string {
	if (!dateStr) return '-';
	return new Date(dateStr).toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function getRoleLabel(role: string): string {
	const map: Record<string, string> = {
		manager: '店长',
		planner: '企划专员',
		warehouse: '仓管'
	};
	return map[role] || role;
}

export function getProductStatusLabel(status: string): string {
	const map: Record<string, string> = {
		draft: '草稿',
		pending: '待审批',
		approved: '已通过',
		on_shelf: '已上架',
		off_shelf: '已下架',
		rejected: '已驳回',
		reviewing: '复盘中',
		reviewed: '已复盘'
	};
	return map[status] || status;
}

export function getProductStatusClass(status: string): string {
	const map: Record<string, string> = {
		draft: 'status-draft',
		pending: 'status-pending',
		approved: 'status-approved',
		on_shelf: 'status-on-shelf',
		off_shelf: 'status-off-shelf',
		rejected: 'status-rejected',
		reviewing: 'status-reviewing',
		reviewed: 'status-reviewed'
	};
	return map[status] || '';
}

export function getOrderTypeLabel(type: string): string {
	const map: Record<string, string> = {
		restock: '补货单',
		transfer: '调拨单',
		exchange: '会员兑换'
	};
	return map[type] || type;
}

export function getOrderStatusLabel(status: string): string {
	const map: Record<string, string> = {
		draft: '草稿',
		pending: '待审批',
		approved: '已批准',
		shipped: '已发货',
		received: '已签收',
		rejected: '已驳回',
		completed: '已完成'
	};
	return map[status] || status;
}

export function getOrderStatusClass(status: string): string {
	const map: Record<string, string> = {
		draft: 'status-draft',
		pending: 'status-pending',
		approved: 'status-approved',
		shipped: 'status-shipped',
		received: 'status-received',
		rejected: 'status-rejected',
		completed: 'status-completed'
	};
	return map[status] || '';
}

export function getInspectionStatusLabel(status: string): string {
	const map: Record<string, string> = {
		pending: '待检查',
		passed: '已通过',
		exception: '有异常',
		closed: '已关闭'
	};
	return map[status] || status;
}

export function getInspectionStatusClass(status: string): string {
	const map: Record<string, string> = {
		pending: 'status-pending',
		passed: 'status-passed',
		exception: 'status-exception',
		closed: 'status-closed'
	};
	return map[status] || '';
}

export function getExceptionTypeLabel(type: string): string {
	const map: Record<string, string> = {
		inventory: '库存异常',
		display: '陈列异常',
		timing: '时效异常',
		order: '订单异常',
		other: '其他异常'
	};
	return map[type] || type;
}

export function getExceptionStatusLabel(status: string): string {
	const map: Record<string, string> = {
		open: '待处理',
		handling: '处理中',
		resolved: '已解决',
		review: '已复核'
	};
	return map[status] || status;
}

export function getExceptionStatusClass(status: string): string {
	const map: Record<string, string> = {
		open: 'status-open',
		handling: 'status-handling',
		resolved: 'status-resolved',
		review: 'status-review'
	};
	return map[status] || '';
}

export function getSeverityLabel(severity: string): string {
	const map: Record<string, string> = {
		low: '低',
		medium: '中',
		high: '高'
	};
	return map[severity] || severity;
}

export function getSeverityClass(severity: string): string {
	const map: Record<string, string> = {
		low: 'severity-low',
		medium: 'severity-medium',
		high: 'severity-high'
	};
	return map[severity] || '';
}

export function formatCurrency(amount: number): string {
	return `¥${amount.toFixed(2)}`;
}

export function getErrorMessage(e: unknown): string {
	if (e instanceof Error) {
		return e.message;
	}
	if (typeof e === 'string') {
		return e;
	}
	return '未知错误';
}

export function isAuthError(e: unknown): boolean {
	const msg = getErrorMessage(e);
	return msg.includes('401') || msg.includes('未授权') || msg.includes('Unauthorized');
}
