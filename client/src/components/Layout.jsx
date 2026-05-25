import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskApi, notificationApi } from '../services/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [taskCount, setTaskCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCounts = async () => {
    try {
      const [tasksRes, notifRes] = await Promise.all([
        taskApi.getMy({ status: 'pending' }),
        notificationApi.getUnreadCount()
      ]);
      setTaskCount(tasksRes.data.length);
      setNotifCount(notifRes.data.count);
    } catch (err) {
      console.error('加载计数失败:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleNames = {
    theater_manager: '剧院经理',
    ticket_supervisor: '票务主管',
    backend_coordinator: '后台统筹'
  };

  const getNavItems = () => {
    const baseItems = [
      { to: '/', label: '工作台', icon: '🏠' },
      { to: '/performances', label: '演出排期', icon: '🎭' },
      { to: '/chain', label: '链条追踪', icon: '🔗' }
    ];

    if (user?.role === 'theater_manager') {
      return [
        ...baseItems,
        { to: '/orders', label: '团单管理', icon: '🎫' },
        { to: '/rehearsals', label: '联排管理', icon: '🎬' }
      ];
    } else if (user?.role === 'ticket_supervisor') {
      return [
        ...baseItems,
        { to: '/orders', label: '团单管理', icon: '🎫' }
      ];
    } else if (user?.role === 'backend_coordinator') {
      return [
        ...baseItems,
        { to: '/rehearsals', label: '联排管理', icon: '🎬' }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🎭 剧院管理系统</h1>
          <p>{roleNames[user?.role] || '系统'}</p>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-item"
              end={item.to === '/'}
            >
              <span style={{ marginRight: 10 }}>{item.icon}</span>
              {item.label}
              {item.to === '/' && taskCount > 0 && (
                <span className="badge">{taskCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="user-details">
              <h4>{user?.name || '用户'}</h4>
              <p>{roleNames[user?.role] || ''}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet context={{ taskCount, notifCount, refreshCounts: loadCounts }} />
      </main>
    </div>
  );
};

export default Layout;
