import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: '工作台' },
  },
  {
    path: '/returns',
    name: 'Returns',
    component: () => import('@/views/ReturnsView.vue'),
    meta: { title: '退货申请' },
  },
  {
    path: '/transfers',
    name: 'Transfers',
    component: () => import('@/views/TransfersView.vue'),
    meta: { title: '库存调拨' },
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('@/views/FinanceView.vue'),
    meta: { title: '对账留痕' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
