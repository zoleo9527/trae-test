import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_NAMES } from '../App';

const ROLE_MENUS = {
  channel_manager: [
    { path: '/', label: '工作台', icon: '📊' },
    { path: '/shipments', label: '样书寄送', icon: '📦' },
    { path: '/feedbacks', label: '渠道反馈', icon: '💬' },
    { path: '/returns', label: '退货申请', icon: '↩️' },
    { path: '/issues', label: '问题追踪', icon: '⚠️' }
  ],
  distribution_specialist: [
    { path: '/', label: '工作台', icon: '📊' },
    { path: '/shipments', label: '寄送管理', icon: '📦' },
    { path: '/feedbacks', label: '反馈处理', icon: '💬' },
    { path: '/returns', label: '退货审批', icon: '↩️' },
    { path: '/issues', label: '问题追踪', icon: '⚠️' }
  ],
  finance: [
    { path: '/', label: '工作台', icon: '📊' },
    { path: '/shipments', label: '寄送查询', icon: '📦' },
    { path: '/returns', label: '退货对账', icon: '↩️' },
    { path: '/reconciliations', label: '对账管理', icon: '📋' },
    { path: '/issues', label: '问题追踪', icon: '⚠️' }
  ]
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const menus = ROLE_MENUS[user?.role] || [];
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>图书发行系统</h1>
          <p className="subtitle">样书寄送与反馈汇总</p>
        </div>
        <ul className="nav-menu">
          {menus.map(menu => (
            <li key={menu.path} className="nav-item">
              <NavLink to={menu.path} end={menu.path === '/'}>
                <span className="nav-icon">{menu.icon}</span>
                {menu.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      
      <main className="main-content">
        <div className="header">
          <h2>
            {user?.role === 'channel_manager' && '渠道经理工作台'}
            {user?.role === 'distribution_specialist' && '发行专员工作台'}
            {user?.role === 'finance' && '财务对账工作台'}
          </h2>
          <div className="user-info">
            <span className="user-role">{ROLE_NAMES[user?.role]}</span>
            <span>{user?.name}</span>
            <button className="logout-btn" onClick={handleLogout}>退出</button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
