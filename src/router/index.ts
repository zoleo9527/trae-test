import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'overview',
    component: () => import('@/pages/OverviewPage.vue'),
  },
  {
    path: '/bookings',
    name: 'bookings',
    component: () => import('@/pages/BookingsPage.vue'),
  },
  {
    path: '/bookings/new',
    name: 'bookings-new',
    component: () => import('@/pages/BookingNewPage.vue'),
  },
  {
    path: '/schedules',
    name: 'schedules',
    component: () => import('@/pages/SchedulesPage.vue'),
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/pages/TasksPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (!auth.currentUser) return { name: 'login', query: { r: to.fullPath } };
  return true;
});

export default router;
