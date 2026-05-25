const users = [
  { id: 'u1', username: 'channel_mgr', name: '李敏', role: 'channel_manager', password: '123456' },
  { id: 'u2', username: 'dist_specialist', name: '王浩', role: 'distribution_specialist', password: '123456' },
  { id: 'u3', username: 'finance', name: '张婷', role: 'finance', password: '123456' },
  { id: 'u4', username: 'admin', name: '赵磊', role: 'admin', password: '123456' }
]

const authors = [
  { id: 'a1', name: '陈雨桐', category: '文学' },
  { id: 'a2', name: '林见夏', category: '社科' },
  { id: 'a3', name: '何川', category: '经管' },
  { id: 'a4', name: '苏晓棠', category: '童书' }
]

const books = [
  { id: 'b1', title: '城南旧事新编', authorId: 'a1', isbn: '9787101000001', price: 58.0, publishDate: '2026-01-10' },
  { id: 'b2', title: '沉默的河流', authorId: 'a1', isbn: '9787101000002', price: 49.0, publishDate: '2026-03-05' },
  { id: 'b3', title: '城市观察笔记', authorId: 'a2', isbn: '9787101000003', price: 68.0, publishDate: '2026-02-18' },
  { id: 'b4', title: '增长的代价', authorId: 'a3', isbn: '9787101000004', price: 78.0, publishDate: '2025-12-20' },
  { id: 'b5', title: '小怪兽森林', authorId: 'a4', isbn: '9787101000005', price: 45.0, publishDate: '2026-04-01' }
]

const channels = [
  { id: 'c1', name: '当当自营', type: '电商', contact: '刘经理' },
  { id: 'c2', name: '京东图书', type: '电商', contact: '孙经理' },
  { id: 'c3', name: '新华书店总店', type: '实体', contact: '钱主管' },
  { id: 'c4', name: '博库书城', type: '实体', contact: '周主管' },
  { id: 'c5', name: '天猫图书旗舰店', type: '电商', contact: '吴经理' }
]

const authorActivities = [
  {
    id: 'act1',
    title: '《城南旧事新编》首发签售会',
    authorId: 'a1',
    channelId: 'c3',
    type: '签售',
    planDate: '2026-02-15',
    location: '北京王府井新华书店',
    expectedQty: 500,
    status: '已完成',
    ownerId: 'u1',
    timeline: [
      { time: '2026-01-12 10:00', actor: '李敏', action: '创建活动', note: '确认与新华书店总店合作' },
      { time: '2026-01-20 14:20', actor: '王浩', action: '样书寄送', note: '寄送样书 50 册，快递 SF123456' },
      { time: '2026-02-10 09:10', actor: '李敏', action: '现场协调', note: '场地已布置，作者到场确认' },
      { time: '2026-02-15 20:30', actor: '李敏', action: '完成', note: '现场售书 412 册，余 88 册退回' }
    ],
    remarks: '活动后需补寄作者签名海报'
  },
  {
    id: 'act2',
    title: '《城市观察笔记》线上直播分享',
    authorId: 'a2',
    channelId: 'c1',
    type: '线上分享',
    planDate: '2026-03-20',
    location: '当当直播间',
    expectedQty: 300,
    status: '进行中',
    ownerId: 'u2',
    timeline: [
      { time: '2026-02-25 11:00', actor: '王浩', action: '创建活动', note: '与当当自营敲定档期' },
      { time: '2026-03-05 16:40', actor: '王浩', action: '物料准备', note: '作者简介卡、优惠券 10 元' },
      { time: '2026-03-18 09:00', actor: '李敏', action: '进度复核', note: '渠道反馈物料待更新封面图' }
    ],
    remarks: '直播前需与作者再次走查脚本'
  },
  {
    id: 'act3',
    title: '《小怪兽森林》亲子读书会',
    authorId: 'a4',
    channelId: 'c4',
    type: '读书会',
    planDate: '2026-05-10',
    location: '杭州博库书城',
    expectedQty: 200,
    status: '待确认',
    ownerId: 'u2',
    timeline: [
      { time: '2026-04-20 13:20', actor: '王浩', action: '创建活动', note: '渠道回执尚未回签' }
    ],
    remarks: '等待博库回执，样书快递待寄出'
  },
  {
    id: 'act4',
    title: '《增长的代价》高校巡讲·上海站',
    authorId: 'a3',
    channelId: 'c4',
    type: '巡讲',
    planDate: '2026-06-08',
    location: '复旦大学',
    expectedQty: 400,
    status: '已取消',
    ownerId: 'u1',
    timeline: [
      { time: '2026-03-02 09:00', actor: '李敏', action: '创建活动', note: '初步与渠道敲定' },
      { time: '2026-04-10 10:00', actor: '李敏', action: '取消', note: '作者档期冲突，延后至 9 月' }
    ],
    remarks: '已通知渠道退票'
  }
]

const distributions = [
  {
    id: 'd1',
    bookId: 'b1',
    channelId: 'c1',
    batch: 'P2026-01-001',
    qty: 2000,
    shippedAt: '2026-01-15',
    sampleExpress: 'SF123401',
    sampleQty: 20,
    sampleReceived: true,
    sampleReceivedAt: '2026-01-18',
    returnedQty: 120,
    returnedAt: '2026-03-02',
    returnNote: '季节性退货',
    settledAmount: 58 * (2000 - 120) * 0.5,
    settledAt: '2026-04-10',
    status: '已回款',
    ownerId: 'u2',
    records: [
      { time: '2026-01-15 10:00', actor: '王浩', action: '新建铺货单', note: '2000 册，折扣 5 折' },
      { time: '2026-01-18 14:00', actor: '王浩', action: '样书回执', note: '渠道确认收到 20 册样书' },
      { time: '2026-03-02 16:30', actor: '李敏', action: '退货入库', note: '收到退货 120 册，外观完好' },
      { time: '2026-04-10 11:20', actor: '张婷', action: '回款登记', note: '到账 54,520 元' }
    ]
  },
  {
    id: 'd2',
    bookId: 'b2',
    channelId: 'c2',
    batch: 'P2026-03-004',
    qty: 1500,
    shippedAt: '2026-03-10',
    sampleExpress: 'SF123402',
    sampleQty: 15,
    sampleReceived: false,
    sampleReceivedAt: null,
    returnedQty: 0,
    returnedAt: null,
    returnNote: '',
    settledAmount: 0,
    settledAt: null,
    status: '样书待回执',
    ownerId: 'u2',
    records: [
      { time: '2026-03-10 09:30', actor: '王浩', action: '新建铺货单', note: '1500 册，折扣 5 折' },
      { time: '2026-03-12 15:00', actor: '王浩', action: '样书寄出', note: '京东图书尚未回执' }
    ]
  },
  {
    id: 'd3',
    bookId: 'b3',
    channelId: 'c3',
    batch: 'P2026-02-002',
    qty: 3000,
    shippedAt: '2026-02-25',
    sampleExpress: 'SF123403',
    sampleQty: 30,
    sampleReceived: true,
    sampleReceivedAt: '2026-02-28',
    returnedQty: 450,
    returnedAt: '2026-04-28',
    returnNote: '合同口径退货（3 个月未动销）',
    settledAmount: 0,
    settledAt: null,
    status: '待对账',
    ownerId: 'u2',
    records: [
      { time: '2026-02-25 10:00', actor: '王浩', action: '新建铺货单', note: '3000 册，折扣 4.8 折' },
      { time: '2026-02-28 11:30', actor: '王浩', action: '样书回执', note: '新华回执收到' },
      { time: '2026-04-28 14:00', actor: '李敏', action: '退货登记', note: '退货 450 册，待财务核对口径' },
      { time: '2026-05-05 10:10', actor: '张婷', action: '对账备注', note: '退货口径与合同 3 个月未动销一致，待渠道确认金额' }
    ]
  },
  {
    id: 'd4',
    bookId: 'b5',
    channelId: 'c5',
    batch: 'P2026-04-003',
    qty: 800,
    shippedAt: '2026-04-05',
    sampleExpress: 'SF123404',
    sampleQty: 10,
    sampleReceived: true,
    sampleReceivedAt: '2026-04-08',
    returnedQty: 0,
    returnedAt: null,
    returnNote: '',
    settledAmount: 0,
    settledAt: null,
    status: '销售中',
    ownerId: 'u2',
    records: [
      { time: '2026-04-05 09:00', actor: '王浩', action: '新建铺货单', note: '800 册，折扣 5 折' },
      { time: '2026-04-08 11:15', actor: '王浩', action: '样书回执', note: '天猫旗舰店确认收到' }
    ]
  },
  {
    id: 'd5',
    bookId: 'b4',
    channelId: 'c1',
    batch: 'P2025-12-009',
    qty: 1000,
    shippedAt: '2025-12-28',
    sampleExpress: 'SF123405',
    sampleQty: 12,
    sampleReceived: true,
    sampleReceivedAt: '2025-12-30',
    returnedQty: 0,
    returnedAt: null,
    returnNote: '',
    settledAmount: 78 * 1000 * 0.5,
    settledAt: '2026-03-15',
    status: '已回款',
    ownerId: 'u2',
    records: [
      { time: '2025-12-28 10:00', actor: '王浩', action: '新建铺货单', note: '1000 册，折扣 5 折' },
      { time: '2025-12-30 14:20', actor: '王浩', action: '样书回执', note: '收到渠道回执' },
      { time: '2026-03-15 09:40', actor: '张婷', action: '回款登记', note: '到账 39,000 元' }
    ]
  }
]

const rolesMap = {
  channel_manager: '渠道经理',
  distribution_specialist: '发行专员',
  finance: '财务',
  admin: '管理员'
}

module.exports = {
  users,
  authors,
  books,
  channels,
  authorActivities,
  distributions,
  rolesMap
}
