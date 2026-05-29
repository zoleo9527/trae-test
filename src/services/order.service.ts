import { getAppealsByOrder } from '@/mock/appeals';
import { getAssessmentsByOrder, mockAssessments } from '@/mock/assessments';
import { getExceptionOrders, getOrderById, mockOrders } from '@/mock/orders';
import { getSubsidiesByOrder } from '@/mock/subsidies';
import { mockTrainings } from '@/mock/trainings';
import type { Order, OrderStatus, TimelineEvent } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function getAllOrders(): Order[] {
  return mockOrders;
}

export function getOrders(options?: {
  status?: OrderStatus;
  region?: string;
  riderId?: string;
  hasException?: boolean;
}): Order[] {
  let orders = [...mockOrders];

  if (options?.status) {
    orders = orders.filter(o => o.status === options.status);
  }
  if (options?.region) {
    orders = orders.filter(o => o.region === options.region);
  }
  if (options?.riderId) {
    orders = orders.filter(o => o.riderId === options.riderId);
  }
  if (options?.hasException) {
    orders = orders.filter(o => o.hasAppeal || o.hasSubsidy || o.hasAssessment || o.status === 'exception');
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOrderDetail(id: string): Order | undefined {
  return getOrderById(id);
}

export function updateOrderStatus(orderId: string, status: OrderStatus): Order | undefined {
  const order = getOrderById(orderId);
  if (order) {
    order.status = status;
  }
  return order;
}

export function getOrderTimeline(orderId: string): TimelineEvent[] {
  const order = getOrderById(orderId);
  if (!order) return [];

  const events: TimelineEvent[] = [];

  events.push({
    id: `timeline-${uuidv4()}`,
    type: 'order',
    timestamp: order.createdAt,
    title: '订单创建',
    description: `用户${order.userName}下单，金额 ¥${order.amount}`,
    data: { order },
  });

  events.push({
    id: `timeline-${uuidv4()}`,
    type: 'order',
    timestamp: order.merchantReadyTime,
    title: '商家出餐完成',
    description: `${order.merchantName} 出餐完成，等待骑手取餐`,
    data: { order },
  });

  events.push({
    id: `timeline-${uuidv4()}`,
    type: 'order',
    timestamp: order.pickedUpTime,
    title: '骑手已取餐',
    description: `骑手 ${order.riderName} 已取餐，正在配送中`,
    data: { order },
  });

  events.push({
    id: `timeline-${uuidv4()}`,
    type: 'order',
    timestamp: order.deliveredTime,
    title: '订单已送达',
    description: `订单已送达至 ${order.deliveryAddress}`,
    data: { order },
  });

  const appeals = getAppealsByOrder(orderId);
  appeals.forEach(appeal => {
    events.push({
      id: `timeline-${uuidv4()}`,
      type: 'appeal',
      timestamp: appeal.createdAt,
      title: `用户申诉：${appeal.reason}`,
      description: appeal.description,
      data: { appeal },
    });
    if (appeal.resolvedAt) {
      events.push({
        id: `timeline-${uuidv4()}`,
        type: 'appeal',
        timestamp: appeal.resolvedAt,
        title: '申诉已处理',
        description: appeal.resolution || '',
        data: { appeal },
      });
    }
  });

  const subsidies = getSubsidiesByOrder(orderId);
  subsidies.forEach(subsidy => {
    events.push({
      id: `timeline-${uuidv4()}`,
      type: 'subsidy',
      timestamp: subsidy.createdAt,
      title: `补贴申请：¥${subsidy.amount}`,
      description: subsidy.reason,
      data: { subsidy },
    });
    if (subsidy.approvedAt) {
      events.push({
        id: `timeline-${uuidv4()}`,
        type: 'subsidy',
        timestamp: subsidy.approvedAt,
        title: subsidy.status === 'approved' ? '补贴已通过' : '补贴已驳回',
        description: `处理人：${subsidy.approvedBy}`,
        data: { subsidy },
      });
    }
  });

  const assessments = getAssessmentsByOrder(orderId);
  assessments.forEach(assessment => {
    events.push({
      id: `timeline-${uuidv4()}`,
      type: 'assessment',
      timestamp: assessment.createdAt,
      title: `考核记录：扣${assessment.scoreDeducted}分，罚款¥${assessment.fineAmount}`,
      description: assessment.reason,
      data: { assessment },
    });
    if (assessment.approvedAt) {
      events.push({
        id: `timeline-${uuidv4()}`,
        type: 'assessment',
        timestamp: assessment.approvedAt,
        title: assessment.status === 'approved' ? '考核已通过' : '考核已驳回',
        description: `审核人：${assessment.approvedBy}`,
        data: { assessment },
      });
    }
  });

  const trainings = mockTrainings.filter(t => {
    const assessment = mockAssessments.find(a => a.id === t.assessmentId);
    return assessment?.orderId === orderId;
  });
  trainings.forEach(training => {
    events.push({
      id: `timeline-${uuidv4()}`,
      type: 'training',
      timestamp: training.createdAt,
      title: `培训已生成：${training.title}`,
      description: `培训类型：${training.type}，截止日期：${training.dueDate}`,
      data: { training },
    });
    if (training.completedAt) {
      events.push({
        id: `timeline-${uuidv4()}`,
        type: 'training',
        timestamp: training.completedAt,
        title: '培训已完成',
        description: `得分：${training.score}分`,
        data: { training },
      });
    }
  });

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getOrderByOrderId(id: string): Order | undefined {
  return mockOrders.find(o => o.id === id);
}

export function buildTimeline(orderId: string): TimelineEvent[] {
  return getOrderTimeline(orderId);
}

export function getDashboardStats() {
  const allOrders = mockOrders;
  const exceptionOrders = getExceptionOrders();

  const totalOrders = allOrders.length;
  const deliveredOrders = allOrders.filter(o => o.status === 'delivered').length;
  const onTimeDeliveries = allOrders.filter(
    o => o.status === 'delivered' && new Date(o.deliveredTime) <= new Date(o.promisedTime)
  ).length;

  const deliveryTimes = allOrders
    .filter(o => o.status === 'delivered')
    .map(o => (new Date(o.deliveredTime).getTime() - new Date(o.createdAt).getTime()) / 60000);

  const avgDeliveryTime = deliveryTimes.length > 0
    ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
    : 0;

  const onTimeRate = deliveredOrders > 0
    ? Math.round((onTimeDeliveries / deliveredOrders) * 100)
    : 0;

  return {
    totalOrders,
    exceptionOrders: exceptionOrders.length,
    timeoutOrders: allOrders.filter(
      o => o.status === 'delivered' && new Date(o.deliveredTime) > new Date(o.promisedTime)
    ).length,
    avgDeliveryTime,
    onTimeRate,
  };
}

function getOrderByIdFromMock(id: string): Order | undefined {
  return mockOrders.find(o => o.id === id);
}
