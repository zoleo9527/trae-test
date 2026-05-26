import {
    DashboardOutlined,
    DollarOutlined,
    EyeOutlined,
    PhoneOutlined,
    SwapOutlined,
    ToolOutlined,
} from '@ant-design/icons'
import { Layout, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '首页看板' },
  { key: '/repairs', icon: <ToolOutlined />, label: '售后返修' },
  { key: '/visits', icon: <PhoneOutlined />, label: '回访提醒' },
  { key: '/lens-transfers', icon: <SwapOutlined />, label: '镜片调拨' },
  { key: '/refunds', icon: <DollarOutlined />, label: '退款记录' },
  { key: '/optometry', icon: <EyeOutlined />, label: '验光单' },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{ background: '#001529' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          background: '#002140',
        }}>
          眼镜售后管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <h1>眼镜连锁 - 售后返修与回访提醒系统</h1>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
