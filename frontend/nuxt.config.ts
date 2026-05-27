export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true
  },
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000/api'
    }
  },
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: '桶装水配送管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
