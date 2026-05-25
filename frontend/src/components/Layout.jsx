import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Package,
  CalendarDays,
  Search,
  Menu,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/schedules', label: '志愿者排班', icon: Calendar },
  { path: '/feedbacks', label: '观众反馈', icon: MessageSquare },
  { path: '/exhibits', label: '展品流转', icon: Package },
  { path: '/activities', label: '活动核销', icon: CalendarDays },
  { path: '/review', label: '回查面板', icon: Search },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={clsx(
          'bg-museum-800 text-white transition-all duration-300 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="p-4 border-b border-museum-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold">美术馆运营系统</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-museum-700 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-museum-600 text-white'
                    : 'text-museum-200 hover:bg-museum-700 hover:text-white'
                )}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
