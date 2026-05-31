export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  typescript: {
    strict: true,
    typeCheck: true
  },
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: '高尔夫练习场 - 巡场记录与投诉跟进系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  imports: {
    dirs: ['stores']
  },
  runtimeConfig: {
    public: {
      appName: '高尔夫练习场管理系统'
    }
  }
})
