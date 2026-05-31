import { b as defineEventHandler, j as getQuery } from '../../nitro/nitro.mjs';
import { b as mockWorkOrders } from '../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const workorders_get = defineEventHandler((event) => {
  const query = getQuery(event);
  const { status, priority, search, page = 1, limit = 20 } = query;
  let orders = [...mockWorkOrders];
  if (status && typeof status === "string") {
    const statuses = status.split(",");
    orders = orders.filter((wo) => statuses.includes(wo.status));
  }
  if (priority && typeof priority === "string") {
    const priorities = priority.split(",");
    orders = orders.filter((wo) => priorities.includes(wo.priority));
  }
  if (search && typeof search === "string") {
    const searchLower = search.toLowerCase();
    orders = orders.filter(
      (wo) => wo.orderNo.toLowerCase().includes(searchLower) || wo.customer.name.toLowerCase().includes(searchLower) || wo.watchBrand.toLowerCase().includes(searchLower) || wo.watchModel.toLowerCase().includes(searchLower)
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
    totalPages: Math.ceil(total / limitNum)
  };
});

export { workorders_get as default };
//# sourceMappingURL=workorders.get.mjs.map
