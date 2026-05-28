import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { OrderList } from './pages/OrderList'
import { OrderDetail } from './pages/OrderDetail'
import { SplitOrder } from './pages/SplitOrder'
import { Receipts } from './pages/Receipts'
import { ReviewPanel } from './pages/ReviewPanel'
import { Refunds } from './pages/Refunds'
import { ErrorState } from './components/common/ErrorState'

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

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={
          <Layout title="仪表盘" subtitle="礼品定制-发货拆单与回执汇总系统">
            <Dashboard />
          </Layout>
        } />
        <Route path="/orders" element={
          <Layout title="订单管理" subtitle="查看和管理所有礼品定制订单">
            <OrderList />
          </Layout>
        } />
        <Route path="/orders/:id" element={
          <Layout title="订单详情" subtitle="查看订单完整信息和操作历史">
            <OrderDetail />
          </Layout>
        } />
        <Route path="/split/:orderId" element={
          <Layout title="发货拆单" subtitle="拆分订单为多个子单并发货">
            <SplitOrder />
          </Layout>
        } />
        <Route path="/receipts" element={
          <Layout title="回执汇总" subtitle="录入和管理客户签收回执">
            <Receipts />
          </Layout>
        } />
        <Route path="/review" element={
          <Layout title="回查面板" subtitle="全局时间线和责任追溯">
            <ReviewPanel />
          </Layout>
        } />
        <Route path="/refunds" element={
          <Layout title="退款处理" subtitle="退款申请与两级审批">
            <Refunds />
          </Layout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
