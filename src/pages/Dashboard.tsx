import { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Button } from 'antd'
import { Link } from 'react-router-dom'
import type { User, DamageRecord, Batch } from '../types'
import { DAMAGE_STATUS, CLOTHES_STATUS } from '../types'
import dayjs from 'dayjs'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    damage: 0,
    washing: 0
  })
  const [recentBatches, setRecentBatches] = useState<Batch[]>([])
  const [pendingDamages, setPendingDamages] = useState<DamageRecord[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const batches = await window.electronAPI.getBatches()
    const damages = await window.electronAPI.getDamageRecords('pending')
    
    setRecentBatches(batches?.slice(0, 5) || [])
    setPendingDamages(damages?.slice(0, 8) || [])
    
    setStats({
      total: batches?.length || 0,
      pending: batches?.filter((b: Batch) => b.status === 'pending').length || 0,
      damage: damages?.length || 0,
      washing: 0
    })
  }

  const batchColumns = [
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'pending' ? 'orange' : 'green'}>
          {s === 'pending' ? '待处理' : '已完成'}
        </Tag>
      )
    },
    { 
      title: '收件时间', 
      dataIndex: 'received_at', 
      key: 'received_at',
      render: (t: string) => dayjs(t).format('MM-DD HH:mm')
    },
  ]

  const damageColumns = [
    { title: '衣物编号', dataIndex: 'clothes_no', key: 'clothes_no' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { 
      title: '严重程度', 
      dataIndex: 'severity', 
      key: 'severity',
      render: (s: string) => (
        <Tag color={s === 'critical' ? 'red' : s === 'major' ? 'orange' : 'gold'}>
          {s === 'critical' ? '严重' : s === 'major' ? '较重' : '轻微'}
        </Tag>
      )
    },
    { title: '上报人', dataIndex: 'reporter_name', key: 'reporter_name' },
    { 
      title: '时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (t: string) => dayjs(t).format('MM-DD HH:mm')
    },
  ]

  return (
    <div>
      <h2 className="page-title">工作台</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">今日批次</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#faad14' }}>{stats.pending}</div>
              <div className="stat-label">待处理批次</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#ff4d4f' }}>{stats.damage}</div>
              <div className="stat-label">待复判污损</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#52c41a' }}>{stats.washing}</div>
              <div className="stat-label">洗涤中</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="最近批次" 
            extra={<Link to="/batches"><Button type="link">查看全部</Button></Link>}
          >
            <Table 
              columns={batchColumns} 
              dataSource={recentBatches} 
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="待复判污损" 
            extra={<Link to="/damages"><Button type="link">查看全部</Button></Link>}
          >
            <Table 
              columns={damageColumns} 
              dataSource={pendingDamages} 
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
