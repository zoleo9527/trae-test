import type { Remark } from '~/types'

export const mockRemarks: Remark[] = [
  {
    id: 'remark-001',
    recordId: 'patrol-001',
    content: '巡场记录详细，3号发球台草坪问题需要尽快安排维护，周末客流量大。',
    authorId: 'user-001',
    authorName: '张明远',
    authorRole: 'manager',
    isInternal: true,
    createdAt: '2024-05-20T17:30:00+08:00'
  },
  {
    id: 'remark-002',
    recordId: 'patrol-001',
    content: '已联系草坪维护组，安排明天上午进行修复。',
    authorId: 'user-002',
    authorName: '李教练',
    authorRole: 'coach_supervisor',
    isInternal: true,
    createdAt: '2024-05-20T18:00:00+08:00'
  },
  {
    id: 'remark-003',
    recordId: 'complaint-001',
    content: '客户是白金卡会员，优先处理，需要亲自回电道歉。',
    authorId: 'user-001',
    authorName: '张明远',
    authorRole: 'manager',
    isInternal: true,
    createdAt: '2024-05-21T10:15:00+08:00'
  },
  {
    id: 'remark-004',
    recordId: 'complaint-001',
    content: '已与客户电话沟通，客户接受解决方案，情绪已平复。赠送一次免费教练课程作为补偿。',
    authorId: 'user-002',
    authorName: '李教练',
    authorRole: 'coach_supervisor',
    isInternal: true,
    createdAt: '2024-05-21T14:20:00+08:00'
  },
  {
    id: 'remark-005',
    recordId: 'complaint-001',
    content: '课程已安排在本周六下午2点，由李教练亲自授课。',
    authorId: 'user-003',
    authorName: '王前台',
    authorRole: 'reception',
    isInternal: false,
    createdAt: '2024-05-21T15:00:00+08:00'
  },
  {
    id: 'remark-006',
    recordId: 'booking-002',
    content: '客户要求延长30分钟，已确认下一时段无人预约，可以安排。',
    authorId: 'user-003',
    authorName: '王前台',
    authorRole: 'reception',
    isInternal: true,
    createdAt: '2024-05-21T09:30:00+08:00'
  },
  {
    id: 'remark-007',
    recordId: 'equipment-003',
    content: '归还检查发现球杆握把有磨损，需要安排更换。',
    authorId: 'user-003',
    authorName: '王前台',
    authorRole: 'reception',
    isInternal: true,
    createdAt: '2024-05-22T11:20:00+08:00'
  },
  {
    id: 'remark-008',
    recordId: 'complaint-002',
    content: '此投诉与昨天巡场发现的沙坑问题直接相关，需要同步处理进度。',
    authorId: 'user-001',
    authorName: '张明远',
    authorRole: 'manager',
    isInternal: true,
    createdAt: '2024-05-22T09:00:00+08:00'
  },
  {
    id: 'remark-009',
    recordId: 'patrol-002',
    content: '沙坑问题已影响到两批客户体验，请优先处理。',
    authorId: 'user-001',
    authorName: '张明远',
    authorRole: 'manager',
    isInternal: true,
    createdAt: '2024-05-22T09:15:00+08:00'
  },
  {
    id: 'remark-010',
    recordId: 'prepaid-001',
    content: '客户本次充值5万，升级为铂金会员，折扣率调整为85折。',
    authorId: 'user-001',
    authorName: '张明远',
    authorRole: 'manager',
    isInternal: true,
    createdAt: '2024-05-18T16:00:00+08:00'
  }
]
