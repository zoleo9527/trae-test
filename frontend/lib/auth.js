import Router from 'next/router'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'bd_auth'

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '登录失败')
    }
    const data = await res.json()
    setAuth(data)
    return data
  }, [])

  const switchRole = useCallback(async (username) => {
    const res = await fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || '切换失败')
    }
    const data = await res.json()
    setAuth(data)
    const route = data.user?.defaultRoute || '/'
    Router.replace(route)
    return data
  }, [])

  const logout = useCallback(() => {
    setAuth(null)
    Router.replace('/login')
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function fetcher(path, options = {}) {
  const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  const auth = raw ? JSON.parse(raw) : null
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`
  return fetch(path, { ...options, headers }).then(async (r) => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || `请求失败(${r.status})`)
    return data
  })
}
