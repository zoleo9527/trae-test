import { Layout, Menu, Avatar, Button, Dropdown } from 'antd'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  WarningOutlined,
  SearchOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import type { User } from '../types'
import { ROLE_NAMES } from '../types'

const { Header, Sider, Content } = Layout

interface MainLayoutProps {
  user: User
  onLogout: () => void
  children: React.ReactNode
}

export default function MainLayout({ user, onLogout, children }: MainLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/batches',
      icon: <UnorderedListOutlined />,
      label: '批次管理',
    },
    {
      key: '/sorting',
      icon: <AppstoreOutlined />,
      label: '收衣分拣',
    },
    {
      key: '/damages',
      icon: <WarningOutlined />,
      label: '污损复判',
    },
    {
      key: '/search',
      icon: <SearchOutlined />,
      label: '衣物查询',
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: onLogout
    }
  ]

  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-logo">洗涤工厂管理系统</div>
        <div className="user-info">
          <Dropdown menu={{ items: userMenuItems }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name} ({ROLE_NAMES[user.role]})</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider className="app-sider" width={200}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => navigate(key)}
          />
        </Sider>
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
