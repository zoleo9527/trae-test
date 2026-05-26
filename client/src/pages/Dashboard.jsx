import {
    CalendarOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DollarCircleOutlined,
    ExclamationCircleOutlined,
    PhoneOutlined,
    SyncOutlined,
    WarningOutlined,
} from '@ant-design/icons'
import { Card, Col, Row, Spin, Statistic, Table, Tabs, Tag } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, repairApi, visitApi } from '../api'

const iconMap = {
  pending_count: { icon: <ClockCircleOutlined />, color: '#faad14' },
  in_progress_count: { icon: <SyncOutlined spin />, color: '#1677ff' },
  rejected_count: { icon: <CloseCircleOutlined />, color: '#ff4d4f' },
  need_review_count: { icon: <ExclamationCircleOutlined />, color: '#722ed1' },
  lens_lost_count: { icon: <WarningOutlined />, color: '#fa541c' },
  refunding_count: { icon: <DollarCircleOutlined />, color: '#13c2c2' },
  visit_pending_count: { icon: <PhoneOutlined />, color: '#52c41a' },
  total_today: { icon: <CalendarOutlined />, color: '#2f54eb' },
}

const labelMap = {
  pending_count: '待处理',
  in_progress_count: '处理中',
  rejected_count: '已驳回',
  need_review_count: '需回查',
  lens_lost_count: '镜片丢失',
  refunding_count: '退款中',
  visit_pending_count: '待回访',
  total_today: '今日新增',
}

const repairColumns = [
  { title: '返修单号', dataIndex: 'repair_no', width: 140 },
  { title: '客户', dataIndex: 'customer_name', width: 100 },
  { title: '门店', dataIndex: 'store_name', width: 120 },
  { title: '返修类型', dataIndex: 'repair_type', width: 100 },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    render: (status) => <StatusTag status={status} />,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    width: 80,
    render: (p) => p === '加急' ? <Tag color="red">加急</Tag> : <Tag>普通</Tag>,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 160,
    render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
  },
]

const visitColumns = [
  { title: '回访单号', dataIndex: 'visit_no', width: 140 },
  { title: '回访类型', dataIndex: 'visit_type', width: 100 },
  {
    title: '计划日期',
    dataIndex: 'planned_date',
    width: 120,
    render: (val) => dayjs(val).format('YYYY-MM-DD'),
  },
  { title: '回访员', dataIndex: 'visitor', width: 100, render: (val) => val || '-' },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    render: (status) => {
      const colors = { '待回访': 'orange', '已回访': 'green', '回访失败': 'red', '已改期': 'blue' }
      return <Tag color={colors[status]}>{status}</Tag>
    },
  },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pendingRepairs, setPendingRepairs] = useState([])
  const [rejectedRepairs, setRejectedRepairs] = useState([])
  const [needReviewRepairs, setNeedReviewRepairs] = useState([])
  const [pendingVisits, setPendingVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, pendingData, rejectedData, reviewData, visitsData] = await Promise.all([
        dashboardApi.getStats(),
        repairApi.list({ status: '待处理', limit: 20 }),
        repairApi.list({ status: '已驳回', limit: 20 }),
        repairApi.list({ status: '需回查', limit: 20 }),
        visitApi.list({ status: '待回访', limit: 10 }),
      ])
      setStats(statsData)
      setPendingRepairs(pendingData || [])
      setRejectedRepairs(rejectedData || [])
      setNeedReviewRepairs(reviewData || [])
      setPendingVisits(visitsData || [])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatClick = (key) => {
    if (key === 'visit_pending_count') {
      navigate('/visits')
    } else {
      navigate('/repairs')
    }
  }

  const repairTableProps = (dataSource, emptyText) => ({
    columns: repairColumns,
    dataSource,
    rowKey: 'id',
    size: 'small',
    pagination: false,
    locale: { emptyText },
    onRow: (record) => ({
      onClick: () => navigate(`/repairs/${record.id}`),
      style: { cursor: 'pointer' },
    }),
  })

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {stats && Object.entries(stats).map(([key, value]) => (
          <Col xs={24} sm={12} md={6} key={key}>
            <Card
              className="stat-card"
              onClick={() => handleStatClick(key)}
              styles={{ body: { padding: 16 } }}
            >
              <Statistic
                title={labelMap[key]}
                value={value}
                valueStyle={{ color: iconMap[key].color, fontSize: 28 }}
                prefix={iconMap[key].icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 16 }} size="small">
        <Tabs
          defaultActiveKey="pending"
          items={[
            {
              key: 'pending',
              label: `待处理 (${pendingRepairs.length})`,
              children: (
                <Table
                  {...repairTableProps(pendingRepairs, '暂无待处理返修单')}
                />
              ),
            },
            {
              key: 'rejected',
              label: `已驳回 (${rejectedRepairs.length})`,
              children: (
                <Table
                  {...repairTableProps(rejectedRepairs, '暂无已驳回返修单')}
                />
              ),
            },
            {
              key: 'review',
              label: `需回查 (${needReviewRepairs.length})`,
              children: (
                <Table
                  {...repairTableProps(needReviewRepairs, '暂无需回查返修单')}
                />
              ),
            },
          ]}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="待回访提醒" size="small">
            <Table
              columns={visitColumns}
              dataSource={pendingVisits}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无待回访记录' }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

function StatusTag({ status }) {
  const colorMap = {
    '待处理': 'orange',
    '处理中': 'blue',
    '待镜片': 'cyan',
    '镜片调拨中': 'geekblue',
    '镜片丢失': 'volcano',
    '返修中': 'purple',
    '已完成': 'green',
    '已驳回': 'red',
    '退款中': 'magenta',
    '已退款': 'default',
    '需回查': 'gold',
  }
  return <Tag color={colorMap[status]}>{status}</Tag>
}
