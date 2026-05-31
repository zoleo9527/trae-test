import { useState, useEffect } from 'react'
import { Layout, Menu, Dropdown, Avatar, Badge, message } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  CheckSquareOutlined,
  ProjectOutlined,
  FileTextOutlined,
  UserOutlined,
  SwitcherOutlined,
  LogoutOutlined
} from 'antd/icons'
import useAuthStore from '../stores/useAuthStore'
import { notificationsAPI } from '../services/api'

const { Header, Content, Sider } = Layout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/review', icon: <CheckSquareOutlined />, label: '批量复核' },
  { key: '/projects', icon: <ProjectOutlined />, label: '项目管理' },
  { key: '/renewals', icon: <FileTextOutlined />, label: '续约回访' }
]

const roleLabels = {
  admin: '系统管理员',
  manager: '项目主管',
  scheduler: '排班专员',
  inspector: '质检员',
  cleaner: '清洁员'
}

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user) {
      notificationsAPI.getUnreadCount(user.id).then(res => {
        setUnreadCount(res.data.count)
      })
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
    message.success('已退出登录')
  }

  const userMenu = {
    items: [
      {
        key: '1',
        icon: <UserOutlined />,
        label: `${user?.name} - ${roleLabels[user?.role]}`
      },
      { type: 'divider' },
      {
        key: '2',
        icon: <SwitcherOutlined />,
        label: '切换角色',
        onClick: () => {
          logout()
          navigate('/login')
        }
      },
      {
        key: '3',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout
      }
    ]
  }

  return (
    <Layout className="layout">
      <Header className="header">
        <div className="logo">商用清洁管理系统</div>
        <Dropdown menu={userMenu} placement="bottomRight">
          <div style={{ cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge count={unreadCount} size="small">
              <Avatar icon={<UserOutlined />} />
            </Badge>
            <span>{user?.name}</span>
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            onClick={({ key }) => navigate(key)}
          >
              {menuItems.map(item => (
                <Menu.Item key={item.key} icon={item.icon}>
                  {item.label}
                </Menu.Item>
              ))}
            </Menu>
          </Sider>
          <Layout style={{ padding: '0 24px 24px' }}>
            <Content className="content">
              <Outlet />
            </Content>
          </Layout>
        </Layout>
      </Layout>
  )
}

export default MainLayout
