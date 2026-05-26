import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Layout from '../components/Layout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '批量复核面板' },
      },
      {
        path: 'complaint/new',
        name: 'NewComplaint',
        component: () => import('../views/NewComplaint.vue'),
        meta: { title: '新建客诉', roles: ['manager', 'picker'] },
      },
      {
        path: 'compensation',
        name: 'Compensation',
        component: () => import('../views/Compensation.vue'),
        meta: { title: '赔付审批', roles: ['manager', 'accountant'] },
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('../views/Payment.vue'),
        meta: { title: '回款跟踪', roles: ['manager', 'accountant'] },
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('../views/History.vue'),
        meta: { title: '历史记录' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  authStore.restoreSession();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
  } else if (to.meta.roles && !authStore.hasRole(to.meta.roles as string[])) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
