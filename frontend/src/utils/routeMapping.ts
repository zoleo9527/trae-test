export type TargetType = 'shipping' | 'receipt' | 'rework' | 'dispute' | 'settlement';

export const getDetailRoute = (targetType: TargetType, targetId: string): string => {
  const routeMap: Record<TargetType, string> = {
    shipping: '/shipping',
    receipt: '/receipt',
    rework: '/rework',
    dispute: '/settlement',
    settlement: '/settlement',
  };
  const basePath = routeMap[targetType] || '/';
  return `${basePath}/${targetId}`;
};

export const getListRoute = (targetType: TargetType, filter?: string): string => {
  const routeMap: Record<TargetType, string> = {
    shipping: '/shipping',
    receipt: '/receipt',
    rework: '/rework',
    dispute: '/settlement',
    settlement: '/settlement',
  };
  const basePath = routeMap[targetType] || '/';
  return filter ? `${basePath}?filter=${filter}` : basePath;
};

export const targetTypeLabels: Record<TargetType, string> = {
  shipping: '发货单',
  receipt: '回单',
  rework: '返工单',
  dispute: '结算争议',
  settlement: '结算争议',
};
