export default defineNuxtRouteMiddleware((to) => {
  if (process.server) return

  const authStore = useAuthStore()
  authStore.initAuth()

  const isLoggedIn = authStore.isLoggedIn

  if (!isLoggedIn && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (isLoggedIn && to.path === '/login') {
    return navigateTo('/')
  }
})
