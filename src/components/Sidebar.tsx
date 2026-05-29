import { NavLink, useNavigate } from 'react-router-dom'
import {
  Home,
  Film,
  Calendar,
  LogOut,
  Camera,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const navItems = [
  { path: '/', label: '工作台', icon: Home },
  { path: '/rolls', label: '胶卷管理', icon: Film },
  { path: '/calendar', label: '日历视图', icon: Calendar },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleName = {
    owner: '店主',
    developer: '冲印师',
    cs: '客服',
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C4813D] flex items-center justify-center text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">胶片冲印</h1>
            <p className="text-xs text-gray-400">协作管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#C4813D] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-[#F5F0EB] flex items-center justify-center text-[#C4813D] font-bold">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{currentUser?.name}</p>
            <p className="text-xs text-gray-400">{roleName[currentUser?.role || 'owner']}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </button>
      </div>
    </aside>
  )
}
