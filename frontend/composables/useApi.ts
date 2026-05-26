import type { UseFetchOptions } from 'nuxt/app'

export function useApi<T>(path: string, opts: UseFetchOptions<T> = {}) {
  const config = useRuntimeConfig()
  return useFetch<T>(path, {
    baseURL: config.public.apiBase,
    ...opts,
  })
}

export async function apiGet<T>(path: string): Promise<T> {
  const config = useRuntimeConfig()
  return await $fetch<T>(path, { baseURL: config.public.apiBase, method: 'GET' })
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const config = useRuntimeConfig()
  return await $fetch<T>(path, {
    baseURL: config.public.apiBase,
    method: 'POST',
    body,
  })
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const config = useRuntimeConfig()
  return await $fetch<T>(path, {
    baseURL: config.public.apiBase,
    method: 'PATCH',
    body,
  })
}
