export const useAuth = () => {
  const token = useState<string | null>('auth-token', () => null)
  const user = useState<any | null>('auth-user', () => null)

  const login = async (username: string, password: string) => {
    const config = useRuntimeConfig()
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    
    try {
      const response: any = await $fetch(`${config.public.apiBase}/token`, {
        method: 'POST',
        body: formData
      })
      token.value = response.access_token
      user.value = response.user
      return { success: true }
    } catch (e) {
      return { success: false, error: '登录失败，请检查账号密码' }
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/login')
  }

  const isLoggedIn = computed(() => !!token.value)

  return {
    token,
    user,
    login,
    logout,
    isLoggedIn
  }
}
