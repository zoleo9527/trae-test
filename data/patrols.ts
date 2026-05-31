import type { PatrolRecord } from '~/types'

export const mockPatrols: PatrolRecord[] = [
  {
    id: 'patrol-001',
    patrolNo: 'PAT-2024-0520-001',
    date: '2024-05-20',
    startTime: '08:30',
    endTime: '11:45',
    location: '全场区',
    weather: '晴',
    temperature: 26,
    operatorId: 'user-002',
    operatorName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    status: 'approved',
    items: [
      {
        id: 'item-001',
        name: '1号发球台',
        category: 'tee',
        condition: 'good',
        description: '草坪状态良好，Tee mark摆放整齐'
      },
      {
        id: 'item-002',
        name: '3号发球台',
        category: 'tee',
        condition: 'poor',
        description: '草坪出现斑秃，约2平米区域草皮脱落，需要补植'
      },
      {
        id: 'item-003',
        name: '练习场打位区',
        category: 'fairway',
        condition: 'good',
        description: '草坪修剪整齐，无明显损伤'
      },
      {
        id: 'item-004',
        name: '果岭练习区',
        category: 'green',
        condition: 'excellent',
        description: '果岭速度均匀，约10.5，球洞位置合理'
      },
      {
        id: 'item-005',
        name: 'B区沙坑',
        category: 'bunker',
        condition: 'fair',
        description: '沙质良好，但部分区域有脚印未耙平'
      },
      {
        id: 'item-006',
        name: '淋浴设施',
        category: 'facility',
        condition: 'good',
        description: '热水供应正常，卫生状况良好'
      },
      {
        id: 'item-007',
        name: '急救箱',
        category: 'safety',
        condition: 'good',
        description: '药品齐全，在有效期内'
      }
    ],
    issues: [
      {
        id: 'issue-001',
        description: '3号发球台草坪斑秃，影响客户使用体验',
        severity: 'high',
        category: 'maintenance',
        status: 'in_progress',
        assigneeId: 'user-002',
        assigneeName: '李教练',
        relatedComplaintId: undefined
      },
      {
        id: 'issue-002',
        description: 'B区沙坑需要增加巡查频率，确保随时保持良好状态',
        severity: 'low',
        category: 'service',
        status: 'open',
        assigneeId: 'user-002',
        assigneeName: '李教练'
      }
    ],
    summary: '整体状况良好，3号发球台草坪问题需要优先处理。已联系维护组安排明天上午修复。',
    createdAt: '2024-05-20T08:30:00+08:00',
    updatedAt: '2024-05-20T17:00:00+08:00'
  },
  {
    id: 'patrol-002',
    patrolNo: 'PAT-2024-0522-001',
    date: '2024-05-22',
    startTime: '08:00',
    endTime: undefined,
    location: '练习场及果岭区',
    weather: '多云',
    temperature: 24,
    operatorId: 'user-002',
    operatorName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    status: 'rejected',
    items: [
      {
        id: 'item-008',
        name: '练习场打位',
        category: 'tee',
        condition: 'good',
        description: '状态正常'
      },
      {
        id: 'item-009',
        name: 'C区沙坑',
        category: 'bunker',
        condition: 'poor',
        description: '沙坑状况不好'
      },
      {
        id: 'item-010',
        name: '9号果岭',
        category: 'green',
        condition: 'good',
        description: '果岭状态良好'
      }
    ],
    issues: [
      {
        id: 'issue-003',
        description: 'C区沙坑有问题，需要处理',
        severity: 'medium',
        category: 'maintenance',
        status: 'open',
        relatedComplaintId: 'complaint-002'
      }
    ],
    summary: '沙坑问题需要关注',
    createdAt: '2024-05-22T08:00:00+08:00',
    updatedAt: '2024-05-22T09:30:00+08:00'
  },
  {
    id: 'patrol-003',
    patrolNo: 'PAT-2024-0521-001',
    date: '2024-05-21',
    startTime: '07:30',
    endTime: '10:15',
    location: '全场区',
    weather: '晴',
    temperature: 25,
    operatorId: 'user-002',
    operatorName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    status: 'approved',
    items: [
      {
        id: 'item-011',
        name: '会所大堂',
        category: 'facility',
        condition: 'excellent',
        description: '整洁有序，空调温度适宜'
      },
      {
        id: 'item-012',
        name: '练习球库存',
        category: 'equipment',
        condition: 'good',
        description: '库存充足，约3000个练习球'
      },
      {
        id: 'item-013',
        name: '停车场',
        category: 'facility',
        condition: 'good',
        description: '清洁干净，车位充足'
      },
      {
        id: 'item-014',
        name: 'A区沙坑',
        category: 'bunker',
        condition: 'excellent',
        description: '沙质松软，耙平良好'
      }
    ],
    issues: [],
    summary: '一切正常，未发现重大问题。3号发球台草坪修复工作已安排。',
    createdAt: '2024-05-21T07:30:00+08:00',
    updatedAt: '2024-05-21T16:00:00+08:00'
  },
  {
    id: 'patrol-004',
    patrolNo: 'PAT-2024-0519-001',
    date: '2024-05-19',
    startTime: '08:00',
    endTime: '11:00',
    location: '练习场',
    weather: '小雨',
    temperature: 22,
    operatorId: 'user-002',
    operatorName: '李教练',
    supervisorId: 'user-001',
    supervisorName: '张明远',
    status: 'approved',
    items: [
      {
        id: 'item-015',
        name: '排水系统',
        category: 'facility',
        condition: 'good',
        description: '雨水排放正常，无积水'
      },
      {
        id: 'item-016',
        name: '雨棚设施',
        category: 'facility',
        condition: 'good',
        description: '完好无损'
      }
    ],
    issues: [
      {
        id: 'issue-004',
        description: '雨天建议增加防滑提示牌',
        severity: 'low',
        category: 'safety',
        status: 'resolved',
        assigneeId: 'user-003',
        assigneeName: '王前台',
        resolvedAt: '2024-05-19T10:00:00+08:00',
        resolution: '已在入口处和打位区放置防滑警示牌'
      }
    ],
    summary: '雨天巡查，排水系统正常。已放置防滑提示。',
    createdAt: '2024-05-19T08:00:00+08:00',
    updatedAt: '2024-05-19T15:00:00+08:00'
  },
  {
    id: 'patrol-005',
    patrolNo: 'PAT-2024-0523-001',
    date: '2024-05-23',
    startTime: '06:30',
    endTime: undefined,
    location: '果岭区',
    weather: '晴',
    temperature: 21,
    operatorId: 'user-002',
    operatorName: '李教练',
    status: 'draft',
    items: [
      {
        id: 'item-017',
        name: '练习果岭',
        category: 'green',
        condition: 'good',
        description: '早上修剪完成，状态良好'
      }
    ],
    issues: [],
    summary: '',
    createdAt: '2024-05-23T06:30:00+08:00',
    updatedAt: '2024-05-23T06:30:00+08:00'
  }
]
