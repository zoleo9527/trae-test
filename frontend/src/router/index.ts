import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/workbench'
  },
  {
    path: '/workbench',
    name: 'Workbench',
    component: () => import('@/views/Workbench.vue'),
    meta: { title: '工作台' }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { title: '订单管理' }
  },
  {
    path: '/batches',
    name: 'Batches',
    component: () => import('@/views/Batches.vue'),
    meta: { title: '批次追踪' }
  },
  {
    path: '/complaints',
    name: 'Complaints',
    component: () => import('@/views/Complaints.vue'),
    meta: { title: '客诉赔付' }
  },
  {
    path: '/settlement',
    name: 'Settlement',
    component: () => import('@/views/Settlement.vue'),
    meta: { title: '月结对账' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '工作台'} - 洗涤工厂管理系统`;
  next();
});

export default router;
