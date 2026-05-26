import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  },
  {
    path: '/plots',
    name: 'Plots',
    component: () => import('../views/PlotList.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  },
  {
    path: '/plots/:id',
    name: 'PlotDetail',
    component: () => import('../views/PlotDetail.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/TaskList.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('../views/TaskDetail.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  },
  {
    path: '/fuel',
    name: 'Fuel',
    component: () => import('../views/FuelRecords.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher'] }
  },
  {
    path: '/subsidy',
    name: 'Subsidy',
    component: () => import('../views/SubsidyRecords.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher'] }
  },
  {
    path: '/reviews',
    name: 'Reviews',
    component: () => import('../views/ReviewList.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/HistoryLogs.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher'] }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../views/AlertList.vue'),
    meta: { requiresAuth: true, roles: ['director', 'dispatcher', 'operator'] }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.currentUser) {
    next('/login')
  } else if (to.meta.roles && !to.meta.roles.includes(userStore.currentUser?.role)) {
    next('/')
  } else if (to.path === '/login' && userStore.currentUser) {
    next('/')
  } else {
    next()
  }
})

export default router
