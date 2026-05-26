import type { Operator, Plot, Task, Incident, User } from '../types';

export const users: User[] = [
  { id: 'u_director', name: '王理事', role: 'director', phone: '138****0001' },
  { id: 'u_dispatcher', name: '李调度', role: 'dispatcher', phone: '138****0002' },
  { id: 'u_op_01', name: '张师傅', role: 'operator', phone: '139****1001' },
  { id: 'u_op_02', name: '刘师傅', role: 'operator', phone: '139****1002' },
  { id: 'u_op_03', name: '陈师傅', role: 'operator', phone: '139****1003' },
];

export const operators: Operator[] = [
  { id: 'u_op_01', name: '张师傅', phone: '139****1001', machineType: 'tractor',   machineNo: '皖01-A8821', status: 'idle',        location: '社本部' },
  { id: 'u_op_02', name: '刘师傅', phone: '139****1002', machineType: 'combine',   machineNo: '皖01-C7712', status: 'working',     location: '东圩村' },
  { id: 'u_op_03', name: '陈师傅', phone: '139****1003', machineType: 'sprayer',   machineNo: '皖01-P3358', status: 'maintenance', location: '修理车间' },
];

export const plots: Plot[] = [
  { id: 'p_001', name: '东圩村一组大田', area: 120, crop: '小麦', location: '东圩村一组', distance: 8.2 },
  { id: 'p_002', name: '西湾村连片田', area: 240, crop: '水稻', location: '西湾村', distance: 14.6 },
  { id: 'p_003', name: '南湖圩田',    area: 85,  crop: '油菜', location: '南湖村', distance: 22.3 },
  { id: 'p_004', name: '北岗旱地',    area: 60,  crop: '玉米', location: '北岗村', distance: 31.8 },
  { id: 'p_005', name: '中心育苗棚',  area: 12,  crop: '秧苗', location: '社本部', distance: 0.5 },
];

const now = Date.now();
const h = (offset: number) => new Date(now + offset * 3600 * 1000).toISOString();

export const tasks: Task[] = [
  {
    id: 't_1001',
    plotId: 'p_001',
    crop: '小麦',
    area: 120,
    machineType: 'tractor',
    expectedAt: h(2),
    durationHours: 5,
    operatorId: 'u_op_01',
    status: 'incident',
    prevStatus: 'assigned',
    notes: '需在上午完成旋耕，下午要接下一个村。',
    timeline: [
      { at: h(-8), actor: '李调度', action: '创建作业预约' },
      { at: h(-2), actor: '李调度', action: '派单给机手', note: '优先保障东圩村收麦' },
      { at: h(-1), actor: '李调度', action: '标记为异常' },
    ],
  },
  {
    id: 't_1002',
    plotId: 'p_002',
    crop: '水稻',
    area: 240,
    machineType: 'combine',
    expectedAt: h(-4),
    durationHours: 10,
    operatorId: 'u_op_02',
    status: 'incident',
    prevStatus: 'in_progress',
    notes: '连续作业，午饭在车上。',
    timeline: [
      { at: h(-30), actor: '李调度', action: '创建作业预约' },
      { at: h(-10), actor: '李调度', action: '派单给机手' },
      { at: h(-4), actor: '刘师傅', action: '开始作业', note: '地块边界清晰' },
      { at: h(-1), actor: '刘师傅', action: '上报地块进度 60%' },
      { at: h(-1), actor: '刘师傅', action: '标记为异常' },
    ],
  },
  {
    id: 't_1003',
    plotId: 'p_003',
    crop: '油菜',
    area: 85,
    machineType: 'combine',
    expectedAt: h(20),
    durationHours: 4,
    operatorId: undefined,
    status: 'pending',
    notes: '油菜倒伏较严重，需用割台。',
    timeline: [
      { at: h(-5), actor: '王理事', action: '登记预约' },
    ],
  },
  {
    id: 't_1004',
    plotId: 'p_004',
    crop: '玉米',
    area: 60,
    machineType: 'sprayer',
    expectedAt: h(8),
    durationHours: 3,
    operatorId: 'u_op_03',
    status: 'incident',
    prevStatus: 'assigned',
    notes: '维修中，可能延误。',
    timeline: [
      { at: h(-20), actor: '李调度', action: '派单给机手' },
      { at: h(-6), actor: '陈师傅', action: '上报维修异常：喷雾泵损坏' },
      { at: h(-6), actor: '陈师傅', action: '标记为异常' },
    ],
  },
  {
    id: 't_1005',
    plotId: 'p_005',
    crop: '秧苗',
    area: 12,
    machineType: 'transplanter',
    expectedAt: h(30),
    durationHours: 2,
    operatorId: undefined,
    status: 'pending',
    notes: '希望尽快机插。',
    timeline: [
      { at: h(-12), actor: '李调度', action: '创建作业预约' },
    ],
  },
];

export const incidents: Incident[] = [
  {
    id: 'i_2001',
    taskId: 't_1004',
    type: 'repair',
    severity: 'high',
    title: '喷雾泵损坏',
    description: '作业前检查时发现喷雾泵压力不足，配件在路上，预计 4 小时后到达。',
    reporterId: 'u_op_03',
    reportedAt: h(-6),
    resolved: false,
    timeline: [
      { at: h(-6), actor: '陈师傅', action: '上报维修异常', note: '喷雾泵压力不足' },
    ],
    attachments: ['维修清单.pdf', '现场照片.jpg'],
  },
  {
    id: 'i_2002',
    taskId: 't_1002',
    type: 'progress',
    severity: 'medium',
    title: '地块进度报晚',
    description: '下午 3 点应完成 80%，当前仅 60%。原因：中途下雨 1 小时。',
    reporterId: 'u_op_02',
    reportedAt: h(-2),
    resolved: false,
    timeline: [
      { at: h(-2), actor: '刘师傅', action: '上报进度延迟', note: '中途下雨 1 小时' },
    ],
  },
  {
    id: 'i_2003',
    taskId: 't_1001',
    type: 'subsidy',
    severity: 'medium',
    title: '补贴材料不齐',
    description: '缺少《农机作业补贴申请表》盖章页，需要村委会先盖。',
    reporterId: 'u_dispatcher',
    reportedAt: h(-3),
    resolved: false,
    timeline: [
      { at: h(-3), actor: '李调度', action: '上报材料不齐', note: '等待村委会盖章' },
    ],
    attachments: ['申请表（未盖章）.pdf'],
  },
  {
    id: 'i_2004',
    taskId: 't_1003',
    type: 'followup',
    severity: 'low',
    title: '客户回访未接通',
    description: '客户预约油菜收割后希望回访作业质量，电话未接通。',
    reporterId: 'u_director',
    reportedAt: h(-1),
    resolved: false,
    timeline: [
      { at: h(-1), actor: '王理事', action: '上报回访未接通' },
    ],
  },
];
