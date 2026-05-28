import { ElMessage } from 'element-plus'

export const useWsApi = () => {
  const config = useRuntimeConfig()
  const base = config.public.apiBase

  const request = async <T>(path: string, opts: any = {}): Promise<T> => {
    try {
      return await $fetch<T>(`${base}${path}`, {
        ...opts,
        headers: {
          'Content-Type': 'application/json',
          ...(opts.headers || {})
        }
      })
    } catch (e: any) {
      const msg = e?.data?.detail || e?.message || '请求失败'
      ElMessage.error(msg)
      throw e
    }
  }

  const nativeFetch = () => {
    return async (url: string, opts: any = {}) => {
      try {
        return await $fetch(`${base}${url}`, {
          ...opts,
          headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {})
          }
        })
      } catch (e: any) {
        const msg = e?.data?.detail || e?.message || '请求失败'
        ElMessage.error(msg)
        throw e
      }
    }
  }

  return {
    base,
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body }),
    nativeFetch
  }
}
