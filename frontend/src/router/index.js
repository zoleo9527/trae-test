import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataLine' }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/Schedule.vue'),
        meta: { title: '排班管理', icon: 'Calendar', roles: ['director', 'coordinator'] }
      },
      {
        path: 'checkin',
        name: 'Checkin',
        component: () => import('@/views/Checkin.vue'),
        meta: { title: '签到核销', icon: 'SuccessFilled', roles: ['director', 'coordinator', 'operator'] }
      },
      {
        path: 'feedback',
        name: 'Feedback',
        component: () => import('@/views/Feedback.vue'),
        meta: { title: '反馈处理', icon: 'ChatDotRound', roles: ['director', 'coordinator', 'operator'] }
      },
      {
        path: 'volunteers',
        name: 'Volunteers',
        component: () => import('@/views/Volunteers.vue'),
        meta: { title: '志愿者库', icon: 'User', roles: ['director', 'coordinator'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.roles && !to.meta.roles.includes(userStore.currentRole)) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
