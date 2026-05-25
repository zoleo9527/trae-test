export const useApi = () => {
  const config = useRuntimeConfig()

  const get = async <T>(endpoint: string) => {
    return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
      method: 'GET'
    })
  }

  const post = async <T>(endpoint: string, data: any) => {
    return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
      method: 'POST',
      body: data
    })
  }

  const put = async <T>(endpoint: string, data: any) => {
    return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
      method: 'PUT',
      body: data
    })
  }

  const del = async <T>(endpoint: string) => {
    return await $fetch<T>(`${config.public.apiBase}${endpoint}`, {
      method: 'DELETE'
    })
  }

  return { get, post, put, del }
}
