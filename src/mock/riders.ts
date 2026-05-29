import type { Rider } from '@/types';

export const mockRiders: Rider[] = [
  {
    id: 'rider-001',
    name: '张伟',
    phone: '138****1234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei',
    region: '朝阳区',
    zone: '朝阳A区',
    joinDate: '2023-03-15T00:00:00Z',
    status: 'active',
    totalScore: 88,
    currentScore: 88,
    totalOrders: 2856,
    totalDeliveries: 2856,
    currentMonthScore: 8,
    trainingCount: {
      pending: 1,
      completed: 5,
      overdue: 0,
    },
  },
  {
    id: 'rider-002',
    name: '李明',
    phone: '139****5678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming',
    region: '海淀区',
    zone: '海淀B区',
    joinDate: '2022-08-20T00:00:00Z',
    status: 'active',
    totalScore: 76,
    currentScore: 76,
    totalOrders: 4123,
    totalDeliveries: 4123,
    currentMonthScore: 14,
    trainingCount: {
      pending: 2,
      completed: 8,
      overdue: 1,
    },
  },
  {
    id: 'rider-003',
    name: '王芳',
    phone: '137****9012',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangfang',
    region: '朝阳区',
    zone: '朝阳C区',
    joinDate: '2024-01-10T00:00:00Z',
    status: 'probation',
    totalScore: 95,
    currentScore: 95,
    totalOrders: 342,
    totalDeliveries: 342,
    currentMonthScore: 3,
    trainingCount: {
      pending: 0,
      completed: 2,
      overdue: 0,
    },
  },
  {
    id: 'rider-004',
    name: '赵强',
    phone: '136****3456',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoqiang',
    region: '西城区',
    zone: '西城A区',
    joinDate: '2023-06-05T00:00:00Z',
    status: 'active',
    totalScore: 92,
    currentScore: 92,
    totalOrders: 1876,
    totalDeliveries: 1876,
    currentMonthScore: 5,
    trainingCount: {
      pending: 0,
      completed: 4,
      overdue: 0,
    },
  },
  {
    id: 'rider-005',
    name: '刘洋',
    phone: '135****7890',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyang',
    region: '海淀区',
    zone: '海淀A区',
    joinDate: '2023-11-28T00:00:00Z',
    status: 'suspended',
    totalScore: 62,
    currentScore: 62,
    totalOrders: 892,
    totalDeliveries: 892,
    currentMonthScore: 18,
    trainingCount: {
      pending: 3,
      completed: 3,
      overdue: 2,
    },
  },
];

export function getRiderById(id: string): Rider | undefined {
  return mockRiders.find(r => r.id === id);
}

export function getRidersByRegion(region: string): Rider[] {
  return mockRiders.filter(r => r.region === region);
}
