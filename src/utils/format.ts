import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd') {
  return format(new Date(date), pattern, { locale: zhCN });
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

export function isOverdue(date: string | Date) {
  return isBefore(new Date(date), new Date());
}

export function isUpcoming(date: string | Date, days: number = 7) {
  const now = new Date();
  const target = new Date(date);
  return isAfter(target, now) && isBefore(target, addDays(now, days));
}

export function getDeadlineStatus(date: string | Date) {
  if (isOverdue(date)) return 'overdue';
  if (isUpcoming(date, 7)) return 'upcoming';
  return 'normal';
}

export const statusLabels: Record<string, string> = {
  consulting: '咨询中',
  contract_signed: '已签约',
  document_prep: '文书准备中',
  application_submitted: '申请已提交',
  visa_processing: '签证办理中',
  completed: '已完成',
  pending: '待处理',
  in_progress: '进行中',
  review: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
  overdue: '已逾期',
  not_started: '未开始',
  documents_preparing: '材料准备中',
  submitted: '已提交',
  interview_scheduled: '面试已预约',
  refund_in_progress: '退款中',
  open: '待处理',
  resolved: '已解决',
  closed: '已关闭',
};

export const documentTypeLabels: Record<string, string> = {
  personal_statement: '个人陈述',
  recommendation_letter: '推荐信',
  resume: '简历',
  transcript: '成绩单',
  language_score: '语言成绩',
  financial_proof: '资金证明',
  other: '其他',
};

export const deadlineTypeLabels: Record<string, string> = {
  document_submission: '材料提交',
  application_deadline: '申请截止',
  visa_appointment: '签证预约',
  tuition_payment: '学费缴纳',
  embarkation: '行前准备',
};

export const issueCategoryLabels: Record<string, string> = {
  document_version: '版本混乱',
  deadline_missed: '截点错过',
  refund_negotiation: '退款协商',
  visa_issue: '签证问题',
  communication: '沟通问题',
};

export const roleLabels: Record<string, string> = {
  consultant_manager: '顾问主管',
  copywriter: '文案老师',
  visa_assistant: '签证助理',
};

export const priorityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};
