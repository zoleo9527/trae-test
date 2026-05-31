export const useAPI = () => {
  const config = useRuntimeConfig()
  const token = useCookie('access_token')

  const baseURL = computed(() => {
    if (process.client) {
      return '/api'
    }
    return config.public.apiBase
  })

  const defaultHeaders = computed(() => ({
    'Content-Type': 'application/json',
    'Authorization': token.value ? `Bearer ${token.value}` : ''
  }))

  const request = async (method: string, url: string, data?: any) => {
    try {
      const res = await $fetch(url, {
        method,
        baseURL: baseURL.value,
        headers: defaultHeaders.value,
        body: data
      })
      return res
    } catch (error: any) {
      if (error.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
      }
      let enhancedError = error
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION')) {
        enhancedError = new Error('无法连接到服务器，请检查后端服务是否已启动')
        enhancedError.original = error
      } else if (error.message && !error.message.includes('失败')) {
        enhancedError = new Error('请求失败：' + error.message)
        enhancedError.original = error
      }
      throw enhancedError
    }
  }

  return {
    get: (url: string) => request('GET', url),
    post: (url: string, data: any) => request('POST', url, data),
    put: (url: string, data: any) => request('PUT', url, data),
    delete: (url: string) => request('DELETE', url)
  }
}
