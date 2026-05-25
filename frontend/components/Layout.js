import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { fetcher, useAuth } from '../lib/auth'

export default function Layout({ children }) {
  const { auth, switchRole, logout } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetcher('/api/auth/list').then(setUsers).catch(() => {})
  }, [])

  const navItems = [
    { href: '/', label: '概览', match: '/' },
    { href: '/activities', label: '作者活动', match: '/activities' },
    { href: '/distributions', label: '渠道对接', match: '/distributions' }
  ]

  return (
    <div className="app">
      <Head>
        <title>图书发行 · 作者活动与渠道对接</title>
      </Head>
      <header className="app-header">
        <div className="brand">图书发行工作台</div>
        <nav className="nav">
          {navItems.map((n) => {
            const isActive = router.pathname === n.match
            return (
              <Link key={n.href} href={n.href} legacyBehavior>
                <a className={isActive ? 'active' : ''}>{n.label}</a>
              </Link>
            )
          })}
        </nav>
        {auth && (
          <div className="user-area">
            <div className="role-switcher">
              <span style={{ color: '#6b7280' }}>当前:</span>
              <strong>{auth.user.name}</strong>
              <span className="tag">{auth.user.roleName}</span>
              <select
                value={auth.user.username}
                onChange={async (e) => {
                  try {
                    await switchRole(e.target.value)
                  } catch (err) {
                    alert(err.message)
                  }
                }}
              >
                <option value="">切换角色演示</option>
                {users.map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.name} · {u.roleName}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn ghost" onClick={logout}>
              退出
            </button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
