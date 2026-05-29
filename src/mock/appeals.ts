import type { Appeal } from '@/types';

export const mockAppeals: Appeal[] = [
  {
    id: 'appeal-A001',
    orderId: 'order-A001',
    userId: 'u-001',
    userName: '陈女士',
    type: 'timeout',
    reason: '配送超时12分钟',
    description: '用户反馈订单承诺19:00送达，实际19:12才送到，汉堡和薯条都凉了。用户要求道歉并退款30%。已联系用户致歉，用户不接受解释坚持投诉。',
    evidenceUrls: [
      'https://example.com/screenshot-A001-1.png',
      'https://example.com/screenshot-A001-2.png',
    ],
    images: [
      'https://example.com/screenshot-A001-1.png',
      'https://example.com/screenshot-A001-2.png',
    ],
    status: 'pending',
    handlerRole: null,
    handlerName: null,
    createdAt: '2026-05-28T19:15:00Z',
    resolvedAt: null,
    resolution: null,
    responsibleParty: null,
  },
  {
    id: 'appeal-B002',
    orderId: 'order-B002',
    userId: 'u-002',
    userName: '王先生',
    type: 'timeout',
    reason: '商家出餐慢导致超时',
    description: '商家因午高峰出餐慢，用户12:15下单，商家12:38才出餐，骑手12:42取餐，12:58送达，超时13分钟。用户投诉称等太久火锅都凉了。',
    evidenceUrls: [
      'https://example.com/screenshot-B002-1.png',
    ],
    images: [
      'https://example.com/screenshot-B002-1.png',
    ],
    status: 'pending',
    handlerRole: null,
    handlerName: null,
    createdAt: '2026-05-28T13:01:00Z',
    resolvedAt: null,
    resolution: null,
    responsibleParty: null,
  },
  {
    id: 'appeal-C003',
    orderId: 'order-C003',
    userId: 'u-003',
    userName: '刘先生',
    type: 'refund',
    reason: '餐品错送且结算金额有误',
    description: '用户反映：1. 点的是超级至尊披萨，收到的却是夏威夷披萨；2. 订单显示实付156元，但短信通知扣了176元，多扣20元。用户要求全额退款并赔偿。已转商家核实餐品问题，转财务核实结算问题。',
    evidenceUrls: [
      'https://example.com/screenshot-C003-1.png',
      'https://example.com/screenshot-C003-2.png',
      'https://example.com/screenshot-C003-3.png',
    ],
    images: [
      'https://example.com/screenshot-C003-1.png',
      'https://example.com/screenshot-C003-2.png',
      'https://example.com/screenshot-C003-3.png',
    ],
    status: 'processing',
    handlerRole: 'customer_service',
    handlerName: '客服-周婷',
    createdAt: '2026-05-27T20:05:00Z',
    resolvedAt: null,
    resolution: null,
    responsibleParty: null,
  },
  {
    id: 'appeal-D004',
    orderId: 'order-D004',
    userId: 'u-004',
    userName: '张女士',
    type: 'timeout',
    reason: '早高峰配送超时',
    description: '用户8:10下单，承诺8:40送达，实际8:55才送到，超时15分钟。用户赶时间上课，餐品已凉。已联系用户致歉，用户表示理解但仍按规则提交投诉。',
    evidenceUrls: [
      'https://example.com/screenshot-D004-1.png',
    ],
    images: [
      'https://example.com/screenshot-D004-1.png',
    ],
    status: 'pending',
    handlerRole: null,
    handlerName: null,
    createdAt: '2026-05-28T09:00:00Z',
    resolvedAt: null,
    resolution: null,
    responsibleParty: null,
  },
  {
    id: 'appeal-D006',
    orderId: 'order-D006',
    userId: 'u-006',
    userName: '王女士',
    type: 'rude',
    reason: '骑手态度差+配送撒漏',
    description: '用户反映骑手送错楼层，打电话态度不耐烦，而且奶茶撒漏了约1/4。用户要求重新配送或退款。已核实监控，骑手确实有撒漏痕迹。',
    evidenceUrls: [
      'https://example.com/screenshot-D006-1.png',
      'https://example.com/screenshot-D006-2.png',
    ],
    images: [
      'https://example.com/screenshot-D006-1.png',
      'https://example.com/screenshot-D006-2.png',
    ],
    status: 'resolved',
    handlerRole: 'customer_service',
    handlerName: '客服-周婷',
    createdAt: '2026-05-25T17:35:00Z',
    resolvedAt: '2026-05-25T18:20:00Z',
    resolution: '已为用户全额退款并赠送20元优惠券，骑手已被考核扣分。',
    responsibleParty: 'rider',
  },
];

export function getAppealById(id: string): Appeal | undefined {
  return mockAppeals.find(a => a.id === id);
}

export function getAppealsByOrder(orderId: string): Appeal[] {
  return mockAppeals.filter(a => a.orderId === orderId);
}

export function getAppealsByStatus(status: Appeal['status']): Appeal[] {
  return mockAppeals.filter(a => a.status === status);
}

export function getPendingAppeals(): Appeal[] {
  return mockAppeals.filter(a => a.status === 'pending' || a.status === 'processing');
}
