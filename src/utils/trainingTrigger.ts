import type { Assessment, Rider, TrainingTriggerResult, AssessmentType } from '@/types';
import { ASSESSMENT_RULES } from './assessmentRules';

export const TRAINING_TRIGGER_RULES = {
  singleDeductionThreshold: 5,
  monthlyDeductionThreshold: 12,
  repeatOffenseThreshold: 3,
};

export const TRAINING_CONTENT_TEMPLATES: Record<AssessmentType, { title: string; content: string }> = {
  timeout: {
    title: '配送超时专项培训',
    content: `一、培训目标
掌握配送超时的预防措施和应急处理方法，提升配送准时率。

二、核心内容
1. 配送前准备
   - 提前查看订单地址和商家位置
   - 合理规划配送路线，避开拥堵路段
   - 检查车辆电量和装备

2. 取餐环节
   - 到达商家后第一时间确认出餐进度
   - 如遇出餐慢，及时联系用户说明情况
   - 必要时联系调度改派

3. 配送环节
   - 保持匀速行驶，注意交通安全
   - 遇到突发情况（堵车、坏车）立即上报
   - 提前联系用户确认送达时间

4. 超时应急预案
   - 预计超时前5分钟联系用户致歉
   - 说明预计到达时间和原因
   - 同步告知调度员，协调后续处理

三、考核标准
培训后30天内，超时率需降至3%以下。`,
  },
  complaint: {
    title: '服务投诉应对与预防培训',
    content: `一、培训目标
了解用户投诉的常见原因，掌握正确的沟通技巧和处理方法，降低投诉率。

二、核心内容
1. 常见投诉类型
   - 配送超时
   - 餐品撒漏/损坏
   - 服务态度问题
   - 联系不上骑手

2. 沟通技巧
   - 使用礼貌用语：您好、谢谢、抱歉、再见
   - 遇到用户不满时先倾听，再解释
   - 不与用户争执，遇到问题先致歉

3. 特殊情况处理
   - 用户不在家：电话联系确认，可放至指定位置并拍照
   - 用户要求改地址：判断距离，远距离需联系调度
   - 餐品撒漏：立即致歉，联系商家和调度处理

4. 预防措施
   - 配送前检查餐品包装
   - 取餐时核对订单信息
   - 保持电话畅通，及时回复用户消息

三、考核标准
培训后30天内，实现零有效投诉。`,
  },
  violation: {
    title: '平台规则与合规操作培训',
    content: `一、培训目标
深入理解平台各项规则，杜绝违规操作，保障配送安全。

二、核心内容
1. 平台红线规则
   - 严禁虚假点击送达
   - 严禁私自取消订单
   - 严禁窃取或调换餐品
   - 严禁刷单、刷量

2. 交通安全规则
   - 遵守交通信号灯，不闯红灯
   - 不逆行、不超速
   - 骑行时不接打电话、不看视频
   - 佩戴安全头盔

3. 服务规范
   - 统一穿着工服
   - 保持个人卫生和车辆整洁
   - 不向用户索要小费或好评
   - 不与用户发生言语或肢体冲突

4. 违规处罚标准
   - 一般违规：扣5-10分，罚款50-200元
   - 严重违规：扣20分，罚款500元，暂停接单
   - 红线违规：永久封号，扣除所有保证金

三、考核标准
培训考核满分100分，80分及格。`,
  },
  service_issue: {
    title: '服务质量提升培训',
    content: `一、培训目标
提升服务意识和服务质量，提高用户满意度。

二、核心内容
1. 服务意识培养
   - 换位思考，理解用户需求
   - 主动服务，提前预判问题
   - 保持积极乐观的服务态度

2. 标准服务流程
   - 取餐时：您好，我是XX骑手，来取XX号订单
   - 送达时：您好，您的外卖到了，请您签收
   - 问题处理：先致歉，再解决，最后安抚

3. 细节决定体验
   - 送达时提醒用户趁热食用
   - 下雨天注意防水，保护餐品
   - 大件物品主动帮忙搬运
   - 遇到老人、孕妇等特殊用户多关照

4. 用户评价管理
   - 重视每一条用户评价
   - 对差评认真反思改进
   - 不恶意骚扰用户修改评价

三、考核标准
培训后30天内，用户满意度评分提升至4.8分以上。`,
  },
};

export function shouldTriggerTraining(
  assessment: Assessment,
  rider: Rider,
  allAssessments: Assessment[]
): TrainingTriggerResult {
  const rule = ASSESSMENT_RULES[assessment.type];
  const riderAssessments = allAssessments.filter(a => a.riderId === rider.id && a.status === 'approved');

  if (assessment.scoreDeducted >= rule.triggersTrainingAt) {
    const template = TRAINING_CONTENT_TEMPLATES[assessment.type];
    return {
      shouldTrigger: true,
      trainingType: 'mandatory',
      reason: `单次扣分 ${assessment.scoreDeducted} 分，达到培训触发阈值`,
      title: template.title,
      content: template.content,
    };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thisMonthScore = riderAssessments
    .filter(a => new Date(a.createdAt) >= monthStart)
    .reduce((sum, a) => sum + a.scoreDeducted, 0);

  if (thisMonthScore >= 12) {
    return {
      shouldTrigger: true,
      trainingType: 'remedial',
      reason: `本月累计扣分 ${thisMonthScore} 分，已达12分警戒线`,
      title: '服务质量综合提升培训',
      content: `您本月累计扣分已达${thisMonthScore}分，需要参加综合服务质量培训。

培训内容：
1. 回顾本月所有违规记录，分析问题根源
2. 制定个人改进计划
3. 学习优秀骑手的服务经验
4. 重新通过平台服务规范考试

培训需在7天内完成，否则将影响您的派单优先级。`,
    };
  }

  const sameTypeCount = riderAssessments.filter(a => a.type === assessment.type).length;
  if (sameTypeCount >= 3) {
    const template = TRAINING_CONTENT_TEMPLATES[assessment.type];
    return {
      shouldTrigger: true,
      trainingType: 'remedial',
      reason: `同一问题已出现 ${sameTypeCount} 次，需参加专项培训`,
      title: `${template.title}（强化版）`,
      content: `您因"${rule.description}"问题已被考核${sameTypeCount}次，需要参加强化培训。

${template.content}

特别说明：
- 本次培训需完成案例分析作业
- 培训后需通过模拟场景考核
- 如30天内再次出现同类问题，将加重处罚`,
    };
  }

  return {
    shouldTrigger: false,
    trainingType: 'refresh',
    reason: '未达到培训触发条件',
    title: '',
    content: '',
  };
}

export function getTrainingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    mandatory: '强制培训',
    remedial: '整改培训',
    onboarding: '入职培训',
    refresh: '常规培训',
  };
  return labels[type] || type;
}

export function getTrainingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待学习',
    in_progress: '学习中',
    completed: '已完成',
    overdue: '已逾期',
  };
  return labels[status] || status;
}

export function getTrainingStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}
