export const users = [
  { id: 1, name: '张监理', role: 'supervisor', avatar: 'Z' },
  { id: 2, name: '李管家', role: 'manager', avatar: 'L' },
  { id: 3, name: '王客服', role: 'service', avatar: 'W' },
];

export const projects = [
  { id: 1, name: '万科城市花园 3栋201', owner: '陈先生', phone: '138****1234', status: 'in_progress' },
  { id: 2, name: '碧桂园天玺 5栋1502', owner: '刘女士', phone: '139****5678', status: 'in_progress' },
  { id: 3, name: '保利花园 2栋803', owner: '王先生', phone: '137****9012', status: 'completed' },
];

export const changeOrders = [
  {
    id: 'CG20240501001',
    projectId: 1,
    projectName: '万科城市花园 3栋201',
    type: 'material',
    title: '墙面瓷砖品牌变更',
    description: '原合同约定使用东鹏瓷砖，现业主申请变更为马可波罗瓷砖，差价由业主承担。',
    reason: '业主个人喜好变更',
    status: 'pending_approval',
    currentHandler: 'manager',
    createdAt: '2024-05-20 10:30:00',
    createdBy: '张监理',
    version: 1,
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    ],
    costChange: {
      original: 12000,
      new: 15800,
      difference: 3800,
      note: '马可波罗瓷砖单价较高，增加费用3800元',
    },
    timeline: [
      { time: '2024-05-20 10:30:00', action: '创建变更单', user: '张监理', role: 'supervisor' },
      { time: '2024-05-20 11:00:00', action: '提交审核', user: '张监理', role: 'supervisor' },
    ],
    approvals: {
      supervisor: { approved: true, time: '2024-05-20 11:00:00', comment: '情况属实，建议批准', user: '张监理' },
      manager: { approved: null, time: null, comment: null, user: null },
      owner: { approved: null, time: null, comment: null, user: null },
    },
  },
  {
    id: 'CG20240501002',
    projectId: 1,
    projectName: '万科城市花园 3栋201',
    type: 'structure',
    title: '主卧衣柜尺寸调整',
    description: '因现场测量发现墙面不平整，衣柜深度需要从600mm调整为580mm。',
    reason: '现场实际情况与图纸不符',
    status: 'rejected',
    currentHandler: 'supervisor',
    createdAt: '2024-05-19 14:20:00',
    createdBy: '张监理',
    version: 2,
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    ],
    costChange: {
      original: 8500,
      new: 8200,
      difference: -300,
      note: '尺寸减小，费用减少300元',
    },
    timeline: [
      { time: '2024-05-19 14:20:00', action: '创建变更单（v1）', user: '张监理', role: 'supervisor' },
      { time: '2024-05-19 15:00:00', action: '提交审核', user: '张监理', role: 'supervisor' },
      { time: '2024-05-19 16:30:00', action: '驳回：需要补充测量数据', user: '李管家', role: 'manager' },
      { time: '2024-05-20 09:00:00', action: '更新变更单（v2）', user: '张监理', role: 'supervisor' },
    ],
    approvals: {
      supervisor: { approved: true, time: '2024-05-20 09:00:00', comment: '已补充测量数据', user: '张监理' },
      manager: { approved: false, time: '2024-05-19 16:30:00', comment: '需要补充详细测量数据和照片', user: '李管家' },
      owner: { approved: null, time: null, comment: null, user: null },
    },
  },
  {
    id: 'CG20240501003',
    projectId: 2,
    projectName: '碧桂园天玺 5栋1502',
    type: 'process',
    title: '增加防水处理区域',
    description: '业主希望在阳台区域增加防水处理，防止漏水问题。',
    reason: '业主要求增加施工内容',
    status: 'pending_owner_send',
    currentHandler: 'manager',
    createdAt: '2024-05-18 09:15:00',
    createdBy: '张监理',
    version: 1,
    images: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
    ],
    costChange: {
      original: 0,
      new: 2500,
      difference: 2500,
      note: '阳台防水施工费用2500元',
    },
    timeline: [
      { time: '2024-05-18 09:15:00', action: '创建变更单', user: '张监理', role: 'supervisor' },
      { time: '2024-05-18 10:00:00', action: '监理审核通过', user: '张监理', role: 'supervisor' },
      { time: '2024-05-18 11:30:00', action: '管家审核通过', user: '李管家', role: 'manager' },
    ],
    approvals: {
      supervisor: { approved: true, time: '2024-05-18 10:00:00', comment: '施工方案合理', user: '张监理' },
      manager: { approved: true, time: '2024-05-18 11:30:00', comment: '费用核算正确', user: '李管家' },
      owner: { approved: null, time: null, comment: null, user: null },
    },
  },
  {
    id: 'CG20240501004',
    projectId: 3,
    projectName: '保利花园 2栋803',
    type: 'material',
    title: '木地板材质升级',
    description: '业主申请将复合地板升级为实木地板。',
    reason: '业主个人喜好变更',
    status: 'completed',
    currentHandler: null,
    createdAt: '2024-05-10 15:00:00',
    createdBy: '张监理',
    version: 1,
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    ],
    costChange: {
      original: 18000,
      new: 28000,
      difference: 10000,
      note: '实木地板升级费用',
    },
    timeline: [
      { time: '2024-05-10 15:00:00', action: '创建变更单', user: '张监理', role: 'supervisor' },
      { time: '2024-05-10 16:00:00', action: '监理审核通过', user: '张监理', role: 'supervisor' },
      { time: '2024-05-10 17:30:00', action: '管家审核通过', user: '李管家', role: 'manager' },
      { time: '2024-05-11 10:00:00', action: '业主确认签字', user: '王先生', role: 'owner' },
      { time: '2024-05-11 11:00:00', action: '变更单生效', user: '系统', role: 'system' },
    ],
    approvals: {
      supervisor: { approved: true, time: '2024-05-10 16:00:00', comment: '确认产品质量达标', user: '张监理' },
      manager: { approved: true, time: '2024-05-10 17:30:00', comment: '费用已确认', user: '李管家' },
      owner: { approved: true, time: '2024-05-11 10:00:00', comment: '同意变更', user: '王先生' },
    },
  },
];

export const rectificationRecords = [
  {
    id: 'ZG202405001',
    projectId: 1,
    projectName: '万科城市花园 3栋201',
    type: 'quality',
    title: '卫生间墙砖空鼓',
    description: '卫生间墙面瓷砖发现3处空鼓，需要整改。',
    status: 'in_progress',
    deadline: '2024-05-25',
    createdAt: '2024-05-20 09:00:00',
    handler: '李工长',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    ],
  },
  {
    id: 'ZG202405002',
    projectId: 1,
    projectName: '万科城市花园 3栋201',
    type: 'safety',
    title: '现场安全防护不到位',
    description: '阳台临边防护缺失，存在安全隐患。',
    status: 'completed',
    deadline: '2024-05-22',
    createdAt: '2024-05-18 14:00:00',
    completedAt: '2024-05-19 10:00:00',
    handler: '李工长',
    images: [],
  },
  {
    id: 'ZG202405003',
    projectId: 2,
    projectName: '碧桂园天玺 5栋1502',
    type: 'quality',
    title: '水电管线排布不规范',
    description: '部分水电管线交叉排布不符合规范要求。',
    status: 'pending',
    deadline: '2024-05-28',
    createdAt: '2024-05-21 08:30:00',
    handler: '王工长',
    images: [],
  },
];

export const feeRecords = [
  {
    id: 'FY202405001',
    projectId: 1,
    projectName: '万科城市花园 3栋201',
    type: 'change_order',
    relatedId: 'CG20240501004',
    title: '木地板升级费用',
    amount: 10000,
    status: 'paid',
    paidAt: '2024-05-12 10:00:00',
    createdAt: '2024-05-11 11:00:00',
  },
];

export const statusMap = {
  pending_approval: { label: '待管家审核', color: 'warning' },
  pending_owner_send: { label: '待发送业主确认', color: 'warning' },
  pending_owner: { label: '待业主确认', color: 'warning' },
  rejected: { label: '已驳回', color: 'danger' },
  completed: { label: '已完成', color: 'success' },
  in_progress: { label: '进行中', color: 'primary' },
  pending: { label: '待处理', color: 'warning' },
  paid: { label: '已支付', color: 'success' },
  pending_pay: { label: '待业主支付', color: 'warning' },
  pending_confirm: { label: '待费用确认', color: 'warning' },
};

export const typeMap = {
  material: { label: '材料变更', icon: 'Package' },
  structure: { label: '结构变更', icon: 'Building2' },
  process: { label: '工艺变更', icon: 'Settings' },
  quality: { label: '质量问题', icon: 'AlertTriangle' },
  safety: { label: '安全问题', icon: 'ShieldAlert' },
  change_order: { label: '变更费用', icon: 'Receipt' },
};

export const roleMap = {
  supervisor: { label: '监理负责人', color: 'primary' },
  manager: { label: '项目管家', color: 'success' },
  service: { label: '业主客服', color: 'warning' },
  owner: { label: '业主', color: 'info' },
};
