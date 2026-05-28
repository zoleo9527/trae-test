import type { Order, User, RefundChain } from '@/types'

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: '张经理',
    role: 'business',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=business'
  },
  {
    id: 'u2',
    name: '李跟单',
    role: 'sampling',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sampling'
  },
  {
    id: 'u3',
    name: '王仓管',
    role: 'warehouse',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=warehouse'
  }
]

export const mockOrders: Order[] = [
  {
    id: 'ord001',
    orderNo: 'LP202405001',
    clientName: '腾讯科技',
    productName: '定制年会礼品套装',
    status: 'version_locked',
    assignee: '李跟单',
    assigneeRole: 'sampling',
    totalAmount: 125000,
    quantity: 500,
    createdAt: '2024-05-10T09:00:00Z',
    updatedAt: '2024-05-20T14:30:00Z',
    sampleVersions: [
      {
        id: 'sv1',
        orderId: 'ord001',
        version: 1,
        status: 'confirmed',
        photoUrl: 'https://picsum.photos/seed/sample1/400/300',
        confirmedBy: '李跟单',
        confirmedAt: '2024-05-12T10:00:00Z',
        specs: {
          '材质': 'PU皮革',
          '颜色': '深棕色',
          'logo工艺': '烫金',
          '尺寸': '25x18x8cm'
        },
        createdAt: '2024-05-11T09:00:00Z'
      },
      {
        id: 'sv2',
        orderId: 'ord001',
        version: 2,
        status: 'locked',
        photoUrl: 'https://picsum.photos/seed/sample2/400/300',
        confirmedBy: '李跟单',
        confirmedAt: '2024-05-18T11:00:00Z',
        changeReason: '客户要求更换颜色',
        specs: {
          '材质': 'PU皮革',
          '颜色': '经典黑',
          'logo工艺': '烫金',
          '尺寸': '25x18x8cm'
        },
        createdAt: '2024-05-17T09:00:00Z'
      }
    ],
    productionSchedules: [],
    shipments: [],
    exceptions: [
      {
        id: 'ex1',
        orderId: 'ord001',
        type: 'version_overwrite',
        severity: 'warning',
        status: 'resolved',
        description: '客户在版本锁定前要求更换颜色，从深棕色改为经典黑',
        createdAt: '2024-05-17T10:00:00Z',
        resolvedAt: '2024-05-18T11:30:00Z',
        oldVersionId: 'sv1',
        newVersionId: 'sv2'
      }
    ],
    operationLogs: [
      {
        id: 'log1',
        orderId: 'ord001',
        operator: '张经理',
        operatorRole: 'business',
        action: '创建订单',
        detail: '创建礼品定制订单，金额125,000元',
        timestamp: '2024-05-10T09:00:00Z'
      },
      {
        id: 'log2',
        orderId: 'ord001',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '确认样品v1',
        detail: '确认第一版样品，颜色为深棕色',
        timestamp: '2024-05-12T10:00:00Z'
      },
      {
        id: 'log3',
        orderId: 'ord001',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '触发版本覆盖',
        detail: '客户要求颜色变更，触发版本覆盖告警',
        timestamp: '2024-05-17T10:00:00Z'
      },
      {
        id: 'log4',
        orderId: 'ord001',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '确认样品v2',
        detail: '确认第二版样品，颜色变更为经典黑，版本锁定',
        timestamp: '2024-05-18T11:00:00Z'
      }
    ]
  },
  {
    id: 'ord002',
    orderNo: 'LP202405002',
    clientName: '阿里巴巴',
    productName: '员工福利保温杯',
    status: 'shipping',
    assignee: '王仓管',
    assigneeRole: 'warehouse',
    totalAmount: 48000,
    quantity: 1200,
    createdAt: '2024-05-08T10:00:00Z',
    updatedAt: '2024-05-22T09:00:00Z',
    sampleVersions: [
      {
        id: 'sv3',
        orderId: 'ord002',
        version: 1,
        status: 'locked',
        photoUrl: 'https://picsum.photos/seed/sample3/400/300',
        confirmedBy: '李跟单',
        confirmedAt: '2024-05-10T15:00:00Z',
        specs: {
          '容量': '500ml',
          '颜色': '太空灰',
          '材质': '304不锈钢',
          '保温时长': '12小时'
        },
        createdAt: '2024-05-09T09:00:00Z'
      }
    ],
    productionSchedules: [
      {
        id: 'ps1',
        orderId: 'ord002',
        scheduledDate: '2024-05-15',
        productionStatus: 'qc_passed',
        qcResult: '合格',
        quantity: 1200,
        createdAt: '2024-05-14T09:00:00Z'
      }
    ],
    shipments: [
      {
        id: 'sh1',
        orderId: 'ord002',
        trackingNo: 'SF1234567890',
        carrier: '顺丰速运',
        status: 'partial',
        shippedAt: '2024-05-20T10:00:00Z',
        items: [
          {
            id: 'shi1',
            shipmentId: 'sh1',
            skuName: '保温杯-太空灰-500ml',
            expectedQty: 1200,
            actualQty: 1150,
            isMissing: true
          }
        ]
      }
    ],
    exceptions: [
      {
        id: 'ex2',
        orderId: 'ord002',
        type: 'shipment_missing',
        severity: 'critical',
        status: 'pending',
        description: '拆单发货检测到漏件：应发1200件，实发1150件，缺少50件',
        createdAt: '2024-05-20T11:00:00Z'
      }
    ],
    operationLogs: [
      {
        id: 'log5',
        orderId: 'ord002',
        operator: '张经理',
        operatorRole: 'business',
        action: '创建订单',
        detail: '创建保温杯订单，数量1200个',
        timestamp: '2024-05-08T10:00:00Z'
      },
      {
        id: 'log6',
        orderId: 'ord002',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '样品确认锁定',
        detail: '保温杯样品确认通过，版本锁定',
        timestamp: '2024-05-10T15:00:00Z'
      },
      {
        id: 'log7',
        orderId: 'ord002',
        operator: '王仓管',
        operatorRole: 'warehouse',
        action: '安排排期',
        detail: '量产排期至5月15日',
        timestamp: '2024-05-14T09:00:00Z'
      },
      {
        id: 'log8',
        orderId: 'ord002',
        operator: '王仓管',
        operatorRole: 'warehouse',
        action: '发货操作',
        detail: '顺丰发货，运单号SF1234567890，检测到漏件50个',
        timestamp: '2024-05-20T11:00:00Z'
      }
    ]
  },
  {
    id: 'ord003',
    orderNo: 'LP202405003',
    clientName: '字节跳动',
    productName: '定制笔记本礼盒',
    status: 'completed',
    assignee: '张经理',
    assigneeRole: 'business',
    totalAmount: 85000,
    quantity: 2000,
    createdAt: '2024-04-20T09:00:00Z',
    updatedAt: '2024-05-21T16:00:00Z',
    sampleVersions: [
      {
        id: 'sv4',
        orderId: 'ord003',
        version: 1,
        status: 'locked',
        photoUrl: 'https://picsum.photos/seed/sample4/400/300',
        confirmedBy: '李跟单',
        confirmedAt: '2024-04-25T10:00:00Z',
        specs: {
          '内页': '100g道林纸',
          '页数': '128页',
          '封面': 'PU皮',
          '装订': '精装'
        },
        createdAt: '2024-04-23T09:00:00Z'
      }
    ],
    productionSchedules: [
      {
        id: 'ps2',
        orderId: 'ord003',
        scheduledDate: '2024-04-28',
        productionStatus: 'qc_passed',
        qcResult: '合格',
        quantity: 2000,
        createdAt: '2024-04-27T09:00:00Z'
      }
    ],
    shipments: [
      {
        id: 'sh2',
        orderId: 'ord003',
        trackingNo: 'JD9876543210',
        carrier: '京东物流',
        status: 'delivered',
        shippedAt: '2024-05-05T09:00:00Z',
        items: [
          {
            id: 'shi2',
            shipmentId: 'sh2',
            skuName: '笔记本礼盒-精装版',
            expectedQty: 2000,
            actualQty: 2000,
            isMissing: false
          }
        ]
      }
    ],
    exceptions: [
      {
        id: 'ex3',
        orderId: 'ord003',
        type: 'refund_required',
        severity: 'warning',
        status: 'processing',
        description: '客户反馈100本笔记本印刷瑕疵，申请退款5%计4,250元',
        createdAt: '2024-05-20T10:00:00Z',
        refundChain: {
          id: 'rc1',
          exceptionId: 'ex3',
          responsibleParty: 'factory',
          amount: 4250,
          applyReason: '客户反馈100本笔记本印刷瑕疵，文字模糊不清，影响使用',
          approvalStatus: 'pending',
          responsiblePartyHistory: [
            {
              from: 'internal',
              to: 'factory',
              operator: '张经理',
              operatorRole: 'business',
              timestamp: '2024-05-20T11:00:00Z',
              remark: '经核实，确认为印刷厂套色偏移导致'
            }
          ]
        }
      }
    ],
    operationLogs: [
      {
        id: 'log9',
        orderId: 'ord003',
        operator: '张经理',
        operatorRole: 'business',
        action: '创建订单',
        detail: '创建笔记本礼盒订单，共2000套',
        timestamp: '2024-04-20T09:00:00Z'
      },
      {
        id: 'log10',
        orderId: 'ord003',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '样品确认',
        detail: '笔记本样品确认通过',
        timestamp: '2024-04-25T10:00:00Z'
      },
      {
        id: 'log11',
        orderId: 'ord003',
        operator: '王仓管',
        operatorRole: 'warehouse',
        action: '完成发货',
        detail: '京东物流发货，客户已签收',
        timestamp: '2024-05-08T10:00:00Z'
      },
      {
        id: 'log12',
        orderId: 'ord003',
        operator: '张经理',
        operatorRole: 'business',
        action: '发起退款申请',
        detail: '客户反馈印刷瑕疵，申请退款4,250元',
        timestamp: '2024-05-20T10:00:00Z'
      }
    ]
  },
  {
    id: 'ord004',
    orderNo: 'LP202405004',
    clientName: '美团',
    productName: '定制U盘礼品',
    status: 'sampling',
    assignee: '李跟单',
    assigneeRole: 'sampling',
    totalAmount: 32000,
    quantity: 800,
    createdAt: '2024-05-25T09:00:00Z',
    updatedAt: '2024-05-25T09:00:00Z',
    sampleVersions: [
      {
        id: 'sv5',
        orderId: 'ord004',
        version: 1,
        status: 'pending',
        photoUrl: 'https://picsum.photos/seed/sample5/400/300',
        specs: {
          '容量': '32GB',
          '材质': '金属外壳',
          '接口': 'USB3.0',
          '颜色': '银色'
        },
        createdAt: '2024-05-25T09:00:00Z'
      }
    ],
    productionSchedules: [],
    shipments: [],
    exceptions: [],
    operationLogs: [
      {
        id: 'log13',
        orderId: 'ord004',
        operator: '张经理',
        operatorRole: 'business',
        action: '创建订单',
        detail: '创建U盘定制订单，800个',
        timestamp: '2024-05-25T09:00:00Z'
      },
      {
        id: 'log14',
        orderId: 'ord004',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '安排打样',
        detail: '样品已安排工厂制作',
        timestamp: '2024-05-25T10:00:00Z'
      }
    ]
  },
  {
    id: 'ord005',
    orderNo: 'LP202405005',
    clientName: '华为',
    productName: '定制背包套装',
    status: 'producing',
    assignee: '王仓管',
    assigneeRole: 'warehouse',
    totalAmount: 180000,
    quantity: 600,
    createdAt: '2024-05-01T09:00:00Z',
    updatedAt: '2024-05-23T09:00:00Z',
    sampleVersions: [
      {
        id: 'sv6',
        orderId: 'ord005',
        version: 1,
        status: 'locked',
        photoUrl: 'https://picsum.photos/seed/sample6/400/300',
        confirmedBy: '李跟单',
        confirmedAt: '2024-05-08T10:00:00Z',
        specs: {
          '材质': '牛津布',
          '容量': '25L',
          '颜色': '黑色',
          '功能': '电脑隔层+USB充电'
        },
        createdAt: '2024-05-05T09:00:00Z'
      }
    ],
    productionSchedules: [
      {
        id: 'ps3',
        orderId: 'ord005',
        scheduledDate: '2024-05-12',
        productionStatus: 'producing',
        quantity: 600,
        createdAt: '2024-05-11T09:00:00Z'
      }
    ],
    shipments: [],
    exceptions: [],
    operationLogs: [
      {
        id: 'log15',
        orderId: 'ord005',
        operator: '张经理',
        operatorRole: 'business',
        action: '创建订单',
        detail: '创建背包套装订单，600套，金额180,000元',
        timestamp: '2024-05-01T09:00:00Z'
      },
      {
        id: 'log16',
        orderId: 'ord005',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '样品确认锁定',
        detail: '背包样品确认通过',
        timestamp: '2024-05-08T10:00:00Z'
      },
      {
        id: 'log17',
        orderId: 'ord005',
        operator: '王仓管',
        operatorRole: 'warehouse',
        action: '开始生产',
        detail: '量产进行中，预计5月28日完成',
        timestamp: '2024-05-15T09:00:00Z'
      }
    ]
  },
  {
    id: 'ord006',
    orderNo: 'LP202405006',
    clientName: '小米科技',
    productName: '定制晴雨伞',
    status: 'scheduled',
    assignee: '王仓管',
    assigneeRole: 'warehouse',
    totalAmount: 28000,
    quantity: 1000,
    createdAt: '2024-05-22T09:00:00Z',
    updatedAt: '2024-05-26T09:00:00Z',
    sampleVersions: [
      {
        id: 'sv7',
        orderId: 'ord006',
        version: 1,
        status: 'locked',
        photoUrl: 'https://picsum.photos/seed/sample7/400/300',
        confirmedBy: '李跟单',
        confirmedAt: '2024-05-25T10:00:00Z',
        specs: {
          '尺寸': '23寸',
          '材质': '黑胶布',
          '类型': '全自动',
          '颜色': '定制logo'
        },
        createdAt: '2024-05-24T09:00:00Z'
      }
    ],
    productionSchedules: [
      {
        id: 'ps4',
        orderId: 'ord006',
        scheduledDate: '2024-05-28',
        productionStatus: 'scheduled',
        quantity: 1000,
        createdAt: '2024-05-26T09:00:00Z'
      }
    ],
    shipments: [],
    exceptions: [],
    operationLogs: [
      {
        id: 'log18',
        orderId: 'ord006',
        operator: '张经理',
        operatorRole: 'business',
        action: '创建订单',
        detail: '创建晴雨伞定制订单，1000把',
        timestamp: '2024-05-22T09:00:00Z'
      },
      {
        id: 'log19',
        orderId: 'ord006',
        operator: '李跟单',
        operatorRole: 'sampling',
        action: '样品确认锁定',
        detail: '雨伞样品确认通过',
        timestamp: '2024-05-25T10:00:00Z'
      },
      {
        id: 'log20',
        orderId: 'ord006',
        operator: '王仓管',
        operatorRole: 'warehouse',
        action: '安排排期',
        detail: '量产排期至5月28日',
        timestamp: '2024-05-26T09:00:00Z'
      }
    ]
  }
]

const migrateRefundChain = (chain: any, operationLogs?: any[]): RefundChain => {
  if (!chain) return chain

  const migrated: any = { ...chain }

  if ('remark' in migrated && !('applyReason' in migrated)) {
    const oldRemark = migrated.remark || ''
    if (migrated.approvalStatus === 'approved' || migrated.approvalStatus === 'rejected') {
      migrated.applyReason = oldRemark
      migrated.approvalRemark = oldRemark
    } else {
      migrated.applyReason = oldRemark
      migrated.approvalRemark = undefined
    }
    delete migrated.remark
  }
  if (!('applyReason' in migrated)) {
    migrated.applyReason = ''
  }
  if (!('approvalRemark' in migrated)) {
    migrated.approvalRemark = undefined
  }

  if (!('responsiblePartyHistory' in migrated) || !Array.isArray(migrated.responsiblePartyHistory) || migrated.responsiblePartyHistory.length === 0) {
    const history: Array<any> = []

    if (operationLogs && Array.isArray(operationLogs)) {
      const changeLogs = operationLogs.filter((log: any) =>
        log.action === '变更责任方' || log.action === '发起退款'
      )

      for (const log of changeLogs) {
        const detail: string = log.detail || ''
        const fromMatch = detail.match(/从"(\w+)"变更为/)
        const toMatch = detail.match(/变更为"(\w+)"/)

        if (fromMatch && toMatch) {
          history.push({
            from: fromMatch[1],
            to: toMatch[1],
            operator: log.operator,
            operatorRole: log.operatorRole,
            timestamp: log.timestamp,
            remark: undefined
          })
        } else if (log.action === '发起退款') {
          const partyMatch = detail.match(/责任方[：:]?\s*(\S+)/)
          if (partyMatch) {
            const party = partyMatch[1].replace(/[，,。.]/, '')
            history.push({
              from: party,
              to: party,
              operator: log.operator,
              operatorRole: log.operatorRole,
              timestamp: log.timestamp,
              remark: '发起退款时首次认定'
            })
          }
        }
      }
    }

    migrated.responsiblePartyHistory = history
  }

  return migrated as RefundChain
}

export const getInitialData = (): Order[] => {
  const stored = localStorage.getItem('gift_orders')
  if (stored) {
    try {
      const orders: Order[] = JSON.parse(stored)
      for (const order of orders) {
        for (const exception of order.exceptions) {
          if (exception.type === 'refund_required' && exception.refundChain) {
            exception.refundChain = migrateRefundChain(exception.refundChain, order.operationLogs)
          }
        }
      }
      saveOrders(orders)
      return orders
    } catch {
      return mockOrders
    }
  }
  return mockOrders
}

export const saveOrders = (orders: Order[]): void => {
  localStorage.setItem('gift_orders', JSON.stringify(orders))
}

export const getCurrentUser = (): User => {
  const stored = localStorage.getItem('current_user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return mockUsers[0]
    }
  }
  return mockUsers[0]
}

export const saveCurrentUser = (user: User): void => {
  localStorage.setItem('current_user', JSON.stringify(user))
}
