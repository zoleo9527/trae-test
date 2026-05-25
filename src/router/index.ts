import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import ExhibitBorrow from '@/views/ExhibitBorrow.vue'
import TicketVerify from '@/views/TicketVerify.vue'
import TraceBack from '@/views/TraceBack.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '运营看板' }
  },
  {
    path: '/borrow',
    name: 'ExhibitBorrow',
    component: ExhibitBorrow,
    meta: { title: '展品借调' }
  },
  {
    path: '/ticket',
    name: 'TicketVerify',
    component: TicketVerify,
    meta: { title: '票务核销' }
  },
  {
    path: '/trace',
    name: 'TraceBack',
    component: TraceBack,
    meta: { title: '追溯回查' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
