import { mockWorkOrders } from '../../data/mockData';
import type { WorkOrder, WorkOrderStatus } from '~/types/workorder';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);
  const index = mockWorkOrders.findIndex(wo => wo.id === id);
  
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在',
    });
  }
  
  const updatedOrder: WorkOrder = {
    ...mockWorkOrders[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  mockWorkOrders[index] = updatedOrder;
  
  return updatedOrder;
});
