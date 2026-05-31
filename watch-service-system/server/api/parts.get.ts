import { mockPartInventory } from '../data/mockData';
import type { PartInventory } from '~/types/workorder';

export default defineEventHandler(() => {
  return mockPartInventory as PartInventory[];
});
