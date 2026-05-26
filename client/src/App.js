import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CoffeeOutlined,
  PhoneOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  LogoutOutlined
} from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Trials from './pages/Trials';
import Followups from './pages/Followups';
import Orders from './pages/Orders';
import Approvals from './pages/Approvals';
import Exceptions from './pages/Exceptions';
import CustomerDetail from './pages/CustomerDetail';
import TrialDetail from './pages/TrialDetail';
import OrderDetail from './pages/OrderDetail';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台', path: '/' },
  { key: '/customers', icon: <UserOutlined />, label: '客户管理', path: '/customers' },
  { key: '/trials', icon: <CoffeeOutlined />, label: '试饮记录', path: '/trials' },
  { key: '/followups', icon: <PhoneOutlined />, label: '回访排班', path: '/followups' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单管理', path: '/orders' },
  { key: '/approvals', icon: <CheckCircleOutlined />, label: '审批中心', path: '/approvals' },
  { key: '/exceptions', icon: <WarningOutlined />, label: '异常处理', path: '/exceptions' },
];

const userItems = [
  { key: '1', label: '个人设置', icon: <UserOutlined /> },
  { key: '2', label: '退出登录', icon: <LogoutOutlined />, danger: true }
];

function AppContent() {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState('/');

  useEffect(() => {
    setSelectedKey(location.pathname.split('/')[1] ? '/' + location.pathname.split('/')[1] : '/');
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          🍵 茶叶经销系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.path}>{item.label}</Link>
          }))}
        />
      </Sider>
      <Layout>
        <Header className="site-layout-header" style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>茶叶经销-客户试饮与回访跟进</h2>
          <Dropdown menu={{ items: userItems }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>张</Avatar>
              <span>张明（经销负责人）</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#f0f2f5' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/trials" element={<Trials />} />
            <Route path="/trials/:id" element={<TrialDetail />} />
            <Route path="/followups" element={<Followups />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/exceptions" element={<Exceptions />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
