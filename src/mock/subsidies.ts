import type { Subsidy } from '@/types';

export const mockSubsidies: Subsidy[] = [
  {
    id: 'subsidy-B002',
    orderId: 'order-B002',
    riderName: '张伟',
    type: '等待补贴',
    reason: '商家出餐慢导致超时，补贴骑手等待时长',
    notes: '商家厨房设备故障，出餐延迟20分钟',
    amount: 15,
    status: 'pending',
    approvedBy: null,
    createdAt: '2026-05-28T13:10:00Z',
    approvedAt: null,
  },
  {
    id: 'subsidy-D005',
    orderId: 'order-D005',
    riderName: '李娜',
    type: '配送补贴',
    reason: '晚高峰路况拥堵，补贴骑手配送时长',
    notes: '主要道路交通事故导致拥堵',
    amount: 10,
    status: 'approved',
    approvedBy: '调度-陈刚',
    createdAt: '2026-05-26T15:15:00Z',
    approvedAt: '2026-05-26T15:20:00Z',
  },
  {
    id: 'subsidy-D006',
    orderId: 'order-D006',
    riderName: '王强',
    type: '不补贴',
    reason: '骑手已被考核扣款，不补贴。用户退款由商家承担。',
    notes: '骑手未按规定路线配送，责任在骑手',
    amount: 0,
    status: 'rejected',
    approvedBy: '调度-陈刚',
    createdAt: '2026-05-25T17:40:00Z',
    approvedAt: '2026-05-25T18:10:00Z',
  },
];

export function getSubsidyById(id: string): Subsidy | undefined {
  return mockSubsidies.find(s => s.id === id);
}

export function getSubsidiesByOrder(orderId: string): Subsidy[] {
  return mockSubsidies.filter(s => s.orderId === orderId);
}

export function getSubsidiesByStatus(status: Subsidy['status']): Subsidy[] {
  return mockSubsidies.filter(s => s.status === status);
}

export function getPendingSubsidies(): Subsidy[] {
  return mockSubsidies.filter(s => s.status === 'pending');
}

export function calculateSubsidyAmount(orderId: string, reason: string): number {
  const baseAmounts: Record<string, number> = {
    '商家出餐慢': 15,
    '路况拥堵': 10,
    '天气恶劣': 20,
    '用户地址难找': 8,
    '其他': 5,
  };

  for (const [key, amount] of Object.entries(baseAmounts)) {
    if (reason.includes(key)) {
      return amount;
    }
  }

  return 5;
}
