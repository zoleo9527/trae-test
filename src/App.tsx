import React, { useMemo } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { OrderList } from './pages/OrderList'
import { OrderDetail } from './pages/OrderDetail'
import { SplitOrder } from './pages/SplitOrder'
import { Receipts } from './pages/Receipts'
import { ReviewPanel } from './pages/ReviewPanel'
import { Refunds } from './pages/Refunds'
import { ErrorState } from './components/common/ErrorState'
import { useOrderStore } from './store/orderStore'
import { useRoleStore } from './store/roleStore'
import { RoleLabels } from './types'

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('App Error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-50 flex items-center justify-center p-6">
          <ErrorState
            title="应用运行出错"
            message={this.state.error?.message || '发生未知错误'}
            onRetry={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          />
        </div>
      )
    }
    return this.props.children
  }
}

const RouteWithLayout: React.FC<{
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}> = ({ title, subtitle, action, children }) => (
  <Layout title={title} subtitle={subtitle} action={action}>
    {children}
  </Layout>
)

const DashboardPage: React.FC = () => {
  const { currentRole } = useRoleStore()
  return (
    <RouteWithLayout
      title="仪表盘"
      subtitle={`礼品定制-发货拆单与回执汇总系统 · 当前角色：${RoleLabels[currentRole]}`}
    >
      <Dashboard />
    </RouteWithLayout>
  )
}

const OrderListPage: React.FC = () => (
  <RouteWithLayout
    title="订单管理"
    subtitle="查看和管理所有礼品定制订单"
  >
    <OrderList />
  </RouteWithLayout>
)

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { getOrderById } = useOrderStore()
  const order = id ? getOrderById(id) : undefined
  
  return (
    <RouteWithLayout
      title={order ? `订单详情 - ${order.orderNo}` : '订单详情'}
      subtitle={order?.customerName || '查看订单完整信息和操作历史'}
    >
      <OrderDetail />
    </RouteWithLayout>
  )
}

const SplitOrderPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { getOrderById } = useOrderStore()
  const order = orderId ? getOrderById(orderId) : undefined
  
  return (
    <RouteWithLayout
      title={order ? `拆单发货 - ${order.orderNo}` : '拆单发货'}
      subtitle={order?.customerName || '拆分订单为多个子单并发货'}
    >
      <SplitOrder />
    </RouteWithLayout>
  )
}

const ReceiptsPage: React.FC = () => (
  <RouteWithLayout
    title="回执汇总"
    subtitle="录入和管理客户签收回执"
  >
    <Receipts />
  </RouteWithLayout>
)

const ReviewPanelPage: React.FC = () => (
  <RouteWithLayout
    title="回查面板"
    subtitle="全局时间线和责任追溯"
  >
    <ReviewPanel />
  </RouteWithLayout>
)

const RefundsPage: React.FC = () => (
  <RouteWithLayout
    title="退款处理"
    subtitle="退款申请与两级审批"
  >
    <Refunds />
  </RouteWithLayout>
)

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/split/:orderId" element={<SplitOrderPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/review" element={<ReviewPanelPage />} />
        <Route path="/refunds" element={<RefundsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
