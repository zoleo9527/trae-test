import { Link, useLocation, useParams } from 'react-router-dom';
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
import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';
import { users, roleMap, typeMap } from '../data/mockData';
import { useApp } from '../context/AppContext';

const menuItems = [
  { path: '/', icon: Home, label: '首页仪表盘' },
  { path: '/change-orders', icon: FileText, label: '变更签认' },
  { path: '/rectification', icon: AlertTriangle, label: '整改追踪' },
  { path: '/fee-tracking', icon: DollarSign, label: '费用确认' },
];

function RouteParams({ children }) {
  const params = useParams();
  return children(params);
}

export default function Layout({ children, currentUser, onUserChange, onOpenScan }) {
  const location = useLocation();
  const { changeOrders } = useApp();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    const match = location.pathname.match(/^\/change-orders\/(.+)$/);
    if (match) {
      const orderId = match[1];
      const order = changeOrders.find(o => o.id === orderId);
      setCurrentOrder(order);
    } else {
      setCurrentOrder(null);
    }
  }, [location.pathname, changeOrders]);

  const generatePrintContent = (order) => {
    if (!order) {
      return `
        <div class="header">
          <div class="title">家装监理系统</div>
          <div class="subtitle">操作回执</div>
        </div>
        <table class="info-table">
          <tr><td class="label">打印时间</td><td>${new Date().toLocaleString()}</td></tr>
          <tr><td class="label">当前页面</td><td>${location.pathname}</td></tr>
          <tr><td class="label">操作人</td><td>${currentUser.name}</td></tr>
        </table>
        <div class="footer">家装监理系统 - 变更签认与费用追踪</div>
      `;
    }

    return `
      <div class="header">
        <div class="title">工程变更单回执</div>
        <div class="subtitle">${order.id}</div>
      </div>
      <table class="info-table">
        <tr><td class="label">项目名称</td><td>${order.projectName}</td></tr>
        <tr><td class="label">变更类型</td><td>${typeMap[order.type]?.label || order.type}</td></tr>
        <tr><td class="label">变更内容</td><td>${order.title}</td></tr>
        <tr><td class="label">变更原因</td><td>${order.reason}</td></tr>
        <tr><td class="label">版本</td><td>v${order.version}</td></tr>
        <tr><td class="label">详细描述</td><td>${order.description}</td></tr>
        <tr><td class="label">原费用</td><td>¥${order.costChange.original.toLocaleString()}</td></tr>
        <tr><td class="label">变更后费用</td><td>¥${order.costChange.new.toLocaleString()}</td></tr>
        <tr><td class="label">费用差额</td><td>${order.costChange.difference > 0 ? '+' : ''}¥${order.costChange.difference.toLocaleString()}</td></tr>
        <tr><td class="label">备注</td><td>${order.costChange.note}</td></tr>
      </table>
      <div style="margin-top: 20px;">
        <div style="font-weight: bold; margin-bottom: 10px;">审批记录：</div>
        <table class="info-table">
          <tr><td class="label">监理审核</td><td>${order.approvals.supervisor?.approved ? '通过 - ' + order.approvals.supervisor.user : '待审核'}</td></tr>
          <tr><td class="label">管家审核</td><td>${order.approvals.manager?.approved === true ? '通过 - ' + order.approvals.manager.user : order.approvals.manager?.approved === false ? '驳回 - ' + order.approvals.manager.user : '待审核'}</td></tr>
          <tr><td class="label">业主确认</td><td>${order.approvals.owner?.approved ? '已确认 - 业主' : '待确认'}</td></tr>
        </table>
      </div>
      <div class="sign-section">
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>监理负责人签字</div>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>项目管家签字</div>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>业主签字</div>
        </div>
      </div>
      <div class="footer">打印时间：${new Date().toLocaleString()}</div>
    `;
  };

  const handlePrint = async () => {
    const content = generatePrintContent(currentOrder);
    
    if (window.electron) {
      await window.electron.invoke('print-receipt', content);
    } else {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>打印回执</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .subtitle { font-size: 14px; color: #666; }
              .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .info-table td { padding: 10px; border: 1px solid #ddd; }
              .info-table .label { background: #f5f5f5; width: 150px; font-weight: 500; }
              .sign-section { margin-top: 40px; display: flex; justify-content: space-between; }
              .sign-box { width: 200px; text-align: center; }
              .sign-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 10px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>${content}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleOpenNewWindow = async (url) => {
    if (window.electron) {
      await window.electron.invoke('open-new-window', url);
    } else {
      window.open('/#' + url, '_blank');
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
            className={cn(
              'w-full flex items-center px-4 py-2.5 text-sm rounded-lg transition-colors',
              currentOrder 
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100' 
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Printer className={cn('w-5 h-5 mr-3', currentOrder ? 'text-primary-500' : 'text-gray-400')} />
            {currentOrder ? '打印当前变更单' : '打印回执'}
          </button>
          <button
            onClick={() => handleOpenNewWindow(location.pathname)}
            className="w-full flex items-center px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5 mr-3 text-gray-400" />
            新开窗口
          </button>
          
          {currentOrder && (
            <div className="mt-2 p-3 bg-primary-50 rounded-lg border border-primary-100">
              <div className="text-xs text-primary-600 font-medium mb-1">当前变更单</div>
              <div className="text-sm font-medium text-gray-900">{currentOrder.id}</div>
              <div className="text-xs text-gray-500 truncate">{currentOrder.title}</div>
            </div>
          )}
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
