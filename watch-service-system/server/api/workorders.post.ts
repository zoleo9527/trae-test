import { mockWorkOrders, mockUsers } from '../data/mockData';
import type { WorkOrder, Priority } from '~/types/workorder';

function generateOrderNo(): string {
  const date = new Date();
  const prefix = `WS${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const count = mockWorkOrders.filter(wo => wo.orderNo.startsWith(prefix)).length + 1;
  return `${prefix}${String(count).padStart(4, '0')}`;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const {
    customerName,
    customerPhone,
    customerEmail,
    watchBrand,
    watchModel,
    watchSerial,
    problemDesc,
    priority = 'medium',
    expectedDate,
    role = 'consultant',
  } = body;

  if (!customerName || !customerPhone || !watchBrand || !watchModel || !problemDesc) {
    throw createError({
      statusCode: 400,
      statusMessage: '缺少必要字段',
    });
  }

  const currentUser = mockUsers.find(u => u.role === role) || mockUsers[1];

  const newOrder: WorkOrder = {
    id: `wo${Date.now()}`,
    orderNo: generateOrderNo(),
    customer: {
      id: `c${Date.now()}`,
      name: customerName,
      phone: customerPhone,
      email: customerEmail || undefined,
    },
    watchBrand,
    watchModel,
    watchSerial: watchSerial || undefined,
    problemDesc,
    status: 'pending_review',
    priority: priority as Priority,
    receivedAt: new Date().toISOString(),
    expectedDate: expectedDate || undefined,
    parts: [],
    timeline: [
      {
        id: `tl-${Date.now()}-1`,
        action: '寄修登记',
        operator: currentUser.name,
        operatorRole: currentUser.role,
        remark: '客户提交寄修申请',
        createdAt: new Date().toISOString(),
      },
    ],
    progress: [],
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockWorkOrders.unshift(newOrder);

  return newOrder;
});
