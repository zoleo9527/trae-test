import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Truck,
  RotateCcw,
  Warehouse,
  MessageSquare,
  Users,
  Menu,
  ChevronDown,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { cn, getRoleName } from '../utils'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '数据看板', roles: ['station_master', 'driver', 'customer_service'] },
  { path: '/orders', icon: Package, label: '订单管理', roles: ['station_master', 'customer_service'] },
  { path: '/deliveries', icon: Truck, label: '配送管理', roles: ['station_master', 'driver'] },
  { path: '/bucket-returns', icon: RotateCcw, label: '空桶回收', roles: ['station_master', 'driver', 'customer_service'] },
  { path: '/inventory', icon: Warehouse, label: '库存对账', roles: ['station_master'] },
  { path: '/complaints', icon: MessageSquare, label: '客诉管理', roles: ['station_master', 'customer_service'] },
  { path: '/users', icon: Users, label: '人员管理', roles: ['station_master'] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { currentUser, setCurrentUser, users } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(currentUser.role)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-blue-600">桶装水配送</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map(item => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(m => m.path === location.pathname)?.label || '系统'}
            </h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{getRoleName(currentUser.role)}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm text-gray-500">切换角色</p>
                </div>
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user)
                      setUserMenuOpen(false)
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3',
                      user.id === currentUser.id && 'bg-blue-50 text-blue-600'
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
