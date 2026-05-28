import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { UserRole } from '@/types'
import { useAuthStore } from '@/stores'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardPage.vue'),
        meta: { requiresAuth: true, title: '业务看板' }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/MembersPage.vue'),
        meta: { requiresAuth: true, title: '会员管理', roles: [UserRole.STORE_MANAGER, UserRole.PLANNER] }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/ProductsPage.vue'),
        meta: { requiresAuth: true, title: '商品管理', roles: [UserRole.PLANNER, UserRole.WAREHOUSE] }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/OrdersPage.vue'),
        meta: { requiresAuth: true, title: '兑换订单' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetailPage.vue'),
        meta: { requiresAuth: true, title: '订单详情' }
      },
      {
        path: 'verify',
        name: 'Verify',
        component: () => import('@/views/VerifyPage.vue'),
        meta: { requiresAuth: true, title: '核销管理', roles: [UserRole.STORE_MANAGER] }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/InventoryPage.vue'),
        meta: { requiresAuth: true, title: '库存管理', roles: [UserRole.WAREHOUSE] }
      },
      {
        path: 'inspection',
        name: 'Inspection',
        component: () => import('@/views/InspectionPage.vue'),
        meta: { requiresAuth: true, title: '巡店问题' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsPage.vue'),
        meta: { requiresAuth: true, title: '系统说明' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.currentUser) {
    next('/login')
  } else if (to.meta.roles && authStore.currentUser) {
    const hasRole = (to.meta.roles as UserRole[]).includes(authStore.currentUser.role)
    if (!hasRole) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
