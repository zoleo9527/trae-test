import type { Complaint } from '~/types'

export const demoCustomerComplaints: Complaint[] = [
  {
    id: 'complaint-demo-001',
    complaintNo: 'CMP-DEMO-001',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    category: 'course_condition',
    priority: 'high',
    title: '3号发球台草坪维护不及时',
    description: '今天下午在3号发球台练球，发现草坪有大面积斑秃，而且草的长度明显不均匀。作为铂金会员，我对球场的维护质量感到非常失望。上周六来的时候就发现这个问题了，没想到一周过去了还是没有处理。希望能够尽快安排修复，并且给我一个合理的解释。',
    source: 'on_site',
    status: 'completed',
    handlerId: 'user-002',
    handlerName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    relatedPatrolId: 'patrol-demo-001',
    relatedBookingId: 'booking-demo-003',
    expectedResolveDate: '2024-05-21',
    actualResolveDate: '2024-05-21',
    timeline: [
      {
        id: 'tl-demo-001',
        action: 'created',
        description: '客户现场投诉，情绪较为激动，表示上周就已发现问题但未得到解决。前台王小姐耐心接待并详细记录了客户反馈。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-20T17:15:00+08:00'
      },
      {
        id: 'tl-demo-002',
        action: 'assigned',
        description: '张经理审阅投诉记录后，分配给李教练处理。强调客户是铂金会员，需优先处理并亲自回电道歉。同时安排立即检查3号发球台情况。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-20T17:30:00+08:00'
      },
      {
        id: 'tl-demo-003',
        action: 'investigating',
        description: '李教练现场核实情况：确认3号发球台确实存在草坪问题，查阅历史记录发现因连续降雨推迟了原定于5月18日的维护计划。已联系场务部紧急处理。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-20T17:45:00+08:00'
      },
      {
        id: 'tl-demo-004',
        action: 'resolving',
        description: '李教练与客户电话沟通20分钟，诚恳道歉并说明情况。提出解决方案：1）24小时内完成草坪修复；2）赠送一次价值800元的1对1教练课程；3）下次来场免费升级VIP打位并赠送3盒练习球。客户表示接受。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-20T18:10:00+08:00'
      },
      {
        id: 'tl-demo-005',
        action: 'follow_up',
        description: '场务部反馈3号发球台草坪已完成修补和养护。前台已为客户预约5月25日周六下午2点的教练课程，并在系统中备注客户下次来场的VIP升级和赠球安排。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-21T09:30:00+08:00'
      },
      {
        id: 'tl-demo-006',
        action: 'resolved',
        description: '客户次日来场时，张经理亲自陪同查看了修复后的草坪，客户表示满意。赠送的练习球已交付。问题已闭环，客户关系维护良好。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-21T16:00:00+08:00'
      }
    ],
    createdAt: '2024-05-20T17:15:00+08:00',
    updatedAt: '2024-05-21T16:00:00+08:00'
  },
  {
    id: 'complaint-demo-002',
    complaintNo: 'CMP-DEMO-002',
    customerId: 'cust-demo-001',
    customerName: '演示客户-李总',
    customerPhone: '13888888888',
    category: 'equipment',
    priority: 'medium',
    title: '租借的测距仪电池不足',
    description: '5月28日租借的测距仪，使用过程中发现电量不足，影响了正常使用。希望球场能够在出租前检查好器材状态。',
    source: 'phone',
    status: 'processing',
    handlerId: 'user-002',
    handlerName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    relatedPatrolId: undefined,
    relatedBookingId: 'booking-demo-006',
    expectedResolveDate: '2024-05-29',
    actualResolveDate: undefined,
    timeline: [
      {
        id: 'tl-demo-007',
        action: 'created',
        description: '客户电话投诉，反映租借的测距仪电池不足。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-28T16:30:00+08:00'
      },
      {
        id: 'tl-demo-008',
        action: 'assigned',
        description: '张经理分配给李教练处理，要求加强器材出库前的检查。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-28T16:45:00+08:00'
      }
    ],
    createdAt: '2024-05-28T16:30:00+08:00',
    updatedAt: '2024-05-28T16:45:00+08:00'
  }
]
