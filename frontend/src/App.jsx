import React, { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, theme, Modal, Input, message } from 'antd'
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
import { openNewWindow, printContent } from './utils/electron'
import { workOrderAPI, outboundAPI } from './utils/api'

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
  const [scanModalVisible, setScanModalVisible] = useState(false)
  const [scanValue, setScanValue] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  const selectedKey = location.pathname.startsWith('/workorder') 
    ? '/workorder' 
    : location.pathname.startsWith('/outbound')
    ? '/outbound'
    : '/'

  const isDetailPage = /^\/(workorder|outbound)\/[^/]+$/.test(location.pathname)
  const detailMatch = location.pathname.match(/^\/(workorder|outbound)\/([^/]+)$/)
  const detailType = detailMatch ? detailMatch[1] : null
  const detailId = detailMatch ? detailMatch[2] : null

  const handleScanClick = () => {
    setScanValue('')
    setScanModalVisible(true)
  }

  const handleScanSubmit = async () => {
    if (!scanValue.trim()) {
      message.warning('请输入或扫描单据编号')
      return
    }
    const code = scanValue.trim().toUpperCase()
    setScanLoading(true)
    try {
      if (code.startsWith('WO')) {
        try {
          await workOrderAPI.get(code)
          setScanModalVisible(false)
          navigate(`/workorder/${code}`)
          return
        } catch {
          message.error(`未找到工单：${code}`)
          return
        }
      }
      if (code.startsWith('OB')) {
        try {
          await outboundAPI.get(code)
          setScanModalVisible(false)
          navigate(`/outbound/${code}`)
          return
        } catch {
          message.error(`未找到出库单：${code}`)
          return
        }
      }
      try {
        await workOrderAPI.get(code)
        setScanModalVisible(false)
        navigate(`/workorder/${code}`)
        return
      } catch {}
      try {
        await outboundAPI.get(code)
        setScanModalVisible(false)
        navigate(`/outbound/${code}`)
        return
      } catch {}
      message.error(`未匹配到任何单据：${code}`)
    } finally {
      setScanLoading(false)
    }
  }

  const handlePrintClick = async () => {
    if (!isDetailPage) {
      message.info('请先进入工单或出库单详情页再使用打印功能')
      return
    }
    try {
      let data
      if (detailType === 'workorder') {
        data = await workOrderAPI.get(detailId)
      } else {
        data = await outboundAPI.get(detailId)
      }
      if (!data) {
        message.error('无法获取单据数据')
        return
      }
      let printHtml
      if (detailType === 'workorder') {
        printHtml = `
          <div class="print-content">
            <div class="print-header">
              <h2>维修工单</h2>
              <p>工单编号：${data.id}</p>
            </div>
            <p><strong>客户：</strong>${data.customer}</p>
            <p><strong>车型：</strong>${data.carModel}</p>
            <p><strong>车牌号：</strong>${data.carNumber}</p>
            <table class="print-table">
              <thead>
                <tr>
                  <th>配件名称</th>
                  <th>型号</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                ${(data.items || []).map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.model}</td>
                    <td>${item.qty}</td>
                    <td>¥${item.price}</td>
                    <td>¥${item.qty * item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="text-align: right; margin-top: 20px;"><strong>总计：</strong>¥${data.totalAmount}</p>
          </div>
        `
      } else {
        printHtml = `
          <div class="print-content">
            <div class="print-header">
              <h2>出库单</h2>
              <p>出库单号：${data.id}</p>
            </div>
            <p><strong>关联工单：</strong>${data.workOrderId}</p>
            <p><strong>客户：</strong>${data.customer}</p>
            <p><strong>仓库：</strong>${data.warehouse}</p>
            <p><strong>经办人：</strong>${data.operator}</p>
            <table class="print-table">
              <thead>
                <tr>
                  <th>配件名称</th>
                  <th>型号</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                ${(data.items || []).map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.model}</td>
                    <td>${item.actualQty || item.qty}</td>
                    <td>¥${item.price}</td>
                    <td>¥${(item.actualQty || item.qty) * item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="text-align: right; margin-top: 20px;"><strong>总计：</strong>¥${data.actualAmount}</p>
          </div>
        `
      }
      await printContent(printHtml)
      message.success('已发送打印')
    } catch (error) {
      message.error('打印失败，请检查数据是否加载完成')
    }
  }

  const handleMultiWindowClick = () => {
    if (isDetailPage) {
      openNewWindow(location.pathname, `${detailType === 'workorder' ? '工单' : '出库单'}详情 - ${detailId}`, 900, 700)
    } else {
      openNewWindow(selectedKey, selectedKey === '/workorder' ? '维修工单' : selectedKey === '/outbound' ? '出库对账' : '仪表盘', 1000, 700)
    }
  }

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
            <BarcodeOutlined style={{ fontSize: '20px', cursor: 'pointer' }} title="扫码查询" onClick={handleScanClick} />
            <PrinterOutlined style={{ fontSize: '20px', cursor: 'pointer' }} title="打印当前单据" onClick={handlePrintClick} />
            <WindowsOutlined style={{ fontSize: '20px', cursor: 'pointer' }} title="新窗口打开" onClick={handleMultiWindowClick} />
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

      <Modal
        title="扫码查询"
        open={scanModalVisible}
        onOk={handleScanSubmit}
        onCancel={() => setScanModalVisible(false)}
        okText="查询"
        confirmLoading={scanLoading}
      >
        <p style={{ color: '#666', marginBottom: 12 }}>请输入或扫描工单号（WO开头）或出库单号（OB开头）</p>
        <Input
          autoFocus
          size="large"
          placeholder="例如：WO202401001 或 OB202401001"
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          onPressEnter={handleScanSubmit}
          prefix={<BarcodeOutlined />}
        />
      </Modal>
    </Layout>
  )
}

export default App
