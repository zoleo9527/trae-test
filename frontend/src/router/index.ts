import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: '/workflow',
    name: 'Workflow',
    component: () => import('@/views/Workflow.vue'),
  },
  {
    path: '/batch-review',
    name: 'BatchReview',
    component: () => import('@/views/BatchReview.vue'),
  },
  {
    path: '/stations',
    name: 'Stations',
    component: () => import('@/views/Stations.vue'),
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('@/views/Tasks.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
