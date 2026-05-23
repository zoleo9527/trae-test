import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Space, Typography, Badge } from 'antd';
import { 
  DashboardOutlined, 
  SwapOutlined, 
  UnorderedListOutlined, 
  GiftOutlined,
  ShopOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROLE_LABELS } from '../utils/constants';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
    },
    {
      key: '/transfers',
      icon: <SwapOutlined />,
      label: '调货管理',
    },
    {
      key: '/inventory',
      icon: <UnorderedListOutlined />,
      label: '盘点管理',
    },
    {
      key: '/repairs',
      icon: <ToolOutlined />,
      label: '返修管理',
    },
    {
      key: '/products',
      icon: <GiftOutlined />,
      label: '货品查询',
    },
    {
      key: '/stores',
      icon: <ShopOutlined />,
      label: '门店数据',
    }
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.name} (${ROLE_LABELS[user?.role] || user?.role})`,
      disabled: true
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold'
        }}>
          {collapsed ? '💎' : '💎 珠宝管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <Text strong style={{ fontSize: 16 }}>
            {menuItems.find(item => item.key === location.pathname)?.label || '珠宝门店管理系统'}
          </Text>
          <Space size={16}>
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
