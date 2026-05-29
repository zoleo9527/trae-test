import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Layout from '@/components/Layout.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ReviewBoard',
        component: () => import('@/views/ReviewBoard.vue'),
      },
      {
        path: 'work-order/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/WorkOrderDetail.vue'),
      },
      {
        path: 'film-rolls',
        name: 'FilmRolls',
        component: () => import('@/views/FilmRolls.vue'),
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/Search.vue'),
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
  const requiresAuth = to.meta.requiresAuth !== false;

  if (requiresAuth && !authStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next({ path: '/' });
  } else {
    next();
  }
});

export default router;
