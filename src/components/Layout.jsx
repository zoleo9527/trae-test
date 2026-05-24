import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  AlertTriangle, 
  DollarSign, 
  QrCode, 
  Printer, 
  ExternalLink,
  ChevronDown,
  User
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/cn';
import { users, roleMap } from '../data/mockData';

const menuItems = [
  { path: '/', icon: Home, label: '首页仪表盘' },
  { path: '/change-orders', icon: FileText, label: '变更签认' },
  { path: '/rectification', icon: AlertTriangle, label: '整改追踪' },
  { path: '/fee-tracking', icon: DollarSign, label: '费用确认' },
];

export default function Layout({ children, currentUser, onUserChange, onOpenScan }) {
  const location = useLocation();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handlePrint = async () => {
    if (window.electron) {
      const content = document.getElementById('print-content')?.innerHTML || '<h1>暂无打印内容</h1>';
      await window.electron.invoke('print-receipt', content);
    } else {
      window.print();
    }
  };

  const handleOpenNewWindow = async (url) => {
    if (window.electron) {
      await window.electron.invoke('open-new-window', url);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 font-semibold text-gray-900">家装监理系统</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className={cn('w-5 h-5 mr-3', isActive ? 'text-primary-600' : 'text-gray-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onOpenScan}
            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <QrCode className="w-5 h-5 mr-3 text-gray-400" />
            扫码录入
          </button>
          <button
            onClick={handlePrint}
            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Printer className="w-5 h-5 mr-3 text-gray-400" />
            打印回执
          </button>
          <button
            onClick={() => handleOpenNewWindow(location.pathname)}
            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5 mr-3 text-gray-400" />
            新开窗口
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {menuItems.find(m => location.pathname.startsWith(m.path))?.label || '首页仪表盘'}
            </h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">{currentUser.avatar}</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
                <div className="text-xs text-gray-500">{roleMap[currentUser.role]?.label}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs text-gray-500 mb-2">切换角色</div>
                  </div>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onUserChange(user);
                        setUserDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center px-4 py-2 text-sm hover:bg-gray-50',
                        currentUser.id === user.id ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                      )}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{roleMap[user.role]?.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
