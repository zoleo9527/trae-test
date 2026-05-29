import type { Order, Appeal, ResponsibilityResult } from '@/types';

export function determineResponsibility(order: Order, appeal?: Appeal): ResponsibilityResult {
  if (appeal?.status === 'resolved' && appeal.responsibleParty && appeal.responsibleParty !== 'unclear') {
    return {
      party: appeal.responsibleParty,
      confidence: 100,
      reasons: [`申诉已判定责任方为${getPartyLabel(appeal.responsibleParty)}`],
    };
  }

  const merchantDelay = getMinutesDiff(order.createdAt, order.merchantReadyTime);
  const pickupDelay = getMinutesDiff(order.merchantReadyTime, order.pickedUpTime);
  const deliveryDelay = getMinutesDiff(order.pickedUpTime, order.deliveredTime);
  const totalTime = merchantDelay + pickupDelay + deliveryDelay;

  const isTimeout = new Date(order.deliveredTime) > new Date(order.promisedTime);

  if (isTimeout) {
    const merchantRatio = merchantDelay / totalTime;
    const riderRatio = (pickupDelay + deliveryDelay) / totalTime;

    if (merchantRatio >= 0.6) {
      return {
        party: 'merchant',
        confidence: Math.round(merchantRatio * 100),
        reasons: [
          `商家出餐耗时 ${merchantDelay} 分钟，占总时长 ${Math.round(merchantRatio * 100)}%`,
          `骑手配送耗时 ${pickupDelay + deliveryDelay} 分钟，占比 ${Math.round(riderRatio * 100)}%`,
        ],
      };
    }

    if (riderRatio >= 0.6) {
      return {
        party: 'rider',
        confidence: Math.round(riderRatio * 100),
        reasons: [
          `骑手取餐+配送耗时 ${pickupDelay + deliveryDelay} 分钟，占总时长 ${Math.round(riderRatio * 100)}%`,
          `商家出餐耗时 ${merchantDelay} 分钟，占比 ${Math.round(merchantRatio * 100)}%`,
        ],
      };
    }
  }

  if (appeal) {
    const refundKeywords = ['餐品漏送', '餐品错误', '味道差', '不新鲜', '分量少'];
    const deliveryKeywords = ['送错地址', '餐品撒漏', '配送太慢', '联系不上'];

    const hasMerchantIssue = refundKeywords.some(k =>
      appeal.reason.includes(k) || appeal.description.includes(k)
    );

    const hasRiderIssue = deliveryKeywords.some(k =>
      appeal.reason.includes(k) || appeal.description.includes(k)
    );

    if (hasMerchantIssue && !hasRiderIssue) {
      return {
        party: 'merchant',
        confidence: 80,
        reasons: [`申诉内容描述了商家餐品问题：${appeal.reason}`],
      };
    }

    if (hasRiderIssue && !hasMerchantIssue) {
      return {
        party: 'rider',
        confidence: 80,
        reasons: [`申诉内容描述了骑手配送问题：${appeal.reason}`],
      };
    }

    if (hasMerchantIssue && hasRiderIssue) {
      return {
        party: 'unclear',
        confidence: 50,
        reasons: ['申诉同时涉及商家和骑手问题，需人工复核'],
      };
    }
  }

  return {
    party: 'unclear',
    confidence: 30,
    reasons: ['现有数据不足以判定责任，建议人工复核完整聊天记录和配送轨迹'],
  };
}

export function getPartyLabel(party: string): string {
  const labels: Record<string, string> = {
    rider: '骑手',
    merchant: '商家',
    platform: '平台',
    user: '用户',
    unclear: '待判定',
  };
  return labels[party] || party;
}

export function getPartyColor(party: string): string {
  const colors: Record<string, string> = {
    rider: 'text-accent-red',
    merchant: 'text-accent-amber',
    platform: 'text-accent-blue',
    user: 'text-accent-green',
    unclear: 'text-gray-500',
  };
  return colors[party] || 'text-gray-500';
}

function getMinutesDiff(start: string, end: string): number {
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
}
