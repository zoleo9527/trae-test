import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme } from 'antd'
import {
  DashboardOutlined,
  ToolOutlined,
  FileSearchOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  WindowsOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import WorkOrderList from './pages/WorkOrder/List'
import WorkOrderDetail from './pages/WorkOrder/Detail'
import OutboundList from './pages/Outbound/List'
import OutboundDetail from './pages/Outbound/Detail'

const { Header, Content, Sider } = Layout

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: '首页仪表盘'
  },
  {
    key: '/workorder',
    icon: <ToolOutlined />,
    label: '维修工单'
  },
  {
    key: '/outbound',
    icon: <FileSearchOutlined />,
    label: '出库对账'
  }
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const selectedKey = location.pathname.startsWith('/workorder') 
    ? '/workorder' 
    : location.pathname.startsWith('/outbound')
    ? '/outbound'
    : '/'

  return (
    <Layout className="app-layout">
      <Sider theme="dark">
        <div className="logo">汽配商行管理</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>
            {selectedKey === '/' && '首页仪表盘'}
            {selectedKey === '/workorder' && '维修工单管理'}
            {selectedKey === '/outbound' && '出库对账管理'}
          </h2>
          <div style={{ display: 'flex', gap: '16px' }}>
            <BarcodeOutlined style={{ fontSize: '20px', cursor: 'pointer' }} title="扫码" />
            <PrinterOutlined style={{ fontSize: '20px', cursor: 'pointer' }} title="打印" />
            <WindowsOutlined style={{ fontSize: '20px', cursor: 'pointer' }} title="多窗口" />
          </div>
        </Header>
        <Content style={{ margin: '24px', overflow: 'auto' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workorder" element={<WorkOrderList />} />
              <Route path="/workorder/:id" element={<WorkOrderDetail />} />
              <Route path="/outbound" element={<OutboundList />} />
              <Route path="/outbound/:id" element={<OutboundDetail />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
