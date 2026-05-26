import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import type { UserRole } from '@/types'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台概览' }
      },
      {
        path: 'lockers',
        name: 'Lockers',
        component: () => import('@/views/Lockers.vue'),
        meta: { title: '储物柜管理', roles: ['director', 'reception'] as UserRole[] }
      },
      {
        path: 'appeals',
        name: 'Appeals',
        component: () => import('@/views/Appeals.vue'),
        meta: { title: '异常申诉' }
      },
      {
        path: 'appeals/:id',
        name: 'AppealDetail',
        component: () => import('@/views/AppealDetail.vue'),
        meta: { title: '申诉详情' }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/Courses.vue'),
        meta: { title: '课程表', roles: ['director', 'head_coach'] as UserRole[] }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/Transactions.vue'),
        meta: { title: '储值记录', roles: ['director', 'reception'] as UserRole[] }
      },
      {
        path: 'patrol',
        name: 'Patrol',
        component: () => import('@/views/Patrol.vue'),
        meta: { title: '巡场照片', roles: ['director', 'head_coach'] as UserRole[] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    await userStore.restoreSession()
  }
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.roles && !userStore.hasRole(to.meta.roles as UserRole[])) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
