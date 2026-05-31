import type { Customer } from '~/types'

export const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: '陈总',
    phone: '13900139001',
    memberLevel: 'platinum',
    joinDate: '2023-01-15',
    totalSpent: 158600
  },
  {
    id: 'cust-002',
    name: '刘先生',
    phone: '13900139002',
    memberLevel: 'gold',
    joinDate: '2023-03-20',
    totalSpent: 68500
  },
  {
    id: 'cust-003',
    name: '周女士',
    phone: '13900139003',
    memberLevel: 'gold',
    joinDate: '2023-05-10',
    totalSpent: 52300
  },
  {
    id: 'cust-004',
    name: '赵先生',
    phone: '13900139004',
    memberLevel: 'silver',
    joinDate: '2024-01-08',
    totalSpent: 18600
  },
  {
    id: 'cust-005',
    name: '孙女士',
    phone: '13900139005',
    memberLevel: 'silver',
    joinDate: '2024-02-15',
    totalSpent: 12400
  },
  {
    id: 'cust-006',
    name: '吴先生',
    phone: '13900139006',
    memberLevel: 'normal',
    joinDate: '2024-04-01',
    totalSpent: 3200
  },
  {
    id: 'cust-007',
    name: '郑总',
    phone: '13900139007',
    memberLevel: 'platinum',
    joinDate: '2022-11-20',
    totalSpent: 235000
  },
  {
    id: 'cust-008',
    name: '黄先生',
    phone: '13900139008',
    memberLevel: 'normal',
    joinDate: '2024-05-10',
    totalSpent: 1800
  }
]
