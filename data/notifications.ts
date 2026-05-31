import type { Notification } from '~/types'

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'warning',
    title: '巡场记录待审核',
    message: '巡场记录 PAT-2024-0522-001 已提交，等待您的审核。',
    relatedId: 'patrol-002',
    relatedType: 'patrol',
    recipientRole: ['manager'],
    read: false,
    createdAt: '2024-05-22T08:45:00+08:00'
  },
  {
    id: 'notif-002',
    type: 'error',
    title: '紧急投诉待处理',
    message: '客户陈总（铂金会员）投诉3号发球台草坪问题，请优先处理。',
    relatedId: 'complaint-001',
    relatedType: 'complaint',
    recipientRole: ['manager', 'coach_supervisor'],
    read: true,
    createdAt: '2024-05-21T09:30:00+08:00'
  },
  {
    id: 'notif-003',
    type: 'warning',
    title: '巡场记录被驳回',
    message: '您提交的巡场记录 PAT-2024-0522-001 已被张经理驳回，请补充沙坑问题详情。',
    relatedId: 'patrol-002',
    relatedType: 'patrol',
    recipientRole: ['coach_supervisor'],
    read: false,
    createdAt: '2024-05-22T09:30:00+08:00'
  },
  {
    id: 'notif-004',
    type: 'warning',
    title: '新投诉待分配',
    message: '客户刘先生投诉C区沙坑维护问题，请分配处理人。',
    relatedId: 'complaint-002',
    relatedType: 'complaint',
    recipientRole: ['manager'],
    read: true,
    createdAt: '2024-05-22T10:00:00+08:00'
  },
  {
    id: 'notif-005',
    type: 'info',
    title: '器材归还待验收',
    message: '预订 BK-2024-0522-001 的客户将于11:30离场，请准备器材归还验收。',
    relatedId: 'booking-002',
    relatedType: 'booking',
    recipientRole: ['reception'],
    read: false,
    createdAt: '2024-05-22T11:00:00+08:00'
  },
  {
    id: 'notif-006',
    type: 'warning',
    title: '器材超期未归还',
    message: '球车 EQ-005 应于今日17:00归还，请注意提醒客户。',
    relatedId: 'equipment-005',
    relatedType: 'equipment',
    recipientRole: ['reception', 'manager'],
    read: false,
    createdAt: '2024-05-23T16:00:00+08:00'
  },
  {
    id: 'notif-007',
    type: 'info',
    title: '储值账户大额消费提醒',
    message: '铂金会员陈总账户消费680元，当前余额42320元。',
    relatedId: 'prepaid-001',
    relatedType: 'prepaid',
    recipientRole: ['manager'],
    read: true,
    createdAt: '2024-05-20T14:05:00+08:00'
  },
  {
    id: 'notif-008',
    type: 'success',
    title: '投诉已解决',
    message: '投诉 CMP-2024-0521-001 已圆满解决，客户表示满意。',
    relatedId: 'complaint-001',
    relatedType: 'complaint',
    recipientRole: ['manager', 'coach_supervisor', 'reception'],
    read: true,
    createdAt: '2024-05-21T16:30:00+08:00'
  },
  {
    id: 'notif-009',
    type: 'warning',
    title: '器材待维修',
    message: '套杆 EQ-003 因7号铁杆头松动送修，请跟进维修进度。',
    relatedId: 'equipment-003',
    relatedType: 'equipment',
    recipientRole: ['manager', 'coach_supervisor'],
    read: false,
    createdAt: '2024-05-22T11:20:00+08:00'
  },
  {
    id: 'notif-010',
    type: 'info',
    title: '明日预约提醒',
    message: '明日共有3个预约，其中郑总（铂金会员）的果岭预约请提前准备。',
    relatedId: 'booking-004',
    relatedType: 'booking',
    recipientRole: ['reception', 'manager'],
    read: false,
    createdAt: '2024-05-23T18:00:00+08:00'
  },
  {
    id: 'notif-011',
    type: 'error',
    title: '投诉超期预警',
    message: '投诉 CMP-2024-0520-001 已超过预计处理时间，请尽快处理。',
    relatedId: 'complaint-004',
    relatedType: 'complaint',
    recipientRole: ['manager'],
    read: false,
    createdAt: '2024-05-23T09:00:00+08:00'
  },
  {
    id: 'notif-012',
    type: 'warning',
    title: '器材维护提醒',
    message: '球车 EQ-005 将于6月1日到期维护，请提前安排。',
    relatedId: 'equipment-005',
    relatedType: 'equipment',
    recipientRole: ['manager', 'coach_supervisor'],
    read: true,
    createdAt: '2024-05-20T10:00:00+08:00'
  }
]
