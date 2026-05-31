import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    token: null as string | null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name
  },

  actions: {
    async login(username: string, password: string) {
      const api = useAPI()
      const res: any = await api.post('/auth/login', { username, password })
      this.token = res.access_token
      this.user = res.user
      const tokenCookie = useCookie('access_token')
      tokenCookie.value = res.access_token
      const userCookie = useCookie('user_info')
      userCookie.value = JSON.stringify(res.user)
      return res
    },

    logout() {
      this.token = null
      this.user = null
      const tokenCookie = useCookie('access_token')
      tokenCookie.value = null
      const userCookie = useCookie('user_info')
      userCookie.value = null
      const router = useRouter()
      router.push('/login')
    },

    checkAuth() {
      const tokenCookie = useCookie('access_token')
      const userCookie = useCookie('user_info')
      if (tokenCookie.value && userCookie.value) {
        this.token = tokenCookie.value
        this.user = JSON.parse(userCookie.value)
        return true
      }
      return false
    }
  }
})
