import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Statistic, Spin } from 'antd'
import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { statsAPI, workOrderAPI, outboundAPI } from '../utils/api'
import { openNewWindow } from '../utils/electron'

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    pendingWorkOrders: 0,
    rejectedWorkOrders: 0,
    reviewWorkOrders: 0,
    pendingOutbounds: 0
  })
  const [workOrders, setWorkOrders] = useState([])
  const [outbounds, setOutbounds] = useState([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, workOrdersData, outboundsData] = await Promise.all([
        statsAPI.dashboard(),
        workOrderAPI.list(),
        outboundAPI.list()
      ])
      setStats(statsData)
      setWorkOrders(Array.isArray(workOrdersData) ? workOrdersData : [])
      setOutbounds(Array.isArray(outboundsData) ? outboundsData : [])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const statusMap = {
    pending: { label: '待处理', color: 'warning' },
    approved: { label: '已通过', color: 'success' },
    rejected: { label: '已驳回', color: 'error' },
    review: { label: '需回查', color: 'processing' },
    reconciled: { label: '已对账', color: 'success' }
  }

  const workOrderColumns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: '车型',
      dataIndex: 'carModel',
      key: 'carModel'
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => `¥${v}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = statusMap[status]
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/workorder/${record.id}`)}>
          处理
        </Button>
      )
    }
  ]

  const outboundColumns = [
    {
      title: '出库单号',
      dataIndex: 'id',
      key: 'id'
    },
    {
      title: '关联工单',
      dataIndex: 'workOrderId',
      key: 'workOrderId'
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = statusMap[status]
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/outbound/${record.id}`)}>
          处理
        </Button>
      )
    }
  ]

  const handleOpenCompare = () => {
    openNewWindow('/workorder', '维修工单 - 对照窗口', 1200, 800)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="待处理工单"
              value={stats.pendingWorkOrders}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button type="link" onClick={() => navigate('/workorder?status=pending')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="已驳回工单"
              value={stats.rejectedWorkOrders}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button type="link" onClick={() => navigate('/workorder?status=rejected')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="需回查工单"
              value={stats.reviewWorkOrders}
              prefix={<QuestionCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button type="link" onClick={() => navigate('/workorder?status=review')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
              title="待对账出库"
              value={stats.pendingOutbounds}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button type="link" onClick={() => navigate('/outbound?status=pending')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button onClick={loadData}>刷新数据</Button>
            <Button type="primary" onClick={handleOpenCompare}>
              多窗口对照
            </Button>
          </div>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最新工单" extra={<Button type="link" onClick={() => navigate('/workorder')}>更多</Button>}>
            <Table
              columns={workOrderColumns}
              dataSource={workOrders.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最新出库" extra={<Button type="link" onClick={() => navigate('/outbound')}>更多</Button>}>
            <Table
              columns={outboundColumns}
              dataSource={outbounds.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
