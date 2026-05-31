import { getDashboardStats } from '../data/mockData';

export default defineEventHandler(() => {
  return getDashboardStats();
});
