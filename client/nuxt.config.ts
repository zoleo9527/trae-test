export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],
  typescript: {
    strict: true,
    typeCheck: true
  },
  tailwindcss: {
    cssPath: ['~/assets/css/main.css', { injectPosition: 'first' }],
    configPath: 'tailwind.config'
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '商用清洁耗材管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '商用清洁耗材申领与补货预警系统' }
      ]
    }
  },
  imports: {
    dirs: ['stores', 'types', 'utils']
  }
})
