import { mockWorkOrders } from '../../data/mockData';

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id');
  const order = mockWorkOrders.find(wo => wo.id === id);
  
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在',
    });
  }
  
  return order;
});
