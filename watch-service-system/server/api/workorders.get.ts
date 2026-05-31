import { mockWorkOrders } from '../data/mockData';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const { status, priority, search, page = 1, limit = 20 } = query;
  
  let orders = [...mockWorkOrders];
  
  if (status && typeof status === 'string') {
    const statuses = status.split(',');
    orders = orders.filter(wo => statuses.includes(wo.status));
  }
  
  if (priority && typeof priority === 'string') {
    const priorities = priority.split(',');
    orders = orders.filter(wo => priorities.includes(wo.priority));
  }
  
  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase();
    orders = orders.filter(wo => 
      wo.orderNo.toLowerCase().includes(searchLower) ||
      wo.customer.name.toLowerCase().includes(searchLower) ||
      wo.watchBrand.toLowerCase().includes(searchLower) ||
      wo.watchModel.toLowerCase().includes(searchLower)
    );
  }
  
  const total = orders.length;
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const data = orders.slice(start, end);
  
  return {
    data,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
});
