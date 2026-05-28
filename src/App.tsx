import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Badge, theme } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  FilmOutlined,
  HistoryOutlined,
  BellOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Films from './pages/Films'
import FilmDetail from './pages/FilmDetail'
import ProcessRecords from './pages/ProcessRecords'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import { reminderApi } from './services/api'
import type { Reminder } from './types'

const { Header, Sider, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [reminderCount, setReminderCount] = useState(0)
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  useEffect(() => {
    loadReminderCount()
    const interval = setInterval(loadReminderCount, 60000)
    return () => clearInterval(interval)
  }, [])

  const loadReminderCount = async () => {
    try {
      const result = await reminderApi.getList()
      setReminderCount(result.total)
    } catch (e) {
      console.error('加载提醒数量失败', e)
    }
  }

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">首页看板</Link>,
    },
    {
      key: '/members',
      icon: <UserOutlined />,
      label: <Link to="/members">会员管理</Link>,
    },
    {
      key: '/films',
      icon: <FilmOutlined />,
      label: <Link to="/films">胶卷寄存</Link>,
    },
    {
      key: '/process',
      icon: <HistoryOutlined />,
      label: <Link to="/process">处理记录</Link>,
    },
    {
      key: '/reminders',
      icon: <Badge count={reminderCount} size="small"><BellOutlined /></Badge>,
      label: <Link to="/reminders">到期提醒</Link>,
    },
    {
      key: '/audit',
      icon: <FileTextOutlined />,
      label: <Link to="/audit">操作日志</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">数据管理</Link>,
    },
  ]

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="dark"
        width={220}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          {collapsed ? '胶片' : '🎞️ 胶片寄存管理'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            胶片冲印会员寄存与到期提醒管理系统
          </div>
          <div style={{ color: '#666', fontSize: 13 }}>
            本地数据 · 自动备份
          </div>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<Members />} />
            <Route path="/films" element={<Films />} />
            <Route path="/films/:id" element={<FilmDetail />} />
            <Route path="/process" element={<ProcessRecords />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
