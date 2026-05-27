import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  MapPin,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { roleLabels } from '@/utils/format'
import type { UserRole } from '@/types'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '工作台' },
  { path: '/inspection', icon: ClipboardList, label: '巡检任务' },
  { path: '/workorders', icon: Wrench, label: '工单中心' },
  { path: '/sites', icon: MapPin, label: '站点管理' },
]

export function Sidebar() {
  const { user, logout, switchRole } = useAuthStore()
  const navigate = useNavigate()
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role)
    setShowRoleMenu(false)
  }

  if (!user) return null

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50">
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mr-3">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg">洗车运维</h1>
          <p className="text-xs text-slate-400">场站巡检系统</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-slate-700">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-9 h-9 rounded-full bg-slate-600 mr-3"
            />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-slate-400">{roleLabels[user.role]}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden">
              <div className="px-3 py-2 text-xs text-slate-400 border-b border-slate-700">
                切换角色（演示用）
              </div>
              {(['admin', 'inspector', 'service'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleSwitchRole(role)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors flex items-center ${
                    user.role === role ? 'text-indigo-400' : 'text-slate-300'
                  }`}
                >
                  <User className="w-4 h-4 mr-2" />
                  {roleLabels[role]}
                  {user.role === role && (
                    <span className="ml-auto text-xs">当前</span>
                  )}
                </button>
              ))}
              <div className="border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 transition-colors flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
