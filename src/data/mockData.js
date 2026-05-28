export const mockUsers = [
  { id: 1, name: '张明', role: 'business', avatar: '张', department: '商务部' },
  { id: 2, name: '李芳', role: 'sample', avatar: '李', department: '打样部' },
  { id: 3, name: '王强', role: 'warehouse', avatar: '王', department: '仓配部' }
]

export const mockOrders = [
  {
    id: 1,
    orderNo: 'GT202405001',
    customer: '腾讯科技',
    productName: '定制金属书签套装',
    quantity: 500,
    amount: 25000,
    status: 'after_sale',
    sampleVersion: 'v2.1',
    deliveryDate: '2024-05-20',
    createdAt: '2024-04-15T10:30:00Z',
    createdBy: '张明',
    shipments: [
      {
        id: 1,
        courier: '顺丰',
        trackingNo: 'SF1234567890123',
        quantity: 300,
        createdAt: '2024-05-18T14:00:00Z',
        createdBy: '王强'
      }
    ],
    afterSales: [
      {
        id: 1,
        type: 'reorder',
        status: 'processing',
        reason: '客户反馈首批300件中有20件印刷模糊，需要补单',
        amount: 1000,
        items: [{ name: '金属书签', quantity: 20, price: 50 }],
        createdAt: '2024-05-22T09:15:00Z',
        createdBy: '张明',
        logs: [
          {
            time: '2024-05-22T09:15:00Z',
            action: '发起补单申请',
            operator: '张明',
            remark: '客户反馈首批300件中有20件印刷模糊，需要补单'
          },
          {
            time: '2024-05-22T10:30:00Z',
            action: '补单审核通过',
            operator: '李芳',
            remark: '已核对样品照片v2.1，确认为印刷工艺问题，同意补单'
          },
          {
            time: '2024-05-22T14:00:00Z',
            action: '开始生产',
            operator: '李芳',
            remark: '已安排生产线，预计5月24日完成'
          }
        ]
      }
    ],
    history: [
      {
        id: 1,
        time: '2024-04-15T10:30:00Z',
        action: '创建订单',
        operator: '张明',
        operatorRole: 'business',
        remark: '客户需求：500套金属书签，刻字logo，5月20日交付'
      },
      {
        id: 2,
        time: '2024-04-16T14:20:00Z',
        action: '打样v1.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '首版样品完成，材质304不锈钢，电镀金色'
      },
      {
        id: 3,
        time: '2024-04-18T09:00:00Z',
        action: '版本更新v2.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '客户反馈logo位置需要调整，更新打样'
      },
      {
        id: 4,
        time: '2024-04-19T16:30:00Z',
        action: '客户确认v2.1',
        operator: '张明',
        operatorRole: 'business',
        remark: '客户最终确认样品，可以量产'
      },
      {
        id: 5,
        time: '2024-05-10T10:00:00Z',
        action: '开始量产',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '生产线已启动，预计5月18日完成500件'
      },
      {
        id: 6,
        time: '2024-05-18T14:00:00Z',
        action: '首批发货',
        operator: '王强',
        operatorRole: 'warehouse',
        remark: '发货300件，顺丰 SF1234567890123'
      },
      {
        id: 7,
        time: '2024-05-22T09:15:00Z',
        action: '发起售后',
        operator: '张明',
        operatorRole: 'business',
        remark: '补单申请：20件印刷质量问题'
      }
    ]
  },
  {
    id: 2,
    orderNo: 'GT202405002',
    customer: '阿里巴巴',
    productName: '定制亚克力台卡',
    quantity: 200,
    amount: 16000,
    status: 'after_sale',
    sampleVersion: 'v1.5',
    deliveryDate: '2024-05-25',
    createdAt: '2024-04-20T11:00:00Z',
    createdBy: '张明',
    shipments: [
      {
        id: 1,
        courier: '京东',
        trackingNo: 'JD9876543210987',
        quantity: 200,
        createdAt: '2024-05-23T10:00:00Z',
        createdBy: '王强'
      }
    ],
    afterSales: [
      {
        id: 2,
        type: 'refund',
        status: 'pending',
        reason: '客户收到货后发现尺寸与样品不符，申请部分退款',
        amount: 3200,
        items: [{ name: '亚克力台卡', quantity: 40, price: 80 }],
        createdAt: '2024-05-25T15:30:00Z',
        createdBy: '张明',
        logs: [
          {
            time: '2024-05-25T15:30:00Z',
            action: '发起退款申请',
            operator: '张明',
            remark: '客户反馈实际尺寸10x15cm，样品确认是12x18cm，差异明显'
          }
        ]
      }
    ],
    history: [
      {
        id: 1,
        time: '2024-04-20T11:00:00Z',
        action: '创建订单',
        operator: '张明',
        operatorRole: 'business',
        remark: '200个亚克力台卡，UV打印，尺寸12x18cm'
      },
      {
        id: 2,
        time: '2024-04-22T15:00:00Z',
        action: '打样v1.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '首版样品，尺寸12x18cm，厚度5mm'
      },
      {
        id: 3,
        time: '2024-04-23T10:00:00Z',
        action: '打样v1.5',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '客户要求调整打印位置，更新样品已确认'
      },
      {
        id: 4,
        time: '2024-05-20T09:00:00Z',
        action: '量产完成',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '200件全部生产完成，质检合格'
      },
      {
        id: 5,
        time: '2024-05-23T10:00:00Z',
        action: '发货完成',
        operator: '王强',
        operatorRole: 'warehouse',
        remark: '京东物流，单号JD9876543210987'
      },
      {
        id: 6,
        time: '2024-05-25T15:30:00Z',
        action: '发起退款',
        operator: '张明',
        operatorRole: 'business',
        remark: '尺寸不符，申请40件退款'
      }
    ]
  },
  {
    id: 3,
    orderNo: 'GT202405003',
    customer: '字节跳动',
    productName: '定制PU笔记本',
    quantity: 1000,
    amount: 45000,
    status: 'partial_shipped',
    sampleVersion: 'v3.0',
    deliveryDate: '2024-06-01',
    createdAt: '2024-04-25T09:30:00Z',
    createdBy: '张明',
    shipments: [
      {
        id: 1,
        courier: '顺丰',
        trackingNo: 'SF1122334455667',
        quantity: 600,
        createdAt: '2024-05-28T09:00:00Z',
        createdBy: '王强'
      }
    ],
    afterSales: [],
    history: [
      {
        id: 1,
        time: '2024-04-25T09:30:00Z',
        action: '创建订单',
        operator: '张明',
        operatorRole: 'business',
        remark: '1000本PU笔记本，烫金logo，内页定制'
      },
      {
        id: 2,
        time: '2024-04-26T14:00:00Z',
        action: '打样v1.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '首版样品，黑色PU，烫金logo'
      },
      {
        id: 3,
        time: '2024-04-28T10:00:00Z',
        action: '打样v2.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '客户要求改为深棕色，内页纸张升级'
      },
      {
        id: 4,
        time: '2024-04-30T16:00:00Z',
        action: '打样v3.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '最终确认版本，深棕色PU，80g米黄纸'
      },
      {
        id: 5,
        time: '2024-05-20T10:00:00Z',
        action: '开始量产',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '生产线启动，分两批交货'
      },
      {
        id: 6,
        time: '2024-05-28T09:00:00Z',
        action: '第一批发货',
        operator: '王强',
        operatorRole: 'warehouse',
        remark: '600本已发出，顺丰SF1122334455667'
      }
    ]
  },
  {
    id: 4,
    orderNo: 'GT202405004',
    customer: '华为技术',
    productName: '定制陶瓷保温杯',
    quantity: 300,
    amount: 39000,
    status: 'production',
    sampleVersion: 'v2.0',
    deliveryDate: '2024-06-10',
    createdAt: '2024-05-10T14:00:00Z',
    createdBy: '张明',
    shipments: [],
    afterSales: [],
    history: [
      {
        id: 1,
        time: '2024-05-10T14:00:00Z',
        action: '创建订单',
        operator: '张明',
        operatorRole: 'business',
        remark: '300个陶瓷保温杯，激光雕刻logo'
      },
      {
        id: 2,
        time: '2024-05-12T10:00:00Z',
        action: '打样v1.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '首版样品，白色陶瓷，硅胶盖'
      },
      {
        id: 3,
        time: '2024-05-15T11:00:00Z',
        action: '打样v2.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: 'logo位置调整，客户已确认'
      },
      {
        id: 4,
        time: '2024-05-25T09:00:00Z',
        action: '开始量产',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '量产中，预计6月5日完成'
      }
    ]
  },
  {
    id: 5,
    orderNo: 'GT202405005',
    customer: '小米科技',
    productName: '定制帆布手提袋',
    quantity: 800,
    amount: 24000,
    status: 'completed',
    sampleVersion: 'v1.0',
    deliveryDate: '2024-05-15',
    createdAt: '2024-04-01T10:00:00Z',
    createdBy: '张明',
    shipments: [
      {
        id: 1,
        courier: '圆通',
        trackingNo: 'YT1234567890000',
        quantity: 800,
        createdAt: '2024-05-12T14:00:00Z',
        createdBy: '王强'
      }
    ],
    afterSales: [
      {
        id: 3,
        type: 'reorder',
        status: 'completed',
        reason: '客户追加订单200个',
        amount: 6000,
        items: [{ name: '帆布手提袋', quantity: 200, price: 30 }],
        createdAt: '2024-05-18T10:00:00Z',
        createdBy: '张明',
        logs: [
          {
            time: '2024-05-18T10:00:00Z',
            action: '发起补单',
            operator: '张明',
            remark: '客户活动效果好，追加200个'
          },
          {
            time: '2024-05-18T11:00:00Z',
            action: '审核通过',
            operator: '李芳',
            remark: '使用v1.0版本直接生产'
          },
          {
            time: '2024-05-22T09:00:00Z',
            action: '补单发货',
            operator: '王强',
            remark: '补单200个已发出，圆通YT1234567890001'
          },
          {
            time: '2024-05-23T10:00:00Z',
            action: '完成',
            operator: '张明',
            remark: '客户已签收，确认完成'
          }
        ]
      }
    ],
    history: [
      {
        id: 1,
        time: '2024-04-01T10:00:00Z',
        action: '创建订单',
        operator: '张明',
        operatorRole: 'business',
        remark: '800个帆布手提袋，丝印logo'
      },
      {
        id: 2,
        time: '2024-04-03T15:00:00Z',
        action: '打样v1.0',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '样品确认，米色帆布，橙色印刷'
      },
      {
        id: 3,
        time: '2024-04-20T09:00:00Z',
        action: '量产完成',
        operator: '李芳',
        operatorRole: 'sample',
        remark: '800个生产完成'
      },
      {
        id: 4,
        time: '2024-05-12T14:00:00Z',
        action: '发货',
        operator: '王强',
        operatorRole: 'warehouse',
        remark: '全部发出'
      },
      {
        id: 5,
        time: '2024-05-18T10:00:00Z',
        action: '补单',
        operator: '张明',
        operatorRole: 'business',
        remark: '追加200个'
      },
      {
        id: 6,
        time: '2024-05-23T10:00:00Z',
        action: '完成',
        operator: '张明',
        operatorRole: 'business',
        remark: '订单全部完成'
      }
    ]
  }
]