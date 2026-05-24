import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, ClipboardCheck, Wrench, Users, Menu, X, 
  User, ChevronDown 
} from 'lucide-react'

const menuItems = [
  { path: '/', name: '工作台', icon: Home },
  { path: '/inspections', name: '巡检管理', icon: ClipboardCheck },
  { path: '/rectifications', name: '整改管理', icon: Wrench },
]

const currentUser = {
  id: 1,
  name: '张监理',
  role: 'supervisor'
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={`fixed left-0 top-0 z-40 h-screen bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <span className="text-lg font-bold text-blue-600">家装监理系统</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="mt-6 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mb-2 flex items-center rounded-lg px-4 py-3 transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <div className="text-lg font-semibold text-gray-800">
            {menuItems.find(item => location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path)))?.name || '工作台'}
          </div>
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <User size={18} className="text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white py-2 shadow-lg">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentUser.role === 'supervisor' ? '监理负责人' : 
                     currentUser.role === 'manager' ? '项目管家' : '业主客服'}
                  </p>
                </div>
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

export { currentUser }
