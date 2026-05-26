import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'weighing',
        name: 'Weighing',
        component: () => import('@/views/Weighing.vue'),
        meta: { roles: ['owner', 'weigher'] }
      },
      {
        path: 'weighing/detail/:id',
        name: 'WeighingDetail',
        component: () => import('@/views/WeighingDetail.vue')
      },
      {
        path: 'settlement',
        name: 'Settlement',
        component: () => import('@/views/Settlement.vue'),
        meta: { roles: ['owner', 'accountant'] }
      },
      {
        path: 'settlement/detail/:id',
        name: 'SettlementDetail',
        component: () => import('@/views/SettlementDetail.vue')
      },
      {
        path: 'trace',
        name: 'Trace',
        component: () => import('@/views/Trace.vue')
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: () => import('@/views/Vehicles.vue')
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/Materials.vue'),
        meta: { roles: ['owner'] }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/Logs.vue'),
        meta: { roles: ['owner'] }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/Exceptions.vue'),
        meta: { roles: ['owner', 'accountant'] }
      },
      {
        path: 'env-records',
        name: 'EnvRecords',
        component: () => import('@/views/EnvRecords.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.path === '/login') {
    next()
  } else {
    if (!authStore.isLoggedIn) {
      next('/login')
    } else {
      if (to.meta.roles && !to.meta.roles.includes(authStore.user.role)) {
        next('/dashboard')
      } else {
        next()
      }
    }
  }
})

export default router
