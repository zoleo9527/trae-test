// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  modules: ['@element-plus/nuxt'],
  elementPlus: {
    importStyle: 'css'
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api'
    }
  },
  css: ['~/assets/main.css'],
  app: {
    head: {
      title: '婚纱影楼 · 修片回传与客户复核工作台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  vue: {
    compilerOptions: {
      hoistStatic: false
    }
  },
  vite: {
    vue: {
      script: {
        macros: false
      }
    }
  }
})
