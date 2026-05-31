export default defineNuxtRouteMiddleware((to, from) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.checkAuth()

  if (!isLoggedIn && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (isLoggedIn && to.path === '/login') {
    return navigateTo('/')
  }
})
