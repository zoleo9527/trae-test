export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || '/api',
    },
    apiProxyTarget: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000',
  },
  css: ['~/assets/main.css'],
  typescript: { shim: false },
  compatibilityDate: '2025-05-25',
})
