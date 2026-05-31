import type { WorkOrder, User, DashboardStats, PartInventory, PartLock, CustomerReceipt, RepairProgress, TimelineEntry } from '~/types/workorder';

export const mockUsers: User[] = [
  { id: '1', name: '张经理', role: 'manager', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager' },
  { id: '2', name: '李顾问', role: 'consultant', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=consultant' },
  { id: '3', name: '王技师', role: 'technician', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=technician' },
];

export const mockPartInventory: PartInventory[] = [
  { id: 'inv1', partCode: 'MOV-001', partName: '机芯轴承组件', stock: 15, locked: 3, unit: '套', price: 680 },
  { id: 'inv2', partCode: 'MOV-002', partName: '擒纵机构', stock: 8, locked: 2, unit: '套', price: 1280 },
  { id: 'inv3', partCode: 'CAS-001', partName: '表冠密封圈', stock: 50, locked: 5, unit: '个', price: 45 },
  { id: 'inv4', partCode: 'CAS-002', partName: '蓝宝石表镜 40mm', stock: 12, locked: 1, unit: '片', price: 380 },
  { id: 'inv5', partCode: 'STR-001', partName: '不锈钢表带 20mm', stock: 20, locked: 2, unit: '条', price: 450 },
  { id: 'inv6', partCode: 'STR-002', partName: '真皮表带 20mm', stock: 25, locked: 0, unit: '条', price: 280 },
  { id: 'inv7', partCode: 'BAT-001', partName: '手表电池 SR920SW', stock: 100, locked: 0, unit: '粒', price: 35 },
  { id: 'inv8', partCode: 'LUB-001', partName: '机芯润滑油', stock: 30, locked: 0, unit: '瓶', price: 120 },
];

function generateId(prefix: string, index: number): string {
  return `${prefix}${index}`;
}

function createTimelineEntry(
  id: string,
  action: string,
  operator: string,
  operatorRole: 'manager' | 'consultant' | 'technician',
  remark?: string,
  offsetHours: number = 0,
  baseTime?: Date
): TimelineEntry {
  const time = baseTime ? new Date(baseTime.getTime() + offsetHours * 3600000) : new Date(Date.now() + offsetHours * 3600000);
  return {
    id,
    action,
    operator,
    operatorRole,
    remark,
    createdAt: time.toISOString(),
  };
}

function createProgressEntry(
  id: string,
  workOrderId: string,
  status: 'inspecting' | 'parts_preparing' | 'repairing' | 'testing' | 'completed',
  description: string,
  operator: string,
  operatorRole: 'manager' | 'consultant' | 'technician',
  offsetHours: number,
  baseTime: Date
): RepairProgress {
  return {
    id,
    workOrderId,
    status,
    description,
    operator,
    operatorRole,
    createdAt: new Date(baseTime.getTime() + offsetHours * 3600000).toISOString(),
  };
}

function createReceipt(
  workOrderId: string,
  confirmed: boolean,
  pickedUp: boolean,
  satisfaction?: number
): CustomerReceipt {
  return {
    id: `receipt-${workOrderId}`,
    workOrderId,
    confirmed,
    pickedUp,
    satisfaction,
  };
}

function createMockWorkOrders(): WorkOrder[] {
  const customers = [
    { id: 'c1', name: '陈先生', phone: '13800138001', email: 'chen@example.com', address: '北京市朝阳区建国路88号' },
    { id: 'c2', name: '刘女士', phone: '13900139002', email: 'liu@example.com', address: '上海市浦东新区陆家嘴环路' },
    { id: 'c3', name: '王先生', phone: '13700137003', email: 'wang@example.com', address: '广州市天河区珠江新城' },
    { id: 'c4', name: '赵女士', phone: '13600136004', email: 'zhao@example.com', address: '深圳市南山区科技园' },
    { id: 'c5', name: '孙先生', phone: '13500135005', email: 'sun@example.com', address: '杭州市西湖区文三路' },
    { id: 'c6', name: '周女士', phone: '13400134006', email: 'zhou@example.com', address: '成都市武侯区天府大道' },
  ];

  const watches = [
    { brand: '劳力士', model: '潜航者型', serial: 'SN12345678' },
    { brand: '欧米茄', model: '海马系列', serial: 'SN87654321' },
    { brand: '卡地亚', model: '蓝气球', serial: 'SN23456789' },
    { brand: '万国', model: '葡萄牙系列', serial: 'SN98765432' },
    { brand: '浪琴', model: '名匠系列', serial: 'SN34567890' },
    { brand: '天梭', model: '力洛克', serial: 'SN09876543' },
    { brand: '美度', model: '贝伦赛丽', serial: 'SN45678901' },
    { brand: '梅花', model: '宇宙系列', serial: 'SN10987654' },
    { brand: '精工', model: 'Presage', serial: 'SN56789012' },
  ];

  const problems = [
    '走时不准，每天快约5分钟',
    '表冠无法正常旋入，防水性能受损',
    '表盘进水起雾，需要清洗保养',
    '自动上链效率低下，手动上链正常',
    '表带扣损坏，需要更换',
    '表镜刮花，影响美观',
    '需要全面保养洗油，购买5年未保养',
    '夜光涂层脱落，需要重涂',
    '计时功能失灵，按钮无反应',
    '日历跳转异常，中午12点跳转',
  ];

  const inspectionResults = [
    '经检测，机芯摆幅偏低，需要清洗保养并更换磨损齿轮',
    '表冠螺纹磨损，需要更换表冠及防水圈',
    '进水情况较轻，机芯未生锈，清洗烘干即可',
    '自动陀轴承磨损，需要更换轴承组件',
    '表扣弹簧断裂，需要更换表扣',
    '表镜划痕较深，需要更换蓝宝石表镜',
    '机芯油泥严重，需要全面拆洗加油',
    '夜光涂层老化，需要重新涂覆夜光材料',
    '计时齿轮组卡滞，需要清理润滑',
    '日历拨轮错位，需要重新安装调整',
  ];

  const statuses: Array<{
    status: WorkOrder['status'];
    timelineSteps: number;
    hasQuote: boolean;
    hasParts: boolean;
    hasProgress: number;
    receipt: { confirmed: boolean; pickedUp: boolean; satisfaction?: number };
  }> = [
    { status: 'pending_review', timelineSteps: 1, hasQuote: false, hasParts: false, hasProgress: 0, receipt: { confirmed: false, pickedUp: false } },
    { status: 'quoting', timelineSteps: 3, hasQuote: false, hasParts: true, hasProgress: 1, receipt: { confirmed: false, pickedUp: false } },
    { status: 'pending_approval', timelineSteps: 4, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'rejected', timelineSteps: 5, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'pending_confirm', timelineSteps: 6, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'customer_rejected', timelineSteps: 7, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'repairing', timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 4, receipt: { confirmed: true, pickedUp: false } },
    { status: 'repairing', timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 3, receipt: { confirmed: true, pickedUp: false } },
    { status: 'completed', timelineSteps: 10, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: false } },
    { status: 'picked_up', timelineSteps: 12, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: true, satisfaction: 5 } },
    { status: 'picked_up', timelineSteps: 12, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: true, satisfaction: 4 } },
    { status: 'pending_approval', timelineSteps: 4, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'pending_confirm', timelineSteps: 6, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'repairing', timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 4, receipt: { confirmed: true, pickedUp: false } },
    { status: 'pending_review', timelineSteps: 1, hasQuote: false, hasParts: false, hasProgress: 0, receipt: { confirmed: false, pickedUp: false } },
    { status: 'quoting', timelineSteps: 3, hasQuote: false, hasParts: true, hasProgress: 1, receipt: { confirmed: false, pickedUp: false } },
    { status: 'rejected', timelineSteps: 5, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: 'completed', timelineSteps: 10, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: false } },
  ];

  const priorities = ['low', 'medium', 'high', 'urgent'] as const;
  const partConfigs = [
    [{ partName: '机芯轴承组件', partCode: 'MOV-001', quantity: 1 }],
    [{ partName: '擒纵机构', partCode: 'MOV-002', quantity: 1 }],
    [{ partName: '表冠密封圈', partCode: 'CAS-001', quantity: 2 }],
    [{ partName: '蓝宝石表镜 40mm', partCode: 'CAS-002', quantity: 1 }],
    [{ partName: '不锈钢表带 20mm', partCode: 'STR-001', quantity: 1 }],
    [{ partName: '机芯润滑油', partCode: 'LUB-001', quantity: 1 }],
  ];

  const now = new Date();
  const workOrders: WorkOrder[] = [];

  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length];
    const watch = watches[i % watches.length];
    const problem = problems[i % problems.length];
    const inspectionResult = inspectionResults[i % inspectionResults.length];
    const statusConfig = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const partConfig = partConfigs[i % partConfigs.length];
    const daysAgo = Math.floor(Math.random() * 14);
    const receivedAt = new Date(now.getTime() - daysAgo * 86400000);

    const timeline: TimelineEntry[] = [];
    const progress: RepairProgress[] = [];
    let parts: PartLock[] = [];
    let quote;

    const timelines = [
      createTimelineEntry(`tl${i}-1`, '寄修登记', '李顾问', 'consultant', '客户送修，已登记基本信息', 0, receivedAt),
      createTimelineEntry(`tl${i}-2`, '开始检测', '王技师', 'technician', '已接收手表，开始检测', 2, receivedAt),
      createTimelineEntry(`tl${i}-3`, '检测完成', '王技师', 'technician', inspectionResult, 6, receivedAt),
      createTimelineEntry(`tl${i}-4`, '锁定配件', '王技师', 'technician', '已锁定所需维修配件', 7, receivedAt),
      createTimelineEntry(`tl${i}-5`, '提交报价', '王技师', 'technician', '', 8, receivedAt),
      createTimelineEntry(`tl${i}-6`, '审批通过', '张经理', 'manager', '报价合理，同意', 10, receivedAt),
      createTimelineEntry(`tl${i}-7`, '发送客户确认', '李顾问', 'consultant', '已通过短信发送报价确认', 12, receivedAt),
      createTimelineEntry(`tl${i}-8`, '客户确认', '李顾问', 'consultant', '客户电话确认同意维修', 24, receivedAt),
      createTimelineEntry(`tl${i}-9`, '开始维修', '王技师', 'technician', '开始执行维修工作', 26, receivedAt),
      createTimelineEntry(`tl${i}-10`, '维修完成', '王技师', 'technician', '维修完成，检测通过', 72, receivedAt),
      createTimelineEntry(`tl${i}-11`, '通知取件', '李顾问', 'consultant', '已通过短信通知客户取件', 74, receivedAt),
      createTimelineEntry(`tl${i}-12`, '客户取件', '李顾问', 'consultant', '客户已取表', 96, receivedAt),
    ];

    if (statusConfig.status === 'rejected') {
      timelines[5] = createTimelineEntry(`tl${i}-6`, '审批驳回', '张经理', 'manager', '报价过高，建议重新核算', 10, receivedAt);
    }

    if (statusConfig.status === 'customer_rejected') {
      timelines[7] = createTimelineEntry(`tl${i}-8`, '客户驳回', '李顾问', 'consultant', '客户认为报价过高，不同意维修', 24, receivedAt);
    }

    for (let j = 0; j < statusConfig.timelineSteps; j++) {
      timeline.push(timelines[j]);
    }

    if (statusConfig.hasParts) {
      parts = partConfig.map((p, idx) => ({
        id: `pl${i}-${idx}`,
        partName: p.partName,
        partCode: p.partCode,
        quantity: p.quantity,
        status: statusConfig.status === 'rejected' || statusConfig.status === 'customer_rejected' ? 'released' : 'locked',
        lockedBy: '3',
        lockedAt: new Date(receivedAt.getTime() + 7 * 3600000).toISOString(),
      }));
    }

    if (statusConfig.hasQuote) {
      const partsCost = partConfig.reduce((sum, p) => {
        const inv = mockPartInventory.find(i => i.partCode === p.partCode);
        return sum + (inv?.price || 0) * p.quantity;
      }, 0);
      const laborCost = 300 + Math.floor(Math.random() * 1500);
      const amount = partsCost + laborCost;

      quote = {
        id: `q${i}`,
        workOrderId: `wo${i + 1}`,
        amount,
        partsCost,
        laborCost,
        status: statusConfig.status === 'rejected' || statusConfig.status === 'customer_rejected' ? 'rejected' :
                statusConfig.status === 'pending_approval' || statusConfig.status === 'pending_confirm' ? 'submitted' : 'approved',
        remark: inspectionResult,
        createdAt: new Date(receivedAt.getTime() + 8 * 3600000).toISOString(),
        approvedAt: statusConfig.status !== 'rejected' && statusConfig.status !== 'pending_approval' && statusConfig.status !== 'quoting' && statusConfig.status !== 'pending_review'
          ? new Date(receivedAt.getTime() + 10 * 3600000).toISOString()
          : undefined,
      };

      if (timeline.length > 4) {
        timeline[4].remark = `报价金额: ¥${amount}`;
      }
    }

    if (statusConfig.hasProgress > 0) {
      const progressSteps = [
        createProgressEntry(`pg${i}-1`, `wo${i + 1}`, 'inspecting', '检测手表故障，评估维修方案', '王技师', 'technician', 2, receivedAt),
        createProgressEntry(`pg${i}-2`, `wo${i + 1}`, 'parts_preparing', '准备维修所需配件', '王技师', 'technician', 7, receivedAt),
        createProgressEntry(`pg${i}-3`, `wo${i + 1}`, 'repairing', '拆解机芯，清洗更换磨损零件', '王技师', 'technician', 26, receivedAt),
        createProgressEntry(`pg${i}-4`, `wo${i + 1}`, 'testing', '组装完成，进行精度测试', '王技师', 'technician', 60, receivedAt),
        createProgressEntry(`pg${i}-5`, `wo${i + 1}`, 'completed', '检测通过，维修完成', '王技师', 'technician', 72, receivedAt),
      ];

      for (let j = 0; j < statusConfig.hasProgress; j++) {
        progress.push(progressSteps[j]);
      }
    }

    const receipt = statusConfig.receipt.confirmed || statusConfig.receipt.pickedUp
      ? createReceipt(`wo${i + 1}`, statusConfig.receipt.confirmed, statusConfig.receipt.pickedUp, statusConfig.receipt.satisfaction)
      : undefined;

    if (receipt && statusConfig.receipt.pickedUp) {
      receipt.pickedUpAt = new Date(receivedAt.getTime() + 96 * 3600000).toISOString();
      receipt.pickedUpBy = customer.name;
      receipt.confirmedAt = new Date(receivedAt.getTime() + 24 * 3600000).toISOString();
      receipt.confirmedBy = customer.name;
      if (receipt.satisfaction) {
        receipt.satisfactionAt = new Date(receivedAt.getTime() + 100 * 3600000).toISOString();
        receipt.satisfactionComment = receipt.satisfaction >= 5 ? '维修质量很好，走时准确，服务态度好' : '整体满意，就是维修时间有点长';
      }
    }

    const order: WorkOrder = {
      id: `wo${i + 1}`,
      orderNo: `WS${String(now.getFullYear()).slice(-2)}${String(1001 + i).padStart(4, '0')}`,
      customer,
      watchBrand: watch.brand,
      watchModel: watch.model,
      watchSerial: watch.serial,
      problemDesc: problem,
      inspectionResult: statusConfig.timelineSteps > 2 ? inspectionResult : undefined,
      status: statusConfig.status,
      priority,
      receivedAt: receivedAt.toISOString(),
      expectedDate: statusConfig.status !== 'completed' && statusConfig.status !== 'picked_up'
        ? new Date(receivedAt.getTime() + 7 * 86400000).toISOString()
        : undefined,
      quote,
      parts,
      timeline,
      progress,
      receipt,
      assignedTo: '3',
      createdBy: '2',
      createdAt: receivedAt.toISOString(),
      updatedAt: timeline.length > 0 ? timeline[timeline.length - 1].createdAt : receivedAt.toISOString(),
      rejectReason: statusConfig.status === 'rejected' ? '报价过高，建议重新核算零件成本' : undefined,
      customerRejectReason: statusConfig.status === 'customer_rejected' ? '客户认为维修费用超过手表残值' : undefined,
    };

    workOrders.push(order);
  }

  return workOrders;
}

export let mockWorkOrders = createMockWorkOrders();

export function resetMockData() {
  mockWorkOrders = createMockWorkOrders();
}

const STATUS_GROUPS: Record<string, string[]> = {
  pending: ['pending_review', 'quoting', 'pending_approval', 'pending_confirm', 'repairing'],
  rejected: ['rejected', 'customer_rejected'],
  approval: ['pending_approval'],
  followup: ['picked_up'],
  completed: ['completed'],
  pending_confirm: ['pending_confirm'],
};

export function getDashboardStats(): DashboardStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingStatuses = STATUS_GROUPS.pending;
  const rejectedStatuses = STATUS_GROUPS.rejected;

  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const completedThisWeek = mockWorkOrders.filter(wo =>
    (wo.status === 'completed' || wo.status === 'picked_up') &&
    new Date(wo.updatedAt) >= weekAgo
  ).length;

  const totalProcessTime = mockWorkOrders
    .filter(wo => wo.status === 'picked_up')
    .reduce((sum, wo) => {
      const start = new Date(wo.createdAt).getTime();
      const end = new Date(wo.updatedAt).getTime();
      return sum + (end - start) / (1000 * 60 * 60 * 24);
    }, 0);

  const avgProcessTime = mockWorkOrders.filter(wo => wo.status === 'picked_up').length > 0
    ? Math.round((totalProcessTime / mockWorkOrders.filter(wo => wo.status === 'picked_up').length) * 10) / 10
    : 0;

  const needSatisfactionSurvey = mockWorkOrders.filter(wo =>
    wo.status === 'picked_up' && (!wo.receipt?.satisfaction || wo.receipt.satisfaction === 0)
  ).length;

  return {
    pending: mockWorkOrders.filter(wo => pendingStatuses.includes(wo.status)).length,
    rejected: mockWorkOrders.filter(wo => rejectedStatuses.includes(wo.status)).length,
    needReview: mockWorkOrders.filter(wo => wo.status === 'pending_approval').length,
    todayNew: mockWorkOrders.filter(wo => new Date(wo.createdAt) >= today).length,
    completedThisWeek,
    avgProcessTime,
    needFollowUp: needSatisfactionSurvey,
  };
}
