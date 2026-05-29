import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button, Statistic } from 'antd'
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { mockWorkOrders, mockOutbounds, statusMap } from '../mock/data'
import { openNewWindow } from '../utils/electron'

function Dashboard() {
  const navigate = useNavigate()
  const pendingWorkOrders = mockWorkOrders.filter(o => o.status === 'pending')
  const rejectedWorkOrders = mockWorkOrders.filter(o => o.status === 'rejected')
  const reviewWorkOrders = mockWorkOrders.filter(o => o.status === 'review')
  const pendingOutbounds = mockOutbounds.filter(o => o.status === 'pending')

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
        <Button type="link" onClick={() => handleViewWorkOrder(record)}>
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
        <Button type="link" onClick={() => handleViewOutbound(record)}>
          处理
        </Button>
      )
    }
  ]

  const handleViewWorkOrder = (record) => {
    navigate(`/workorder/${record.id}`)
  }

  const handleViewOutbound = (record) => {
    navigate(`/outbound/${record.id}`)
  }

  const handleOpenCompare = () => {
    openNewWindow('/workorder', '维修工单 - 对照窗口', 1200, 800)
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card className="dashboard-card">
            <Statistic
            title="待处理工单"
            value={pendingWorkOrders.length}
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
            value={rejectedWorkOrders.length}
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
            value={reviewWorkOrders.length}
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
            value={pendingOutbounds.length}
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
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={handleOpenCompare}>
            多窗口对照
          </Button>
        </div>
      </Col>
    </Row>

    <Row gutter={16}>
      <Col span={12}>
        <Card title="待处理工单" extra={<Button type="link" onClick={() => navigate('/workorder')}>更多</Button>}>
          <Table
            columns={workOrderColumns}
            dataSource={mockWorkOrders.slice(0, 5)}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </Col>
      <Col span={12}>
        <Card title="待对账出库" extra={<Button type="link" onClick={() => navigate('/outbound')}>更多</Button>}>
          <Table
            columns={outboundColumns}
            dataSource={mockOutbounds.slice(0, 5)}
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
