import { b as defineEventHandler, n as getRouterParam, v as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { b as mockWorkOrders } from '../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const _id__patch = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const index = mockWorkOrders.findIndex((wo) => wo.id === id);
  if (index === -1) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u5DE5\u5355\u4E0D\u5B58\u5728"
    });
  }
  const updatedOrder = {
    ...mockWorkOrders[index],
    ...body,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockWorkOrders[index] = updatedOrder;
  return updatedOrder;
});

export { _id__patch as default };
//# sourceMappingURL=_id_.patch.mjs.map
