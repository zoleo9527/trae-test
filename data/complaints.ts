import type { Complaint } from '~/types'

export const mockComplaints: Complaint[] = [
  {
    id: 'complaint-001',
    complaintNo: 'CMP-2024-0521-001',
    customerId: 'cust-001',
    customerName: '陈总',
    customerPhone: '13900139001',
    category: 'service',
    priority: 'urgent',
    title: '3号发球台草坪问题影响打球',
    description: '今天上午在3号发球台打球时，发现草坪有大面积斑秃，严重影响击球体验。作为铂金会员，我对球场的维护质量感到失望。希望能尽快处理，并给我一个合理的解释。',
    source: 'on_site',
    status: 'completed',
    handlerId: 'user-002',
    handlerName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    relatedPatrolId: 'patrol-001',
    relatedBookingId: 'booking-001',
    expectedResolveDate: '2024-05-21',
    actualResolveDate: '2024-05-21',
    timeline: [
      {
        id: 'tl-001',
        action: 'created',
        description: '客户现场投诉，由前台王小姐登记。客户情绪激动，表示对球场维护不满。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-21T09:30:00+08:00'
      },
      {
        id: 'tl-002',
        action: 'assigned',
        description: '张经理分配给李教练处理，强调客户是铂金会员，需要优先处理并亲自回电道歉。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-21T10:00:00+08:00'
      },
      {
        id: 'tl-003',
        action: 'investigating',
        description: '李教练核实情况：查阅5月20日巡场记录PAT-2024-0520-001，确认3号发球台确实存在草坪问题，已安排昨日修复但因暴雨推迟。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-21T10:30:00+08:00'
      },
      {
        id: 'tl-004',
        action: 'resolving',
        description: '李教练与客户电话沟通15分钟，诚恳道歉并说明情况。提出解决方案：1）本周内完成草坪修复；2）赠送一次价值800元的1对1教练课程；3）下次来场免费升级VIP打位。客户表示接受。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-21T11:15:00+08:00'
      },
      {
        id: 'tl-005',
        action: 'follow_up',
        description: '前台已安排教练课程预约（5月25日周六下午2点），并在系统中备注客户下次来场的VIP升级。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-21T15:00:00+08:00'
      },
      {
        id: 'tl-006',
        action: 'resolved',
        description: '客户下午离店时再次确认解决方案，对处理结果表示满意。问题已闭环。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-21T16:30:00+08:00'
      }
    ],
    createdAt: '2024-05-21T09:30:00+08:00',
    updatedAt: '2024-05-21T16:30:00+08:00'
  },
  {
    id: 'complaint-002',
    complaintNo: 'CMP-2024-0522-001',
    customerId: 'cust-002',
    customerName: '刘先生',
    customerPhone: '13900139002',
    category: 'course_condition',
    priority: 'high',
    title: 'C区沙坑长时间未维护',
    description: '今天在C区沙坑击球时，发现沙坑里面有很多脚印和杂物，明显好几天没耙过了。沙质也很硬，根本没法正常练习。我是金卡会员，希望球场能重视基础维护工作。',
    source: 'phone',
    status: 'processing',
    handlerId: 'user-002',
    handlerName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    relatedPatrolId: 'patrol-002',
    relatedBookingId: 'booking-002',
    expectedResolveDate: '2024-05-23',
    timeline: [
      {
        id: 'tl-007',
        action: 'created',
        description: '客户电话投诉，反映C区沙坑维护问题。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-22T10:00:00+08:00'
      },
      {
        id: 'tl-008',
        action: 'assigned',
        description: '张经理注意到此投诉与今早巡场记录PAT-2024-0522-001中描述的沙坑问题一致，已驳回巡场记录要求补充详情。两案并处理。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-22T10:15:00+08:00'
      },
      {
        id: 'tl-009',
        action: 'investigating',
        description: '李教练现场检查C区沙坑，确认问题属实：1）沙坑约50平米区域有大量未耙平的脚印；2）沙质板结，需要翻松；3）有3处散落的烟头和纸屑。已拍照取证。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-22T10:45:00+08:00'
      },
      {
        id: 'tl-010',
        action: 'resolving',
        description: '已安排维护组立即处理C区沙坑，预计2小时内完成。同时要求巡场记录补充详细描述和照片后重新提交。',
        operatorId: 'user-002',
        operatorName: '李教练',
        operatorRole: 'coach_supervisor',
        createdAt: '2024-05-22T11:00:00+08:00'
      }
    ],
    createdAt: '2024-05-22T10:00:00+08:00',
    updatedAt: '2024-05-22T11:00:00+08:00'
  },
  {
    id: 'complaint-003',
    complaintNo: 'CMP-2024-0518-001',
    customerId: 'cust-005',
    customerName: '孙女士',
    customerPhone: '13900139005',
    category: 'equipment',
    priority: 'medium',
    title: '租借的球杆质量有问题',
    description: '昨天租借的7号铁杆，杆头有松动的情况，差点在挥杆时飞出去。幸好没伤到人，但确实吓到我了。建议你们定期检查租借器材的安全性。',
    source: 'wechat',
    status: 'completed',
    handlerId: 'user-003',
    handlerName: '王前台',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    relatedEquipmentId: 'equipment-003',
    expectedResolveDate: '2024-05-19',
    actualResolveDate: '2024-05-18',
    timeline: [
      {
        id: 'tl-011',
        action: 'created',
        description: '客户通过微信公众号投诉。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-18T16:20:00+08:00'
      },
      {
        id: 'tl-012',
        action: 'assigned',
        description: '张经理分配给前台处理，并要求检查所有租借器材。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-18T16:30:00+08:00'
      },
      {
        id: 'tl-013',
        action: 'resolving',
        description: '已检查球杆EQ-003，确认7号铁杆头确实有松动，已送去维修。已电话回复客户并致歉，赠送5盒练习球作为补偿。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-18T17:30:00+08:00'
      },
      {
        id: 'tl-014',
        action: 'resolved',
        description: '客户接受处理方案。已安排对所有租借球杆进行安全检查。',
        operatorId: 'user-001',
        operatorName: '张明远',
        operatorRole: 'manager',
        createdAt: '2024-05-18T18:00:00+08:00'
      }
    ],
    createdAt: '2024-05-18T16:20:00+08:00',
    updatedAt: '2024-05-18T18:00:00+08:00'
  },
  {
    id: 'complaint-004',
    complaintNo: 'CMP-2024-0520-001',
    customerId: 'cust-004',
    customerName: '赵先生',
    customerPhone: '13900139004',
    category: 'booking',
    priority: 'medium',
    title: '预约确认后被告知打位被占',
    description: '上周六通过电话预约了周日上午10点的打位，前台也确认了。结果周日到了之后说我的打位被安排给了别人，让我等了40分钟。管理太混乱了！',
    source: 'online',
    status: 'pending',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    timeline: [
      {
        id: 'tl-015',
        action: 'created',
        description: '客户通过官网提交投诉。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-20T14:00:00+08:00'
      }
    ],
    createdAt: '2024-05-20T14:00:00+08:00',
    updatedAt: '2024-05-20T14:00:00+08:00'
  },
  {
    id: 'complaint-005',
    complaintNo: 'CMP-2024-0523-001',
    customerId: 'cust-006',
    customerName: '吴先生',
    customerPhone: '13900139006',
    category: 'service',
    priority: 'low',
    title: '更衣室空调太冷',
    description: '更衣室空调温度太低了，建议调高一点，特别是最近天气变化大。',
    source: 'on_site',
    status: 'pending',
    timeline: [
      {
        id: 'tl-016',
        action: 'created',
        description: '客户现场反馈。',
        operatorId: 'user-003',
        operatorName: '王前台',
        operatorRole: 'reception',
        createdAt: '2024-05-23T08:00:00+08:00'
      }
    ],
    createdAt: '2024-05-23T08:00:00+08:00',
    updatedAt: '2024-05-23T08:00:00+08:00'
  }
]
