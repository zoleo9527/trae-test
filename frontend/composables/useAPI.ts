export const useAPI = () => {
  const config = useRuntimeConfig()
  const token = useCookie('access_token')

  const defaultHeaders = computed(() => ({
    'Content-Type': 'application/json',
    'Authorization': token.value ? `Bearer ${token.value}` : ''
  }))

  const request = async (method: string, url: string, data?: any) => {
    try {
      const res = await $fetch(url, {
        method,
        baseURL: config.public.apiBase,
        headers: defaultHeaders.value,
        body: data
      })
      return res
    } catch (error: any) {
      if (error.response?.status === 401) {
        const router = useRouter()
        router.push('/login')
      }
      throw error
    }
  }

  return {
    get: (url: string) => request('GET', url),
    post: (url: string, data: any) => request('POST', url, data),
    put: (url: string, data: any) => request('PUT', url, data),
    delete: (url: string) => request('DELETE', url)
  }
}
