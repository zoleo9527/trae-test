import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'calendar',
        name: 'Calendar',
        component: () => import('@/views/calendar/index.vue'),
        meta: { title: '安装日历' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/index.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/detail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'installations',
        name: 'Installations',
        component: () => import('@/views/installations/index.vue'),
        meta: { title: '安装预约' }
      },
      {
        path: 'acceptances',
        name: 'Acceptances',
        component: () => import('@/views/acceptances/index.vue'),
        meta: { title: '验收回单' }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/exceptions/index.vue'),
        meta: { title: '异常处理' }
      },
      {
        path: 'samples',
        name: 'Samples',
        component: () => import('@/views/samples/index.vue'),
        meta: { title: '样品管理' }
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/customers/index.vue'),
        meta: { title: '客户管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
