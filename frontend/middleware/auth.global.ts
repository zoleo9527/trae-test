export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { isAuthenticated, user, hasAccessToPage, getDefaultPage } = useAuth()

  const stored = localStorage.getItem('water_delivery_user')
  if (stored) {
    user.value = JSON.parse(stored)
    isAuthenticated.value = true
  }

  if (to.path === '/login') {
    if (isAuthenticated.value && user.value) {
      const defaultPage = getDefaultPage(user.value.role)
      return navigateTo(defaultPage)
    }
    return
  }

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }

  if (user.value && !hasAccessToPage(user.value.role, to.path)) {
    const defaultPage = getDefaultPage(user.value.role)
    return navigateTo(defaultPage)
  }
})
