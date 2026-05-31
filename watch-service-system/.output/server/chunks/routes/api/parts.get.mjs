import { b as defineEventHandler } from '../../nitro/nitro.mjs';
import { m as mockPartInventory } from '../../_/mockData.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const parts_get = defineEventHandler(() => {
  return mockPartInventory;
});

export { parts_get as default };
//# sourceMappingURL=parts.get.mjs.map
