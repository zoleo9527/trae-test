import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { Wrench, Eye, EyeOff, AlertCircle, User, Shield, Headphones } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import type { UserRole } from '@/types'
import { roleLabels } from '@/utils/format'

const roleAccounts: { role: UserRole; username: string; password: string; description: string }[] = [
  { role: 'admin', username: 'admin', password: '123456', description: '全局监控、工单分配、异常升级' },
  { role: 'inspector', username: 'inspector01', password: '123456', description: '执行巡检、处理工单、上报故障' },
  { role: 'service', username: 'service01', password: '123456', description: '受理报修、创建工单、跟进退款' },
]

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    const account = roleAccounts.find((a) => a.role === role)
    if (account) {
      setUsername(account.username)
      setPassword(account.password)
    }
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await login(username, password)
      if (success) {
        navigate(from, { replace: true })
      } else {
        setError('账号或密码错误，请重试')
      }
    } catch (e) {
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return Shield
      case 'inspector':
        return Wrench
      case 'service':
        return Headphones
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="flex items-center mb-8">
            <div className="w-14 h-14 bg-indigo-500 rounded-xl flex items-center justify-center mr-4">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">自助洗车运维系统</h1>
              <p className="text-indigo-300 text-sm mt-1">场站巡检 · 故障报修 · 协同处理</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            让每一次故障<br />
            都得到及时响应
          </h2>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            打通巡检、报修、补货全链路，<br />
            运营主管、巡检员、客服高效协同，<br />
            告别信息割裂，让场站运维更简单。
          </p>

          <div className="space-y-4">
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
              <span>实时工单流转，超时自动预警</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
              <span>巡检异常一键报修，现场拍照留证</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse" />
              <span>退款申诉全流程可追溯</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">自助洗车运维系统</h1>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">欢迎回来</h2>
          <p className="text-slate-500 mb-8">选择您的角色登录系统</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {roleAccounts.map((account) => {
              const Icon = getRoleIcon(account.role)
              return (
                <button
                  key={account.role}
                  onClick={() => handleRoleSelect(account.role)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedRole === account.role
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      selectedRole === account.role ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      selectedRole === account.role ? 'text-indigo-700' : 'text-slate-600'
                    }`}
                  >
                    {roleLabels[account.role]}
                  </span>
                </button>
              )
            })}
          </div>

          {selectedRole && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
              <div className="flex items-start">
                <User className="w-4 h-4 mr-2 mt-0.5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700 mb-1">
                    {roleLabels[selectedRole]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {roleAccounts.find((a) => a.role === selectedRole)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                账号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="输入账号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                  placeholder="输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录系统'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <strong>演示账号：</strong>
              <br />
              运营主管：admin / 123456
              <br />
              巡检员：inspector01 / 123456
              <br />
              客服：service01 / 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
