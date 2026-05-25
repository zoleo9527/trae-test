import type { TicketOrder } from '@/types'

export const mockTicketOrders: TicketOrder[] = [
  {
    id: '1',
    orderNo: 'TK20240520001',
    activityName: '宋代山水画卷专题展',
    ticketType: '成人票',
    totalCount: 500,
    verifiedCount: 312,
    exceptionCount: 8,
    verifyTime: '2024-05-20 09:00:00',
    operator: '票务专员-小李',
    status: 'verifying',
    items: [
      { id: 't1-1', ticketNo: 'TK20240520001-001', visitorName: '张三', visitorPhone: '138****1234', status: 'verified', verifyTime: '2024-05-20 09:15:00', operator: '小李' },
      { id: 't1-2', ticketNo: 'TK20240520001-002', visitorName: '李四', visitorPhone: '139****5678', status: 'verified', verifyTime: '2024-05-20 09:20:00', operator: '小李' },
      { id: 't1-3', ticketNo: 'TK20240520001-003', visitorName: '王五', visitorPhone: '137****9012', status: 'exception', verifyTime: '2024-05-20 09:30:00', operator: '小李' },
      { id: 't1-4', ticketNo: 'TK20240520001-004', visitorName: '赵六', visitorPhone: '136****3456', status: 'unused' },
      { id: 't1-5', ticketNo: 'TK20240520001-005', visitorName: '钱七', visitorPhone: '135****7890', status: 'unused' }
    ]
  },
  {
    id: '2',
    orderNo: 'TK20240520002',
    activityName: '明清瓷器精品展',
    ticketType: '亲子套票',
    totalCount: 200,
    verifiedCount: 200,
    exceptionCount: 0,
    verifyTime: '2024-05-20 10:00:00',
    operator: '票务专员-小王',
    status: 'completed',
    items: [
      { id: 't2-1', ticketNo: 'TK20240520002-001', visitorName: '陈小明', visitorPhone: '138****1111', status: 'verified', verifyTime: '2024-05-20 10:05:00', operator: '小王' },
      { id: 't2-2', ticketNo: 'TK20240520002-002', visitorName: '刘小红', visitorPhone: '139****2222', status: 'verified', verifyTime: '2024-05-20 10:10:00', operator: '小王' }
    ]
  },
  {
    id: '3',
    orderNo: 'TK20240520003',
    activityName: 'VIP会员专场活动',
    ticketType: '会员票',
    totalCount: 100,
    verifiedCount: 45,
    exceptionCount: 12,
    verifyTime: '2024-05-20 14:00:00',
    operator: '票务专员-小张',
    status: 'exception',
    items: [
      { id: 't3-1', ticketNo: 'TK20240520003-001', visitorName: '周会员', visitorPhone: '138****3333', status: 'verified', verifyTime: '2024-05-20 14:10:00', operator: '小张' },
      { id: 't3-2', ticketNo: 'TK20240520003-002', visitorName: '吴会员', visitorPhone: '139****4444', status: 'exception', verifyTime: '2024-05-20 14:15:00', operator: '小张' },
      { id: 't3-3', ticketNo: 'TK20240520003-003', visitorName: '郑会员', visitorPhone: '137****5555', status: 'unused' },
      { id: 't3-4', ticketNo: 'TK20240520003-004', visitorName: '王会员', visitorPhone: '136****6666', status: 'expired' }
    ]
  },
  {
    id: '4',
    orderNo: 'TK20240521001',
    activityName: '青铜器珍品展',
    ticketType: '学生票',
    totalCount: 300,
    verifiedCount: 0,
    exceptionCount: 0,
    verifyTime: '2024-05-21 09:00:00',
    operator: '票务专员-小李',
    status: 'pending',
    items: [
      { id: 't4-1', ticketNo: 'TK20240521001-001', visitorName: '学生A', visitorPhone: '138****7777', status: 'unused' },
      { id: 't4-2', ticketNo: 'TK20240521001-002', visitorName: '学生B', visitorPhone: '139****8888', status: 'unused' }
    ]
  },
  {
    id: '5',
    orderNo: 'TK20240521002',
    activityName: '周末艺术讲座',
    ticketType: '讲座票',
    totalCount: 80,
    verifiedCount: 15,
    exceptionCount: 3,
    verifyTime: '2024-05-21 14:00:00',
    operator: '票务专员-小王',
    status: 'verifying',
    items: [
      { id: 't5-1', ticketNo: 'TK20240521002-001', visitorName: '听众A', visitorPhone: '138****9999', status: 'verified', verifyTime: '2024-05-21 14:05:00', operator: '小王' },
      { id: 't5-2', ticketNo: 'TK20240521002-002', visitorName: '听众B', visitorPhone: '139****1010', status: 'exception', verifyTime: '2024-05-21 14:10:00', operator: '小王' }
    ]
  }
]
