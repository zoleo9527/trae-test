export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const api = $fetch.create({
    baseURL: config.public.apiBase,
    credentials: 'include',
    onRequest({ options }) {
      if (auth.token) {
        options.headers = {
          ...(options.headers as Record<string, string>),
          Authorization: `Bearer ${auth.token}`,
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        auth.logout()
        navigateTo('/login')
      }
    },
  })
  return { provide: { api } }
})
