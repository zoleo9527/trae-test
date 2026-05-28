import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('../views/Login.vue'),
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'campers',
          name: 'Campers',
          component: () => import('../views/Campers.vue'),
          meta: { title: '营员管理' },
        },
        {
          path: 'campers/:id',
          name: 'CamperDetail',
          component: () => import('../views/CamperDetail.vue'),
          meta: { title: '营员详情' },
        },
        {
          path: 'rooms',
          name: 'Rooms',
          component: () => import('../views/RoomDragBoard.vue'),
          meta: { title: '分房管理' },
        },
        {
          path: 'materials',
          name: 'Materials',
          component: () => import('../views/Materials.vue'),
          meta: { title: '物资管理' },
        },
        {
          path: 'resupply',
          name: 'Resupply',
          component: () => import('../views/Resupply.vue'),
          meta: { title: '补领申请' },
        },
        {
          path: 'resupply/:id',
          name: 'ResupplyDetail',
          component: () => import('../views/ResupplyDetail.vue'),
          meta: { title: '补领详情' },
        },
        {
          path: 'check-in',
          name: 'CheckIn',
          component: () => import('../views/CheckIn.vue'),
          meta: { title: '活动签到' },
        },
        {
          path: 'medical',
          name: 'Medical',
          component: () => import('../views/Medical.vue'),
          meta: { title: '医疗上报' },
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('camp_user')
  if (to.path !== '/login' && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
