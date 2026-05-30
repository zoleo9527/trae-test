import type { OrderStatus, ComplaintStatus, UserRole } from '@/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待分拣',
  sorted: '已分拣',
  washing: '洗涤中',
  quality_check: '质检中',
  rewash: '需返洗',
  ready: '待交付',
  delivered: '已交付',
  complaint: '客诉中',
  completed: '已完成'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  sorted: '#3b82f6',
  washing: '#8b5cf6',
  quality_check: '#06b6d4',
  rewash: '#ef4444',
  ready: '#10b981',
  delivered: '#6b7280',
  complaint: '#dc2626',
  completed: '#059669'
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: '待处理',
  investigating: '调查中',
  approved: '已通过',
  rejected: '已拒绝',
  resolved: '已解决'
};

export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  damage: '衣物损坏',
  stain: '污渍残留',
  lost: '衣物丢失',
  delay: '交付延迟',
  others: '其他问题'
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  factory_manager: '厂长',
  quality_inspector: '质检员',
  store_manager: '门店经理'
};

export const WASH_TYPE_LABELS: Record<string, string> = {
  dry: '干洗',
  water: '水洗',
  hand: '手洗'
};

export const CLOTHING_TYPE_LABELS: Record<string, string> = {
  shirt: '衬衫',
  pants: '裤子',
  coat: '外套',
  dress: '连衣裙',
  suit: '西装',
  others: '其他'
};

export const STORES = [
  { id: 'store-1', name: '朝阳门店' },
  { id: 'store-2', name: '海淀门店' },
  { id: 'store-3', name: '西城门店' }
];

export const USERS = [
  { id: 'user-1', name: '张厂长', role: 'factory_manager' as UserRole },
  { id: 'user-2', name: '李质检', role: 'quality_inspector' as UserRole },
  { id: 'user-3', name: '王店长', role: 'store_manager' as UserRole }
];
