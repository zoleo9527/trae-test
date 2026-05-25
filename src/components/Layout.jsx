import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Menu,
  X,
  BookOpen,
} from 'lucide-react'

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/distributions', label: '铺货管理', icon: Package },
  { path: '/returns', label: '退货处理', icon: RefreshCw },
  { path: '/payments', label: '回款跟踪', icon: DollarSign },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-lg text-gray-800">图书发行系统</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">张</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">张经理</p>
                <p className="text-sm text-gray-500">渠道经理</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800">
            {menuItems.find((item) => item.path === location.pathname)?.label || '工作台'}
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">2024年5月25日</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
