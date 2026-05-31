export default defineNuxtConfig({
  devtools: { enabled: true },
  components: [
    { path: '~/components/common', prefix: '' },
    { path: '~/components/dashboard', prefix: '' },
    { path: '~/components/layout', prefix: '' },
    { path: '~/components/workorder', prefix: '' },
  ],
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  typescript: {
    strict: true,
    typeCheck: false
  },
  app: {
    head: {
      title: '钟表售后管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '钟表售后管理系统 - 报价审批与客户确认' }
      ]
    }
  }
})
