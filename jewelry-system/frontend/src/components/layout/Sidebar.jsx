import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  FileText,
  RefreshCcw,
  DollarSign,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Bell,
  Settings,
  User,
  AlertTriangle,
  Clock,
  Info,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: '工作台', path: '/' },
  { id: 'cases', icon: FileCheck, label: '签证进度', path: '/cases' },
  { id: 'documents', icon: FileText, label: '材料管理', path: '/documents' },
  { id: 'supplements', icon: RefreshCcw, label: '补件回查', path: '/supplements' },
  { id: 'refunds', icon: DollarSign, label: '退款协商', path: '/refunds' },
  { id: 'reports', icon: BarChart3, label: '数据报表', path: '/reports' }
];

export function Sidebar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { currentRole, currentUser, ROLE_NAMES, hasPermission } = useAuth();
  const location = useLocation();
  const notificationRef = useRef(null);

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.id));
  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = async () => {
    if (loadingNotifications) return;
    setLoadingNotifications(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      toast.error(`加载通知失败: ${err.message}`);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      loadNotifications();
    }
  }, [showNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-50 hover:bg-red-100';
      case 'warning':
        return 'bg-amber-50 hover:bg-amber-100';
      case 'success':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  return (
    <div className={`relative h-screen bg-slate-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">签证管理</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentUser.name}</p>
              <StatusBadge status="approved" text={ROLE_NAMES[currentRole]} />
            </div>
          </div>
        </div>
      )}

      <nav className="p-2">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700" ref={notificationRef}>
          <div className="space-y-2">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span>通知中心</span>
              </button>

              {showNotifications && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">最新通知</h4>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
                        加载中...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        暂无新通知
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            if (notification.caseId) {
                              navigate(`/cases/${notification.caseId}`);
                            }
                            setShowNotifications(false);
                          }}
                          className={`w-full p-3 text-left border-b border-gray-50 last:border-b-0 transition-colors ${getNotificationBg(notification.type)}`}
                        >
                          <div className="flex items-start gap-2">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
              <span>系统设置</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
