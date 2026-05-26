import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue') },
  { path: '/redeem', name: 'redeem', component: () => import('@/pages/RedeemPage.vue') },
  { path: '/workshop', name: 'workshop', component: () => import('@/pages/WorkshopPage.vue') },
  { path: '/refund', name: 'refund', component: () => import('@/pages/RefundPage.vue') },
  { path: '/history', name: 'history', component: () => import('@/pages/HistoryPage.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
