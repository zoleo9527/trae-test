import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  PhoneOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/work-orders',
      icon: <FileTextOutlined />,
      label: '工单管理',
    },
    {
      key: '/follow-ups',
      icon: <PhoneOutlined />,
      label: '回访管理',
    },
    {
      key: '/members',
      icon: <UserOutlined />,
      label: '会员管理',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      manager: '门店经理',
      sales: '销售员',
      workshop: '工坊师傅',
      customer_service: '客服专员',
    };
    return roleMap[role] || role;
  };

  return (
    <Layout className="layout">
      <Sider theme="dark" width={200}>
        <div className="logo">珠宝售后系统</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-header" style={{ background: '#fff', padding: '0 24px' }}>
          <div></div>
          <div className="user-info">
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                  {user?.realName?.charAt(0)}
                </Avatar>
                <span>
                  {user?.realName} ({getRoleName(user?.role || '')})
                </span>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: '24px', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
