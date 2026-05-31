import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: null as string | null,
    _initialized: false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name
  },

  actions: {
    initAuth() {
      if (this._initialized) return
      if (process.client) {
        const tokenCookie = useCookie('access_token')
        const userCookie = useCookie('user_info')
        if (tokenCookie.value && userCookie.value) {
          this.token = tokenCookie.value as string
          try {
            this.user = JSON.parse(userCookie.value as string)
          } catch (e) {
            this.user = null
          }
        }
      }
      this._initialized = true
    },

    async login(username: string, password: string) {
      const api = useAPI()
      const res: any = await api.post('/auth/login', { username, password })
      this.token = res.access_token
      this.user = res.user

      const tokenCookie = useCookie('access_token', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
      const userCookie = useCookie('user_info', {
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
      tokenCookie.value = res.access_token
      userCookie.value = JSON.stringify(res.user)

      this._initialized = true
      return res
    },

    logout() {
      this.token = null
      this.user = null
      this._initialized = false

      const tokenCookie = useCookie('access_token', { path: '/' })
      const userCookie = useCookie('user_info', { path: '/' })
      tokenCookie.value = null
      userCookie.value = null

      if (process.client) {
        const router = useRouter()
        router.push('/login')
      }
    },

    checkAuth() {
      if (!this._initialized) {
        this.initAuth()
      }
      return !!this.token
    }
  }
})
