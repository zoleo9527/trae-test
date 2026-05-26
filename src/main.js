import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/global.css'
import { initStorage } from './utils/storage'

async function bootstrap() {
  await initStorage()
  
  const app = createApp(App)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

bootstrap()
