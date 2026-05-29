import type { Training } from '@/types';

export const mockTrainings: Training[] = [
  {
    id: 'training-A001',
    riderId: 'rider-001',
    riderName: '张伟',
    assessmentId: 'assessment-A001',
    orderId: 'order-A001',
    title: '配送超时专项培训',
    type: 'mandatory',
    description: '因订单A001超时配送，需参加配送超时专项培训',
    content: `一、培训目标\n掌握配送超时的预防措施和应急处理方法，提升配送准时率。\n\n二、核心内容\n1. 配送前准备\n   - 提前查看订单地址和商家位置\n   - 合理规划配送路线，避开拥堵路段\n   - 检查车辆电量和装备\n\n2. 取餐环节\n   - 到达商家后第一时间确认出餐进度\n   - 如遇出餐慢，及时联系用户说明情况\n   - 必要时联系调度改派\n\n3. 配送环节\n   - 保持匀速行驶，注意交通安全\n   - 遇到突发情况（堵车、坏车）立即上报\n   - 提前联系用户确认送达时间\n\n4. 超时应急预案\n   - 预计超时前5分钟联系用户致歉\n   - 说明预计到达时间和原因\n   - 同步告知调度员，协调后续处理\n\n三、考核标准\n培训后30天内，超时率需降至3%以下。`,
    status: 'pending',
    dueDate: '2026-06-04T23:59:59Z',
    completedAt: null,
    score: null,
    createdAt: '2026-05-28T20:00:00Z',
  },
  {
    id: 'training-D004',
    riderId: 'rider-002',
    riderName: '李娜',
    assessmentId: 'assessment-D004',
    orderId: 'order-D004',
    title: '配送超时专项培训',
    type: 'mandatory',
    description: '因订单D004超时配送，需参加配送超时专项培训',
    content: `一、培训目标\n掌握配送超时的预防措施和应急处理方法，提升配送准时率。\n\n二、核心内容\n1. 配送前准备\n   - 提前查看订单地址和商家位置\n   - 合理规划配送路线，避开拥堵路段\n   - 检查车辆电量和装备\n\n2. 取餐环节\n   - 到达商家后第一时间确认出餐进度\n   - 如遇出餐慢，及时联系用户说明情况\n   - 必要时联系调度改派\n\n3. 配送环节\n   - 保持匀速行驶，注意交通安全\n   - 遇到突发情况（堵车、坏车）立即上报\n   - 提前联系用户确认送达时间\n\n4. 超时应急预案\n   - 预计超时前5分钟联系用户致歉\n   - 说明预计到达时间和原因\n   - 同步告知调度员，协调后续处理\n\n三、考核标准\n培训后30天内，超时率需降至3%以下。`,
    status: 'pending',
    dueDate: '2026-06-03T23:59:59Z',
    completedAt: null,
    score: null,
    createdAt: '2026-05-28T10:00:00Z',
  },
  {
    id: 'training-D005',
    riderId: 'rider-002',
    riderName: '李娜',
    assessmentId: 'assessment-D005',
    orderId: 'order-D005',
    title: '配送超时专项培训',
    type: 'mandatory',
    description: '因订单D005超时配送，需参加配送超时专项培训',
    content: '培训内容同培训-D004...',
    status: 'completed',
    dueDate: '2026-06-02T23:59:59Z',
    completedAt: '2026-05-27T14:30:00Z',
    score: 92,
    createdAt: '2026-05-26T16:30:00Z',
  },
  {
    id: 'training-D006',
    riderId: 'rider-002',
    riderName: '李娜',
    assessmentId: 'assessment-D006',
    orderId: 'order-D006',
    title: '服务投诉应对与预防培训',
    type: 'mandatory',
    description: '因订单D006用户投诉，需参加服务投诉应对培训',
    content: `一、培训目标\n了解用户投诉的常见原因，掌握正确的沟通技巧和处理方法，降低投诉率。\n\n二、核心内容\n1. 常见投诉类型\n   - 配送超时\n   - 餐品撒漏/损坏\n   - 服务态度问题\n   - 联系不上骑手\n\n2. 沟通技巧\n   - 使用礼貌用语：您好、谢谢、抱歉、再见\n   - 遇到用户不满时先倾听，再解释\n   - 不与用户争执，遇到问题先致歉\n\n3. 特殊情况处理\n   - 用户不在家：电话联系确认，可放至指定位置并拍照\n   - 用户要求改地址：判断距离，远距离需联系调度\n   - 餐品撒漏：立即致歉，联系商家和调度处理\n\n4. 预防措施\n   - 配送前检查餐品包装\n   - 取餐时核对订单信息\n   - 保持电话畅通，及时回复用户消息\n\n三、考核标准\n培训后30天内，实现零有效投诉。`,
    status: 'completed',
    dueDate: '2026-06-01T23:59:59Z',
    completedAt: '2026-05-26T11:00:00Z',
    score: 88,
    createdAt: '2026-05-25T19:30:00Z',
  },
  {
    id: 'training-D-special',
    riderId: 'rider-002',
    riderName: '李娜',
    assessmentId: null,
    orderId: 'order-D007',
    title: '配送超时专项培训（强化版）',
    type: 'remedial',
    description: '因多次配送超时，需参加强化培训',
    content: `您因"配送超时"问题已被考核3次，需要参加强化培训。\n\n一、培训目标\n深入分析超时原因，制定个性化改进方案。\n\n二、核心内容\n1. 个人超时案例分析\n   - 5月20日：超时8分钟，扣4分\n   - 5月22日：超时10分钟，扣5分\n   - 5月26日：超时13分钟，扣5分\n   - 5月28日：超时15分钟，待审核\n\n2. 问题根源分析\n   - 路线规划问题：多次绕路，未使用导航最优路线\n   - 取餐时机：未提前确认出餐时间\n   - 沟通问题：超时前未提前告知用户\n\n3. 改进计划\n   - 每日出发前查看当日订单分布\n   - 取餐前10分钟联系商家确认\n   - 预计超时前5分钟必须联系用户\n\n4. 特别说明：\n- 本次培训需完成案例分析作业\n- 培训后需通过模拟场景考核\n- 如30天内再次出现同类问题，将加重处罚`,
    status: 'in_progress',
    dueDate: '2026-06-06T23:59:59Z',
    completedAt: null,
    score: null,
    createdAt: '2026-05-28T12:00:00Z',
  },
  {
    id: 'training-history-001',
    riderId: 'rider-002',
    riderName: '李娜',
    assessmentId: 'assessment-D003-history2',
    orderId: 'order-D003',
    title: '配送超时专项培训',
    type: 'mandatory',
    description: '历史培训记录',
    content: '标准超时培训内容...',
    status: 'completed',
    dueDate: '2026-05-29T23:59:59Z',
    completedAt: '2026-05-24T16:00:00Z',
    score: 85,
    createdAt: '2026-05-22T20:30:00Z',
  },
];

export function getTrainingById(id: string): Training | undefined {
  return mockTrainings.find(t => t.id === id);
}

export function getTrainingsByRider(riderId: string): Training[] {
  return mockTrainings.filter(t => t.riderId === riderId);
}

export function getTrainingsByAssessment(assessmentId: string): Training[] {
  return mockTrainings.filter(t => t.assessmentId === assessmentId);
}

export function getTrainingsByStatus(status: Training['status']): Training[] {
  return mockTrainings.filter(t => t.status === status);
}

export function getPendingTrainings(): Training[] {
  return mockTrainings.filter(t => t.status === 'pending' || t.status === 'in_progress');
}

export function getOverdueTrainings(): Training[] {
  const now = new Date();
  return mockTrainings.filter(
    t => (t.status === 'pending' || t.status === 'in_progress') && new Date(t.dueDate) < now
  );
}
