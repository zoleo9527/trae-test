import { useState, useEffect } from 'react'
import { 
  Table, Button, Space, Input, Card, Tag, App as AntApp, 
  Typography, Tabs, Empty, Badge, Popconfirm, Row, Col, Statistic
} from 'antd'
import { SearchOutlined, ReloadOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { reminderApi } from '@/services/api'
import { 
  getReminderTypeLabel, getReminderTypeColor, getPriorityLabel, getPriorityColor 
} from '@/constants'
import type { Reminder, ReminderType } from '@/types'

const { Title, Text } = Typography

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const { message } = AntApp.useApp()

  useEffect(() => {
    loadReminders()
  }, [])

  const loadReminders = async () => {
    setLoading(true)
    try {
      const result = await reminderApi.getList({
        keyword: searchText || undefined
      })
      setReminders(result.data)
    } catch (e: any) {
      message.error('加载提醒失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (id: number) => {
    try {
      await reminderApi.dismiss(id)
      message.success('已标记为已处理')
      loadReminders()
    } catch (e: any) {
      message.error('操作失败: ' + e.message)
    }
  }

  const filterByType = (type: ReminderType | 'all') => {
    if (type === 'all') return reminders
    return reminders.filter(r => r.type === type)
  }

  const getStats = () => ({
    all: reminders.length,
    expire: reminders.filter(r => r.type === 'expire').length,
    rework: reminders.filter(r => r.type === 'rework').length,
    reject: reminders.filter(r => r.type === 'reject').length,
    pending: reminders.filter(r => r.type === 'pending').length,
    high: reminders.filter(r => r.priority === 'high').length,
  })

  const stats = getStats()

  const columns = [
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => (
        <Tag color={getPriorityColor(p)}>{getPriorityLabel(p)}</Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={getReminderTypeColor(type as any)}>
          {getReminderTypeLabel(type as any)}
        </Tag>
      )
    },
    {
      title: '胶卷编号',
      dataIndex: 'filmNo',
      key: 'filmNo',
    },
    {
      title: '会员',
      dataIndex: 'memberName',
      key: 'memberName',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 180,
      render: (date: string) => {
        const diff = dayjs(date).diff(dayjs(), 'day')
        let color = 'default'
        if (diff <= 0) color = 'error'
        else if (diff <= 3) color = 'warning'
        return (
          <Space>
            <Tag color={color}>{date}</Tag>
            <Text style={{ color: diff <= 0 ? '#ff4d4f' : diff <= 3 ? '#faad14' : '#666' }}>
              {diff <= 0 ? '已过期' : `还剩${diff}天`}
            </Text>
          </Space>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: Reminder) => (
        <Popconfirm
          title="标记为已处理？"
          onConfirm={() => handleDismiss(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button 
            type="link" 
            size="small" 
            icon={<CheckCircleOutlined />}
          >
            已处理
          </Button>
        </Popconfirm>
      )
    }
  ]

  const tabItems = [
    { key: 'all', label: `全部 (${stats.all})` },
    { key: 'expire', label: `到期提醒 (${stats.expire})` },
    { key: 'rework', label: `返工提醒 (${stats.rework})` },
    { key: 'reject', label: `驳回提醒 (${stats.reject})` },
    { key: 'pending', label: `待处理 (${stats.pending})` },
  ]

  const filteredData = filterByType(activeTab as any)

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic 
                title="待处理提醒" 
                value={stats.all} 
                prefix={<BellOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic 
                title="高优先级" 
                value={stats.high} 
                prefix={<Badge status="error" />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic 
                title="7天内到期" 
                value={stats.expire} 
                prefix={<Badge status="warning" />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        <Card 
          title={
            <Space>
              <BellOutlined />
              <Title level={4} style={{ margin: 0 }}>到期与处理提醒</Title>
            </Space>
          }
          extra={
            <Space>
              <Input
                placeholder="搜索胶卷编号/会员/标题"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
                onPressEnter={loadReminders}
              />
              <Button icon={<ReloadOutlined />} onClick={loadReminders}>刷新</Button>
            </Space>
          }
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
          />
          {filteredData.length > 0 ? (
            <Table
              rowKey="id"
              loading={loading}
              dataSource={filteredData}
              columns={columns}
              pagination={{
                defaultPageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          ) : (
            <Empty description="暂无提醒" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Space>
    </div>
  )
}
