import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'consultant', 'repair'] as UserRole[] },
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('@/pages/OrdersPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'consultant', 'repair'] as UserRole[] },
  },
  {
    path: '/orders/:id',
    name: 'orderDetail',
    component: () => import('@/pages/OrderDetailPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'consultant', 'repair'] as UserRole[] },
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/pages/CheckoutPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'consultant'] as UserRole[] },
  },
  {
    path: '/return',
    name: 'return',
    component: () => import('@/pages/ReturnPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'consultant'] as UserRole[] },
  },
  {
    path: '/return/:id',
    name: 'returnDetail',
    component: () => import('@/pages/ReturnDetailPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'consultant'] as UserRole[] },
  },
  {
    path: '/repair',
    name: 'repair',
    component: () => import('@/pages/RepairPage.vue'),
    meta: { requiresAuth: true, roles: ['boss', 'repair'] as UserRole[] },
  },
  {
    path: '/deposit',
    name: 'deposit',
    component: () => import('@/pages/DepositPage.vue'),
    meta: { requiresAuth: true, roles: ['boss'] as UserRole[] },
  },
  {
    path: '/deposit/:id',
    name: 'depositDetail',
    component: () => import('@/pages/DepositDetailPage.vue'),
    meta: { requiresAuth: true, roles: ['boss'] as UserRole[] },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth !== false && !auth.isLoggedIn) {
    next('/login')
    return
  }

  if (to.path === '/login' && auth.isLoggedIn) {
    next('/dashboard')
    return
  }

  if (to.meta.roles && auth.isLoggedIn) {
    const allowedRoles = to.meta.roles as UserRole[]
    if (!allowedRoles.includes(auth.currentRole!)) {
      next('/dashboard')
      return
    }
  }

  next()
})

export default router
