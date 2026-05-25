import { createError, defineEventHandler, getProxyRequestHeaders, getRequestURL, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const config = useRuntimeConfig()
  const target = (config.apiProxyTarget || 'http://127.0.0.1:8000') + url.pathname + url.search
  try {
    return await proxyRequest(event, target, {
      headers: getProxyRequestHeaders(event),
    })
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: err?.message || String(err) })
  }
})
