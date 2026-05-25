import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { ROLES, PERFORMANCE_STATUS, ORDER_STATUS, REHEARSAL_STATUS, TASK_TYPE, TASK_STATUS } from './models.js';

const hashPassword = (password) => bcrypt.hashSync(password, 10);

export const users = [
  {
    id: 'user-001',
    username: 'manager',
    password: hashPassword('manager123'),
    name: '王经理',
    role: ROLES.THEATER_MANAGER,
    email: 'wang@theater.com',
    phone: '13800000001'
  },
  {
    id: 'user-002',
    username: 'ticket',
    password: hashPassword('ticket123'),
    name: '李票务',
    role: ROLES.TICKET_SUPERVISOR,
    email: 'li@theater.com',
    phone: '13800000002'
  },
  {
    id: 'user-003',
    username: 'backend',
    password: hashPassword('backend123'),
    name: '张后台',
    role: ROLES.BACKEND_COORDINATOR,
    email: 'zhang@theater.com',
    phone: '13800000003'
  }
];

export let performances = [
  {
    id: 'perf-001',
    title: '天鹅湖',
    type: '芭蕾舞',
    venue: '主剧场',
    duration: 120,
    startTime: '2026-05-28T19:30:00',
    endTime: '2026-05-28T21:30:00',
    status: PERFORMANCE_STATUS.TICKETING,
    createdBy: 'user-001',
    createdAt: '2026-05-20T10:00:00',
    updatedAt: '2026-05-25T14:00:00',
    totalSeats: 800,
    soldSeats: 450,
    priceRange: { min: 180, max: 880 },
    remarks: '经典芭蕾舞剧，需要提前3天进行技术联排',
    chainId: 'chain-001',
    version: 2
  },
  {
    id: 'perf-002',
    title: '雷雨',
    type: '话剧',
    venue: '实验剧场',
    duration: 150,
    startTime: '2026-05-30T14:00:00',
    endTime: '2026-05-30T16:30:00',
    status: PERFORMANCE_STATUS.REHEARSING,
    createdBy: 'user-001',
    createdAt: '2026-05-18T09:00:00',
    updatedAt: '2026-05-25T10:00:00',
    totalSeats: 300,
    soldSeats: 280,
    priceRange: { min: 120, max: 380 },
    remarks: '曹禺经典话剧，本地剧团演出',
    chainId: 'chain-002',
    version: 1
  },
  {
    id: 'perf-003',
    title: '儿童音乐剧-绿野仙踪',
    type: '音乐剧',
    venue: '主剧场',
    duration: 90,
    startTime: '2026-06-01T10:00:00',
    endTime: '2026-06-01T11:30:00',
    status: PERFORMANCE_STATUS.SCHEDULED,
    createdBy: 'user-001',
    createdAt: '2026-05-22T15:00:00',
    updatedAt: '2026-05-24T16:00:00',
    totalSeats: 800,
    soldSeats: 600,
    priceRange: { min: 80, max: 280 },
    remarks: '六一儿童节特别场，有加场需求',
    chainId: 'chain-003',
    version: 1
  },
  {
    id: 'perf-004',
    title: '京剧折子戏专场',
    type: '戏曲',
    venue: '主剧场',
    duration: 180,
    startTime: '2026-06-05T19:00:00',
    endTime: '2026-06-05T22:00:00',
    status: PERFORMANCE_STATUS.DRAFT,
    createdBy: 'user-001',
    createdAt: '2026-05-25T08:00:00',
    updatedAt: '2026-05-25T08:30:00',
    totalSeats: 800,
    soldSeats: 0,
    priceRange: { min: 100, max: 580 },
    remarks: '待审批排期',
    chainId: 'chain-004',
    version: 1
  }
];

export let orders = [
  {
    id: 'order-001',
    performanceId: 'perf-001',
    chainId: 'chain-001',
    orderNo: 'TG20260528001',
    groupName: '市芭蕾舞团',
    contactPerson: '刘团长',
    contactPhone: '13900000101',
    ticketCount: 50,
    unitPrice: 480,
    totalAmount: 24000,
    paidAmount: 12000,
    status: ORDER_STATUS.PAID,
    seats: ['A区1-1排1-50座'],
    createdAt: '2026-05-22T11:00:00',
    updatedAt: '2026-05-24T15:00:00',
    createdBy: 'user-002',
    remarks: '团体购票，享受95折优惠',
    settlementStatus: 'pending'
  },
  {
    id: 'order-002',
    performanceId: 'perf-001',
    chainId: 'chain-001',
    orderNo: 'TG20260528002',
    groupName: '某企业工会',
    contactPerson: '赵主任',
    contactPhone: '13900000102',
    ticketCount: 100,
    unitPrice: 380,
    totalAmount: 38000,
    paidAmount: 38000,
    status: ORDER_STATUS.PAID,
    seats: ['B区2-5排1-20座'],
    createdAt: '2026-05-22T09:00:00',
    updatedAt: '2026-05-23T14:00:00',
    createdBy: 'user-002',
    remarks: '企业包场，需要开票',
    settlementStatus: 'pending'
  },
  {
    id: 'order-003',
    performanceId: 'perf-002',
    chainId: 'chain-002',
    orderNo: 'TG20260530001',
    groupName: '市话剧协会',
    contactPerson: '孙老师',
    contactPhone: '13900000201',
    ticketCount: 30,
    unitPrice: 280,
    totalAmount: 8400,
    paidAmount: 8400,
    status: ORDER_STATUS.CONFIRMED,
    seats: ['前排1-3排1-10座'],
    createdAt: '2026-05-20T14:00:00',
    updatedAt: '2026-05-23T10:00:00',
    createdBy: 'user-002',
    remarks: '',
    settlementStatus: 'pending'
  },
  {
    id: 'order-004',
    performanceId: 'perf-003',
    chainId: 'chain-003',
    orderNo: 'TG20260601001',
    groupName: '阳光小学',
    contactPerson: '周老师',
    contactPhone: '13900000301',
    ticketCount: 200,
    unitPrice: 120,
    totalAmount: 24000,
    paidAmount: 0,
    status: ORDER_STATUS.PENDING,
    seats: ['中区1-10排'],
    createdAt: '2026-05-25T11:00:00',
    updatedAt: '2026-05-25T11:00:00',
    createdBy: 'user-002',
    remarks: '学校组织观演，需要协调加场',
    settlementStatus: 'pending'
  }
];

export let rehearsals = [
  {
    id: 'rehearsal-001',
    performanceId: 'perf-001',
    chainId: 'chain-001',
    title: '天鹅湖-技术联排',
    type: 'technical',
    venue: '主剧场',
    startTime: '2026-05-25T14:00:00',
    endTime: '2026-05-25T18:00:00',
    status: REHEARSAL_STATUS.IN_PROGRESS,
    coordinator: 'user-003',
    participants: ['灯光组', '音响组', '舞美组', '演员队'],
    equipment: ['追光灯4台', '烟雾机2台', '音响系统全套'],
    createdAt: '2026-05-24T10:00:00',
    updatedAt: '2026-05-25T14:30:00',
    remarks: '灯光效果需要调整，演员迟到问题需关注',
    issuesReported: [
      { id: 'issue-001', content: '左侧追光灯角度偏移', status: 'resolved', reportedAt: '2026-05-25T14:15:00' },
      { id: 'issue-002', content: '音响有杂音', status: 'pending', reportedAt: '2026-05-25T14:45:00' }
    ]
  },
  {
    id: 'rehearsal-002',
    performanceId: 'perf-002',
    chainId: 'chain-002',
    title: '雷雨-带妆彩排',
    type: 'full',
    venue: '实验剧场',
    startTime: '2026-05-26T09:00:00',
    endTime: '2026-05-26T12:00:00',
    status: REHEARSAL_STATUS.SCHEDULED,
    coordinator: 'user-003',
    participants: ['全体演员', '道具组', '服装组'],
    equipment: ['话剧全套道具', '服装箱'],
    createdAt: '2026-05-23T15:00:00',
    updatedAt: '2026-05-25T08:00:00',
    remarks: '需要确认道具是否全部到位',
    issuesReported: []
  },
  {
    id: 'rehearsal-003',
    performanceId: 'perf-002',
    chainId: 'chain-002',
    title: '雷雨-走台',
    type: 'walkthrough',
    venue: '实验剧场',
    startTime: '2026-05-25T10:00:00',
    endTime: '2026-05-25T12:00:00',
    status: REHEARSAL_STATUS.COMPLETED,
    coordinator: 'user-003',
    participants: ['导演', '主要演员'],
    equipment: [],
    createdAt: '2026-05-22T09:00:00',
    updatedAt: '2026-05-25T12:15:00',
    remarks: '完成，第二幕需要调整节奏',
    issuesReported: [
      { id: 'issue-003', content: '第二幕换场时间太长', status: 'resolved', reportedAt: '2026-05-25T11:00:00', resolvedAt: '2026-05-25T11:45:00' }
    ]
  }
];

export let tasks = [
  {
    id: 'task-001',
    chainId: 'chain-001',
    performanceId: 'perf-001',
    type: TASK_TYPE.REFUND_REQUEST,
    title: '某企业工会退票申请',
    description: '由于企业活动调整，申请退回订单TG20260528002中的50张票',
    orderId: 'order-002',
    status: TASK_STATUS.PENDING,
    priority: 'high',
    assigneeRole: ROLES.TICKET_SUPERVISOR,
    assignee: null,
    createdBy: 'user-002',
    createdAt: '2026-05-25T10:00:00',
    dueDate: '2026-05-26T18:00:00',
    history: [
      { action: 'created', userId: 'user-002', timestamp: '2026-05-25T10:00:00', remark: '提交退票申请' }
    ],
    refundAmount: 19000,
    refundReason: '企业活动调整'
  },
  {
    id: 'task-002',
    chainId: 'chain-002',
    performanceId: 'perf-002',
    type: TASK_TYPE.REHEARSAL_ARRANGEMENT,
    title: '雷雨彩排场地冲突协调',
    description: '原定26日彩排场地与另一活动冲突，需要协调时间',
    rehearsalId: 'rehearsal-002',
    status: TASK_STATUS.IN_PROGRESS,
    priority: 'urgent',
    assigneeRole: ROLES.BACKEND_COORDINATOR,
    assignee: 'user-003',
    createdBy: 'user-003',
    createdAt: '2026-05-25T08:30:00',
    dueDate: '2026-05-25T18:00:00',
    history: [
      { action: 'created', userId: 'user-003', timestamp: '2026-05-25T08:30:00', remark: '发现场地冲突' },
      { action: 'assigned', userId: 'user-003', timestamp: '2026-05-25T09:00:00', remark: '自行处理' }
    ]
  },
  {
    id: 'task-003',
    chainId: 'chain-003',
    performanceId: 'perf-003',
    type: TASK_TYPE.SCHEDULE_CHANGE,
    title: '绿野仙踪申请加场',
    description: '由于售票情况良好，学校团体需求大，申请在6月1日下午加演一场',
    status: TASK_STATUS.PENDING,
    priority: 'high',
    assigneeRole: ROLES.THEATER_MANAGER,
    assignee: null,
    createdBy: 'user-002',
    createdAt: '2026-05-25T11:30:00',
    dueDate: '2026-05-27T18:00:00',
    history: [
      { action: 'created', userId: 'user-002', timestamp: '2026-05-25T11:30:00', remark: '票务申请加场' }
    ],
    proposedSchedule: {
      date: '2026-06-01',
      time: '15:00-16:30',
      venue: '主剧场'
    }
  },
  {
    id: 'task-004',
    chainId: 'chain-004',
    performanceId: 'perf-004',
    type: TASK_TYPE.SCHEDULE_APPROVAL,
    title: '京剧折子戏专场排期审批',
    description: '新提交的京剧专场排期需要经理审批',
    status: TASK_STATUS.PENDING,
    priority: 'medium',
    assigneeRole: ROLES.THEATER_MANAGER,
    assignee: null,
    createdBy: 'user-001',
    createdAt: '2026-05-25T08:30:00',
    dueDate: '2026-05-28T18:00:00',
    history: [
      { action: 'created', userId: 'user-001', timestamp: '2026-05-25T08:30:00', remark: '提交排期审批' }
    ]
  },
  {
    id: 'task-005',
    chainId: 'chain-001',
    performanceId: 'perf-001',
    type: TASK_TYPE.SETTLEMENT,
    title: '天鹅湖费用结算',
    description: '市芭蕾舞团团单费用结算',
    orderId: 'order-001',
    status: TASK_STATUS.IN_PROGRESS,
    priority: 'medium',
    assigneeRole: ROLES.TICKET_SUPERVISOR,
    assignee: 'user-002',
    createdBy: 'user-002',
    createdAt: '2026-05-25T09:00:00',
    dueDate: '2026-05-30T18:00:00',
    history: [
      { action: 'created', userId: 'user-002', timestamp: '2026-05-25T09:00:00', remark: '启动结算流程' }
    ],
    settlementAmount: 22800
  },
  {
    id: 'task-006',
    chainId: 'chain-002',
    performanceId: 'perf-002',
    type: TASK_TYPE.REFUND_REQUEST,
    title: '市话剧协会部分退票申请',
    description: '部分演员无法出席，申请退回10张票',
    orderId: 'order-003',
    status: TASK_STATUS.REJECTED,
    priority: 'medium',
    assigneeRole: ROLES.TICKET_SUPERVISOR,
    assignee: 'user-002',
    createdBy: 'user-002',
    createdAt: '2026-05-23T10:00:00',
    dueDate: '2026-05-24T18:00:00',
    history: [
      { action: 'created', userId: 'user-002', timestamp: '2026-05-23T10:00:00', remark: '提交退票申请' },
      { action: 'status_rejected', userId: 'user-002', timestamp: '2026-05-23T16:00:00', remark: '临近演出，不支持退票，建议转让' }
    ],
    refundAmount: 2800,
    refundReason: '部分演员无法出席'
  },
  {
    id: 'task-007',
    chainId: 'chain-001',
    performanceId: 'perf-001',
    type: TASK_TYPE.REHEARSAL_ARRANGEMENT,
    title: '天鹅湖彩排时间确认',
    description: '需要确认最终彩排时间安排',
    rehearsalId: 'rehearsal-001',
    status: TASK_STATUS.PENDING,
    priority: 'high',
    assigneeRole: ROLES.BACKEND_COORDINATOR,
    assignee: null,
    createdBy: 'user-001',
    createdAt: '2026-05-20T09:00:00',
    dueDate: '2026-05-22T18:00:00',
    history: [
      { action: 'created', userId: 'user-001', timestamp: '2026-05-20T09:00:00', remark: '经理安排任务' }
    ]
  }
];

export let notifications = [
  {
    id: 'notif-001',
    userId: 'user-002',
    type: 'task_assigned',
    title: '新退票申请待处理',
    content: '订单TG20260528002有退票申请需要处理',
    read: false,
    createdAt: '2026-05-25T10:05:00',
    relatedId: 'task-001'
  },
  {
    id: 'notif-002',
    userId: 'user-003',
    type: 'urgent',
    title: '场地冲突需要紧急处理',
    content: '雷雨彩排与其他活动场地冲突',
    read: false,
    createdAt: '2026-05-25T08:35:00',
    relatedId: 'task-002'
  },
  {
    id: 'notif-003',
    userId: 'user-001',
    type: 'approval',
    title: '加场申请待审批',
    content: '绿野仙踪申请在6月1日加演一场',
    read: false,
    createdAt: '2026-05-25T11:35:00',
    relatedId: 'task-003'
  },
  {
    id: 'notif-004',
    userId: 'user-001',
    type: 'approval',
    title: '新排期待审批',
    content: '京剧折子戏专场排期需要审批',
    read: false,
    createdAt: '2026-05-25T08:40:00',
    relatedId: 'task-004'
  },
  {
    id: 'notif-005',
    userId: 'user-003',
    type: 'issue',
    title: '联排现场发现问题',
    content: '天鹅湖技术联排发现音响有杂音',
    read: false,
    createdAt: '2026-05-25T14:50:00',
    relatedId: 'rehearsal-001'
  }
];

export const db = {
  users,
  performances,
  orders,
  rehearsals,
  tasks,
  notifications
};
