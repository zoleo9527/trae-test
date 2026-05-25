const { useRouter } = require('next/router')
const { useEffect } = require('react')
const { useAuth } = require('../../lib/auth')

module.exports = function withAuth(Comp, opts = {}) {
  return function Wrapped(props) {
    const { auth } = useAuth()
    const router = useRouter()
    const roles = opts.roles || null

    useEffect(() => {
      if (!auth) {
        router.replace('/login?redirect=' + encodeURIComponent(router.asPath))
      } else if (roles && !roles.includes(auth.user.role)) {
        router.replace('/403')
      }
    }, [auth, router])

    if (!auth) {
      return (
        <div style={{ padding: 40, color: '#666' }}>
          正在验证登录态...
        </div>
      )
    }

    if (roles && !roles.includes(auth.user.role)) {
      return (
        <div style={{ padding: 40, color: '#c33' }}>
          当前角色无权访问此页面。
        </div>
      )
    }

    return <Comp {...props} />
  }
}
