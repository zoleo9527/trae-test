import type { Pickup } from '@/types'

export const mockPickups: Pickup[] = [
  {
    id: 'PU-001',
    orderId: 'ORD-001',
    status: 'completed',
    verifiedAt: '2026-05-29T10:05:00',
    verifiedBy: '小李',
  },
  {
    id: 'PU-002',
    orderId: 'ORD-002',
    status: 'completed',
    verifiedAt: '2026-05-30T14:10:00',
    verifiedBy: '小王',
  },
  {
    id: 'PU-003',
    orderId: 'ORD-007',
    status: 'completed',
    verifiedAt: '2026-05-30T16:08:00',
    verifiedBy: '小李',
  },
  {
    id: 'PU-004',
    orderId: 'ORD-011',
    status: 'completed',
    verifiedAt: '2026-05-29T17:30:00',
    verifiedBy: '小张',
  },
  {
    id: 'PU-005',
    orderId: 'ORD-013',
    status: 'completed',
    verifiedAt: '2026-05-31T10:12:00',
    verifiedBy: '小王',
  },
  {
    id: 'PU-006',
    orderId: 'ORD-009',
    status: 'waiting',
  },
  {
    id: 'PU-007',
    orderId: 'ORD-014',
    status: 'completed',
    verifiedAt: '2026-05-31T17:05:00',
    verifiedBy: '小李',
  },
  {
    id: 'PU-008',
    orderId: 'ORD-012',
    status: 'waiting',
  },
]
