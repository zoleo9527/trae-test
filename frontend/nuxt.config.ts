export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000'
    }
  },
  colorMode: {
    preference: 'light'
  }
})
