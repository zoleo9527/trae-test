export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth()
  
  if (to.path !== '/login' && !isLoggedIn.value) {
    return navigateTo('/login')
  }
  
  if (to.path === '/login' && isLoggedIn.value) {
    return navigateTo('/')
  }
})
