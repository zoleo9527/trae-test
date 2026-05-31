import { createRouter, createWebHistory } from 'vue-router'
import Workspace from '@/pages/Workspace.vue'
import Orders from '@/pages/Orders.vue'
import ScheduleBoard from '@/pages/ScheduleBoard.vue'
import Pickup from '@/pages/Pickup.vue'
import Remake from '@/pages/Remake.vue'
import Refund from '@/pages/Refund.vue'

const routes = [
  {
    path: '/',
    name: 'workspace',
    component: Workspace,
  },
  {
    path: '/orders',
    name: 'orders',
    component: Orders,
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: ScheduleBoard,
  },
  {
    path: '/pickup',
    name: 'pickup',
    component: Pickup,
  },
  {
    path: '/remake',
    name: 'remake',
    component: Remake,
  },
  {
    path: '/refund',
    name: 'refund',
    component: Refund,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
