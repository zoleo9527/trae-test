import Layout from '@/layout/Layout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
          meta: { title: '数据看板' },
        },
        {
          path: 'inspections',
          name: 'Inspections',
          component: () => import('@/pages/InspectionListPage.vue'),
          meta: { title: '养护巡查' },
        },
        {
          path: 'inspections/new',
          name: 'InspectionCreate',
          component: () => import('@/pages/InspectionCreatePage.vue'),
          meta: { title: '新增巡查' },
        },
        {
          path: 'inspections/:id',
          name: 'InspectionDetail',
          component: () => import('@/pages/InspectionDetailPage.vue'),
          meta: { title: '巡查详情' },
        },
        {
          path: 'diseases',
          name: 'Diseases',
          component: () => import('@/pages/DiseaseListPage.vue'),
          meta: { title: '病害上报' },
        },
        {
          path: 'diseases/new',
          name: 'DiseaseCreate',
          component: () => import('@/pages/DiseaseCreatePage.vue'),
          meta: { title: '上报病害' },
        },
        {
          path: 'diseases/:id',
          name: 'DiseaseDetail',
          component: () => import('@/pages/DiseaseDetailPage.vue'),
          meta: { title: '病害详情' },
        },
        {
          path: 'negotiations',
          name: 'Negotiations',
          component: () => import('@/pages/NegotiationListPage.vue'),
          meta: { title: '补苗协商' },
        },
        {
          path: 'negotiations/new',
          name: 'NegotiationCreate',
          component: () => import('@/pages/NegotiationCreatePage.vue'),
          meta: { title: '新建协商' },
        },
        {
          path: 'negotiations/:id',
          name: 'NegotiationDetail',
          component: () => import('@/pages/NegotiationDetailPage.vue'),
          meta: { title: '协商详情' },
        },
        {
          path: 'plots',
          name: 'Plots',
          component: () => import('@/pages/PlotListPage.vue'),
          meta: { title: '地块管理' },
        },
      ],
    },
  ],
});

export default router;
