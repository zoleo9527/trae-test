import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, auth } = useAuth()
  const [username, setUsername] = useState('channel_mgr')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (auth) router.replace(auth.user?.defaultRoute || '/')
  }, [auth, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const data = await login(username, password)
      const redirect = router.query.redirect || data.user?.defaultRoute || '/'
      router.replace(redirect)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>图书发行工作台</h1>
        <div className="sub">作者活动与渠道对接 · 登录</div>
        <div className="field">
          <label>账号</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入账号"
            autoFocus
          />
        </div>
        <div className="field">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
          />
        </div>
        {err && <div style={{ color: '#c33', fontSize: 12 }}>{err}</div>}
        <button type="submit" className="btn primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
        <div className="tip">
          演示账号（密码统一 <code>123456</code>）：
          <br />
          渠道经理 <code>channel_mgr</code> · 发行专员 <code>dist_specialist</code> · 财务 <code>finance</code> · 管理员 <code>admin</code>
        </div>
      </form>
    </div>
  )
}
