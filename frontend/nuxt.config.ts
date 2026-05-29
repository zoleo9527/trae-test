export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:8000/api'
    }
  },
  app: {
    head: {
      title: '跑腿平台-商家结算与异常补贴',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '跑腿平台商家结算与异常补贴管理系统' }
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2024-05-30'
})
