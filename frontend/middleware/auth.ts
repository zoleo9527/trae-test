export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  if (!auth.isLoggedIn && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (auth.isLoggedIn) {
    if (to.path === '/login') {
      return navigateTo(auth.defaultRoute)
    }

    if (to.path === '/' && !auth.canViewDashboard) {
      return navigateTo(auth.defaultRoute)
    }

    if (to.path === '/purchases' && !auth.canViewPurchasesList) {
      return navigateTo(auth.defaultRoute)
    }

    if (to.path === '/gradings' && !auth.canViewGradingsList) {
      return navigateTo(auth.defaultRoute)
    }

    if (to.path === '/allocations' && !auth.canViewAllocationsList) {
      return navigateTo(auth.defaultRoute)
    }

    if (to.path === '/sales' && !auth.canViewSalesList) {
      return navigateTo(auth.defaultRoute)
    }

    if (to.path === '/exceptions' && !auth.canViewExceptionsList) {
      return navigateTo(auth.defaultRoute)
    }
  }
})
