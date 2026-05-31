import { b as defineEventHandler, n as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { b as mockWorkOrders } from '../../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const _id__get = defineEventHandler((event) => {
  const id = getRouterParam(event, "id");
  const order = mockWorkOrders.find((wo) => wo.id === id);
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "\u5DE5\u5355\u4E0D\u5B58\u5728"
    });
  }
  return order;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
