import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
  },
  {
    path: '/plots',
    name: 'plots',
    component: () => import('@/pages/PlotsPage.vue'),
  },
  {
    path: '/plots/:id',
    name: 'plotDetail',
    component: () => import('@/pages/PlotDetailPage.vue'),
  },
  {
    path: '/transfers',
    name: 'transfers',
    component: () => import('@/pages/TransfersPage.vue'),
  },
  {
    path: '/transfers/:id',
    name: 'transferDetail',
    component: () => import('@/pages/TransferDetailPage.vue'),
  },
  {
    path: '/operations',
    name: 'operations',
    component: () => import('@/pages/OperationsPage.vue'),
  },
  {
    path: '/loading',
    name: 'loading',
    component: () => import('@/pages/LoadingPage.vue'),
  },
  {
    path: '/loading/:id',
    name: 'loadingDetail',
    component: () => import('@/pages/LoadingDetailPage.vue'),
  },
  {
    path: '/followup',
    name: 'followup',
    component: () => import('@/pages/FollowupPage.vue'),
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/pages/CalendarPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
