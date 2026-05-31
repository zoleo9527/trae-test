'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, ClipboardList, ChefHat, Package, TrendingDown, 
  RefreshCw, FileText, Users, Menu, X 
} from 'lucide-react';
import { api, authTokens, roleNames } from '@/lib/api';

interface User {
  id: string;
  name: string;
  role: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('owner');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
  }, [currentRole]);

  const loadUser = async () => {
    try {
      localStorage.setItem('auth_token', authTokens[currentRole as keyof typeof authTokens]);
      const res = await api.get('/common/me');
      setUser(res.data);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const navItems: NavItem[] = [
    { label: '仪表盘', href: '/', icon: <Home size={20} /> },
    { label: '订单管理', href: '/orders', icon: <ClipboardList size={20} />, roles: ['OWNER', 'CUSTOMER_SERVICE'] },
    { label: '生产排期', href: '/productions', icon: <ChefHat size={20} />, roles: ['OWNER', 'KITCHEN'] },
    { label: '原料管理', href: '/materials', icon: <Package size={20} />, roles: ['OWNER', 'KITCHEN'] },
    { label: '损耗分析', href: '/waste', icon: <TrendingDown size={20} />, roles: ['OWNER'] },
    { label: '库存盘点', href: '/inventory', icon: <RefreshCw size={20} />, roles: ['OWNER', 'KITCHEN'] },
    { label: '退款管理', href: '/refunds', icon: <FileText size={20} />, roles: ['OWNER', 'CUSTOMER_SERVICE'] },
    { label: '审计日志', href: '/audit', icon: <Users size={20} />, roles: ['OWNER'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || !user || item.roles.includes(user.role)
  );

  return (
    <div className="flex min-h-screen">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 text-white transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-700">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">🍞 烘焙坊</h1>
              <p className="text-xs text-gray-400">管理系统</p>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="p-2">
          {filteredNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                pathname === item.href 
                  ? 'bg-amber-700 text-white' 
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {filteredNavItems.find(item => item.href === pathname)?.label || '仪表盘'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">角色切换:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="owner">门店主理人</option>
                <option value="kitchen">后厨负责人</option>
                <option value="cs">客服</option>
              </select>
            </div>
            
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{roleNames[user.role]}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
