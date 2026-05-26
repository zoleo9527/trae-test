import type {
  RoleInfo,
  Plot,
  Machine,
  Operator,
  RelayItem,
  TimelineEntry
} from '../types';

export const ROLES: RoleInfo[] = [
  {
    id: 'director',
    name: '合作社理事',
    description: '查看整体进度、异常统计、补贴合规',
    avatar: '👨‍💼',
    loginId: 'lsh001'
  },
  {
    id: 'dispatcher',
    name: '调度员',
    description: '安排作业、审批油料、登记维修、回访跟进',
    avatar: '👩‍💻',
    loginId: 'ddy001'
  },
  {
    id: 'operator',
    name: '机手',
    description: '确认作业、报工报晚、提交维修申请、领取油料',
    avatar: '👨‍🌾',
    loginId: 'js001'
  }
];

export const PLOTS: Plot[] = [
  { id: 'P001', code: 'N-D-001', name: '东北地块3号', area: 128, village: '王家村', plannedDate: '2026-05-20', actualDate: '2026-05-20', progress: 100, crop: '玉米' },
  { id: 'P002', code: 'N-D-002', name: '东北地块5号', area: 96, village: '李家村', plannedDate: '2026-05-21', actualDate: '2026-05-22', progress: 80, crop: '玉米' },
  { id: 'P003', code: 'S-X-003', name: '西乡地块8号', area: 72, village: '张家庄', plannedDate: '2026-05-22', actualDate: '2026-05-23', progress: 45, crop: '小麦' },
  { id: 'P004', code: 'N-D-004', name: '东北地块12号', area: 156, village: '赵家村', plannedDate: '2026-05-23', progress: 0, crop: '玉米' },
  { id: 'P005', code: 'S-X-005', name: '西乡地块15号', area: 88, village: '周家屯', plannedDate: '2026-05-24', progress: 0, crop: '大豆' },
  { id: 'P006', code: 'N-D-006', name: '东北地块18号', area: 110, village: '孙家庄', plannedDate: '2026-05-25', progress: 0, crop: '玉米' }
];

export const MACHINES: Machine[] = [
  { id: 'M01', plate: '农机A-00123', model: '东方红LX954', hours: 1280, status: 'working', operatorId: 'OP01' },
  { id: 'M02', plate: '农机A-00456', model: '约翰迪尔1204', hours: 860, status: 'repairing', operatorId: 'OP02' },
  { id: 'M03', plate: '农机A-00789', model: '雷沃M1104', hours: 1540, status: 'idle', operatorId: 'OP03' },
  { id: 'M04', plate: '农机A-00321', model: '常发CFK904', hours: 620, status: 'idle', operatorId: 'OP01' }
];

export const OPERATORS: Operator[] = [
  { id: 'OP01', name: '张建国', phone: '138****2341', license: 'G2 20230512' },
  { id: 'OP02', name: '李海涛', phone: '139****5678', license: 'G2 20220823' },
  { id: 'OP03', name: '王铁柱', phone: '137****9012', license: 'G2 20210315' }
];

const now = () => new Date().toISOString();

export const SEED_RELAYS: RelayItem[] = [
  {
    id: 'R001',
    plotId: 'P001',
    machineId: 'M01',
    operatorId: 'OP01',
    taskType: '玉米播种',
    status: 'completed',
    exceptionType: 'none',
    fuelApproved: {
      id: 'F001', relayId: 'R001', type: 'diesel', amountLiters: 80,
      odometerHours: 1250, issuedBy: 'ddy001', issuedAt: '2026-05-19T09:00:00Z',
      note: '按128亩计划，每百亩62升核定'
    },
    fuelIssued: {
      id: 'F002', relayId: 'R001', type: 'diesel', amountLiters: 80,
      odometerHours: 1252, issuedBy: 'ddy001', issuedAt: '2026-05-19T14:30:00Z'
    },
    subsidy: {
      id: 'S001', relayId: 'R001',
      materials: ['作业确认单', '油料领用凭证', '地块照片×4', 'GPS轨迹'],
      collected: true, collectedAt: '2026-05-21T10:00:00Z'
    },
    createdAt: '2026-05-18T08:00:00Z',
    updatedAt: '2026-05-21T10:00:00Z',
    timeline: [
      { at: '2026-05-18T08:00:00Z', role: 'dispatcher', action: '调度员创建作业任务', note: '东北地块3号·玉米播种·128亩' },
      { at: '2026-05-19T09:00:00Z', role: 'dispatcher', action: '油料审批通过', note: '柴油80升，按每百亩62升核定' },
      { at: '2026-05-19T14:30:00Z', role: 'operator', action: '机手领取油料', note: '油表确认，出库签字' },
      { at: '2026-05-20T06:00:00Z', role: 'operator', action: '开始作业' },
      { at: '2026-05-20T18:00:00Z', role: 'operator', action: '作业完成', note: '128亩全部播种完毕' },
      { at: '2026-05-21T10:00:00Z', role: 'dispatcher', action: '补贴材料收齐', note: '四项材料齐全，已归档' }
    ]
  },
  {
    id: 'R002',
    plotId: 'P002',
    machineId: 'M02',
    operatorId: 'OP02',
    taskType: '玉米播种',
    status: 'awaiting_repair',
    exceptionType: 'late_report',
    exceptionDesc: '机手5月21日晚报作业只完成30%，当日未完工，22日继续作业时播种机离合器异响',
    fuelApproved: {
      id: 'F003', relayId: 'R002', type: 'diesel', amountLiters: 60,
      odometerHours: 840, issuedBy: 'ddy001', issuedAt: '2026-05-20T09:00:00Z',
      note: '96亩核定59.5升，取整60升'
    },
    fuelIssued: {
      id: 'F004', relayId: 'R002', type: 'diesel', amountLiters: 60,
      odometerHours: 842, issuedBy: 'ddy001', issuedAt: '2026-05-20T15:00:00Z'
    },
    repair: {
      id: 'REP001', relayId: 'R002', category: '播种机·离合器',
      description: '作业中离合器发出异响，疑似压板弹簧断裂，需拆检更换',
      parts: ['离合器压板总成', '弹簧套件×2'],
      cost: 0, reportedBy: 'js002', reportedAt: '2026-05-22T10:30:00Z',
      followUpNeeded: true, status: 'pending'
    },
    createdAt: '2026-05-19T08:00:00Z',
    updatedAt: '2026-05-22T10:30:00Z',
    timeline: [
      { at: '2026-05-19T08:00:00Z', role: 'dispatcher', action: '调度员创建作业任务', note: '东北地块5号·玉米播种·96亩' },
      { at: '2026-05-20T09:00:00Z', role: 'dispatcher', action: '油料审批通过', note: '柴油60升' },
      { at: '2026-05-20T15:00:00Z', role: 'operator', action: '机手领取油料' },
      { at: '2026-05-21T06:00:00Z', role: 'operator', action: '开始作业' },
      { at: '2026-05-21T19:00:00Z', role: 'operator', action: '进度报晚', note: '因土质偏硬，当日仅完成30%（约29亩），申请次日继续' },
      { at: '2026-05-22T10:30:00Z', role: 'operator', action: '提交维修申请', note: '播种机离合器异响，已停驶等待处理' }
    ]
  },
  {
    id: 'R003',
    plotId: 'P003',
    machineId: 'M03',
    operatorId: 'OP03',
    taskType: '小麦收割',
    status: 'subsidy_pending',
    exceptionType: 'incomplete_subsidy',
    exceptionDesc: '作业已完成但GPS轨迹导出失败、地块照片仅2张，补贴材料不齐无法归档',
    fuelApproved: {
      id: 'F005', relayId: 'R003', type: 'diesel', amountLiters: 50,
      odometerHours: 1520, issuedBy: 'ddy001', issuedAt: '2026-05-22T08:00:00Z'
    },
    fuelIssued: {
      id: 'F006', relayId: 'R003', type: 'diesel', amountLiters: 50,
      odometerHours: 1522, issuedBy: 'ddy001', issuedAt: '2026-05-22T14:00:00Z'
    },
    subsidy: {
      id: 'S002', relayId: 'R003',
      materials: ['作业确认单', '油料领用凭证'],
      collected: false, note: '缺GPS轨迹、地块照片'
    },
    createdAt: '2026-05-21T08:00:00Z',
    updatedAt: '2026-05-23T20:00:00Z',
    timeline: [
      { at: '2026-05-21T08:00:00Z', role: 'dispatcher', action: '调度员创建作业任务', note: '西乡地块8号·小麦收割·72亩' },
      { at: '2026-05-22T08:00:00Z', role: 'dispatcher', action: '油料审批通过' },
      { at: '2026-05-22T14:00:00Z', role: 'operator', action: '机手领取油料' },
      { at: '2026-05-23T06:00:00Z', role: 'operator', action: '开始作业' },
      { at: '2026-05-23T19:00:00Z', role: 'operator', action: '作业完成', note: '72亩收割完毕' },
      { at: '2026-05-23T20:00:00Z', role: 'dispatcher', action: '补贴材料登记', note: 'GPS轨迹导出失败，地块照片未上传完整，标记异常待补' }
    ]
  },
  {
    id: 'R004',
    plotId: 'P004',
    machineId: 'M01',
    operatorId: 'OP01',
    taskType: '玉米播种',
    status: 'fuel_approved',
    exceptionType: 'none',
    fuelApproved: {
      id: 'F007', relayId: 'R004', type: 'diesel', amountLiters: 97,
      odometerHours: 1280, issuedBy: 'ddy001', issuedAt: '2026-05-24T09:00:00Z',
      note: '156亩·每百亩62升=96.7升，取整97升'
    },
    createdAt: '2026-05-23T08:00:00Z',
    updatedAt: '2026-05-24T09:00:00Z',
    timeline: [
      { at: '2026-05-23T08:00:00Z', role: 'dispatcher', action: '调度员创建作业任务', note: '东北地块12号·玉米播种·156亩' },
      { at: '2026-05-24T09:00:00Z', role: 'dispatcher', action: '油料审批通过', note: '柴油97升，等待机手领取' }
    ]
  },
  {
    id: 'R005',
    plotId: 'P005',
    machineId: 'M04',
    operatorId: 'OP01',
    taskType: '大豆播种',
    status: 'pending_dispatch',
    exceptionType: 'none',
    createdAt: '2026-05-25T08:00:00Z',
    updatedAt: '2026-05-25T08:00:00Z',
    timeline: [
      { at: '2026-05-25T08:00:00Z', role: 'dispatcher', action: '调度员创建作业任务', note: '西乡地块15号·大豆播种·88亩，待审批油料' }
    ]
  },
  {
    id: 'R006',
    plotId: 'P006',
    machineId: 'M02',
    operatorId: 'OP02',
    taskType: '玉米播种',
    status: 'repair_done',
    exceptionType: 'disconnected',
    exceptionDesc: '维修已完成但回访发现作业未续、补贴未启动，维修→回访→补贴链路脱节',
    repair: {
      id: 'REP002', relayId: 'R006', category: '液压系统',
      description: '液压油管渗漏，更换密封圈和油管接头',
      parts: ['密封圈×3', '油管接头×1'],
      cost: 180, reportedBy: 'js002', reportedAt: '2026-05-18T11:00:00Z',
      repairedBy: 'ddy001', repairedAt: '2026-05-18T16:00:00Z',
      followUpNeeded: true, status: 'follow_up'
    },
    createdAt: '2026-05-17T08:00:00Z',
    updatedAt: '2026-05-18T16:00:00Z',
    timeline: [
      { at: '2026-05-17T08:00:00Z', role: 'dispatcher', action: '调度员创建作业任务', note: '东北地块18号·玉米播种·110亩' },
      { at: '2026-05-18T11:00:00Z', role: 'operator', action: '机手提交维修申请', note: '液压油管渗漏' },
      { at: '2026-05-18T16:00:00Z', role: 'dispatcher', action: '维修完成', note: '更换密封圈和接头，需回访确认作业恢复' }
    ]
  }
];

export const STATUS_LABELS: Record<string, string> = {
  pending_dispatch: '待调度',
  fuel_approved: '油料已批待领',
  fuel_issued: '油料已领',
  in_operation: '作业中',
  awaiting_repair: '待维修',
  repair_in_progress: '维修中',
  repair_done: '维修完成',
  subsidy_pending: '待补贴归档',
  completed: '已完成',
  exception_late: '进度报晚',
  exception_incomplete: '补贴材料不齐',
  exception_disconnected: '链路脱节'
};

export const EXCEPTION_LABELS: Record<string, string> = {
  none: '无异常',
  late_report: '进度报晚',
  incomplete_subsidy: '补贴材料不齐',
  disconnected: '链路脱节',
  repair_delay: '维修延迟'
};

export const FUEL_TYPE_LABELS: Record<string, string> = {
  diesel: '柴油',
  gasoline: '汽油',
  oil: '机油'
};
