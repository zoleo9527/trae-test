import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, theme, Layout, Menu, Button, Card, Form, Input, message, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  OrderedListOutlined,
  LoadingOutlined,
  WarningOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardPage from './pages/Dashboard';
import OrdersPage from './pages/Orders';
import LoadingPage from './pages/Loading';
import ExceptionsPage from './pages/Exceptions';
import './App.css';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '看板' },
  { key: '/orders', icon: <OrderedListOutlined />, label: '起苗排单' },
  { key: '/loading', icon: <LoadingOutlined />, label: '装车复核' },
  { key: '/exceptions', icon: <WarningOutlined />, label: '异常管理' },
];

function LoginPage() {
  const { login, loading } = useAuth();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      await login(values.username);
      message.success('登录成功');
    } catch {
      message.error('登录失败，请检查用户名');
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card" title="苗木基地管理系统">
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">测试账号：</Text>
          <div style={{ marginTop: 8 }}>
            <Text code>zhangjg</Text> <Text type="secondary">张建国（基地负责人）</Text>
          </div>
          <div>
            <Text code>liyh</Text> <Text type="secondary">李养护（养护员）</Text>
          </div>
          <div>
            <Text code>wanggd</Text> <Text type="secondary">王跟单（销售跟单）</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <Layout className="app-layout">
      <Sider className="app-sider" theme="dark" width={200}>
        <div style={{ height: 48, margin: '12px 16px', color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold', lineHeight: '48px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          苗木基地管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <div />
          <Space>
            <Text strong>{user?.display_name}</Text>
            <Text type="secondary">({user?.role})</Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
              退出
            </Button>
          </Space>
        </Header>
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/loading" element={<LoadingPage />} />
            <Route path="/exceptions" element={<ExceptionsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <ConfigProvider theme={{ algorithm: theme.compactAlgorithm, token: { colorPrimary: '#1677ff' } }}>
      <BrowserRouter>
        {user ? <AppLayout /> : <LoginPage />}
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
