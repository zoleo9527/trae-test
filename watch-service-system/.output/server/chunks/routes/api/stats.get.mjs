import { b as defineEventHandler } from '../../nitro/nitro.mjs';
import { g as getDashboardStats } from '../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const stats_get = defineEventHandler(() => {
  return getDashboardStats();
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
