import { useState, useEffect, useCallback } from 'react'
import { 
  Row, Col, Card, Statistic, Table, Tag, Space, Button, 
  Typography, Empty, Badge, App as AntApp 
} from 'antd'
import { 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined,
  FileWarningOutlined,
  FilmOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { dashboardApi, reminderApi, processApi } from '@/services/api'
import { 
  getStatusLabel, getStatusColor, getReminderTypeLabel, 
  getReminderTypeColor, getPriorityColor 
} from '@/constants'
import { useDataRefresh } from '@/contexts/DataContext'
import type { DashboardStats, Film, Reminder, ProcessRecord } from '@/types'

const { Title, Text } = Typography

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [recentProcess, setRecentProcess] = useState<ProcessRecord[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { message } = AntApp.useApp()
  const { refreshVersion } = useDataRefresh()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, remindersData, processData] = await Promise.all([
        dashboardApi.getStats(),
        reminderApi.getList({ pageSize: 5 }),
        processApi.getList({ pageSize: 8 })
      ])
      setStats(statsData)
      setReminders(remindersData.data)
      setRecentProcess(processData.data)
    } catch (e: any) {
      message.error('加载数据失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    loadData()
  }, [loadData, refreshVersion])

  const filmColumns = [
    {
      title: '胶卷编号',
      dataIndex: 'filmNo',
      key: 'filmNo',
      render: (text: string, record: Film) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/films/${record.id}`)}
        >
          {text}
        </Button>
      )
    },
    { title: '会员', dataIndex: 'memberName', key: 'memberName' },
    { title: '胶卷类型', dataIndex: 'filmBrand', key: 'filmBrand', 
      render: (t: string, r: Film) => `${t} ${r.filmType}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status as any)}>
          {getStatusLabel(status as any)}
        </Tag>
      )
    },
    { 
      title: '紧急', 
      dataIndex: 'isUrgent', 
      key: 'isUrgent',
      render: (urgent: boolean) => urgent ? <Badge status="error" text="加急" /> : <Text type="secondary">普通</Text>
    },
    { title: '处理人', dataIndex: 'currentHandler', key: 'currentHandler', render: (t: string) => t || '-' },
  ]

  const reminderColumns = [
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
    { title: '胶卷编号', dataIndex: 'filmNo', key: 'filmNo' },
    { title: '会员', dataIndex: 'memberName', key: 'memberName' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => {
        const diff = dayjs(date).diff(dayjs(), 'day')
        let color = 'default'
        if (diff <= 0) color = 'error'
        else if (diff <= 3) color = 'warning'
        return <Tag color={color}>{date} ({diff <= 0 ? '已过期' : `${diff}天后`})</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p: string) => <Tag color={getPriorityColor(p)}>{p === 'high' ? '高' : p === 'medium' ? '中' : '低'}</Tag>
    },
  ]

  const processColumns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 170 },
    { title: '胶卷编号', dataIndex: 'filmNo', key: 'filmNo' },
    { title: '会员', dataIndex: 'memberName', key: 'memberName' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    {
      title: '状态变更',
      key: 'status',
      render: (_, r: ProcessRecord) => (
        <Space>
          <Tag color={getStatusColor(r.previousStatus)}>{getStatusLabel(r.previousStatus)}</Tag>
          <ArrowRightOutlined style={{ color: '#999' }} />
          <Tag color={getStatusColor(r.newStatus)}>{getStatusLabel(r.newStatus)}</Tag>
        </Space>
      )
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (t: string) => t || '-' },
  ]

  if (!stats) {
    return <Empty description="加载中..." />
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ marginBottom: 16 }}>
            🎯 今日概览
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={loadData} 
              loading={loading}
              style={{ marginLeft: 12 }}
            >
              刷新
            </Button>
          </Title>
          <Row gutter={16}>
            <Col xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="待处理"
                  value={stats.pendingCount}
                  prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                  suffix={<Button type="link" size="small" onClick={() => navigate('/films?status=registered')}>查看</Button>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="已驳回/待返工"
                  value={stats.rejectedCount}
                  prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                  suffix={<Button type="link" size="small" onClick={() => navigate('/films?status=rework')}>查看</Button>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="需回查(返工过)"
                  value={stats.reworkCount}
                  prefix={<FileWarningOutlined style={{ color: '#eb2f96' }} />}
                  valueStyle={{ color: '#eb2f96' }}
                  suffix={<Button type="link" size="small" onClick={() => navigate('/reminders')}>查看</Button>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="7天内到期"
                  value={stats.expiringCount}
                  prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
                  valueStyle={{ color: '#f5222d' }}
                  suffix={<Button type="link" size="small" onClick={() => navigate('/reminders')}>查看</Button>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="今日处理"
                  value={stats.todayProcessed}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={<Button type="link" size="small" onClick={() => navigate('/process')}>查看</Button>}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={8} lg={8} xl={4}>
              <Card>
                <Statistic
                  title="进行中胶卷"
                  value={stats.totalActive}
                  prefix={<FilmOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                  suffix={<Button type="link" size="small" onClick={() => navigate('/films')}>查看</Button>}
                />
              </Card>
            </Col>
          </Row>
        </div>

        <Row gutter={16}>
          <Col lg={12} xl={12}>
            <Card 
              title={
                <Space>
                  <Badge status="processing" />
                  <span>待处理胶卷 (最近10条)</span>
                </Space>
              }
              size="small"
              extra={<Button type="link" onClick={() => navigate('/films?status=registered')}>全部</Button>}
            >
              {stats.pendingList.length > 0 ? (
                <Table
                  size="small"
                  dataSource={stats.pendingList}
                  columns={filmColumns}
                  pagination={false}
                  rowKey="id"
                />
              ) : (
                <Empty description="暂无待处理" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col lg={12} xl={12}>
            <Card 
              title={
                <Space>
                  <Badge status="warning" />
                  <span>待返工胶卷 (最近10条)</span>
                </Space>
              }
              size="small"
              extra={<Button type="link" onClick={() => navigate('/films?status=rework')}>全部</Button>}
            >
              {stats.rejectedList.length > 0 ? (
                <Table
                  size="small"
                  dataSource={stats.rejectedList}
                  columns={[
                    ...filmColumns,
                    { title: '驳回原因', dataIndex: 'rejectReason', key: 'rejectReason' }
                  ]}
                  pagination={false}
                  rowKey="id"
                />
              ) : (
                <Empty description="暂无待返工" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col lg={12} xl={12}>
            <Card 
              title={
                <Space>
                  <Badge status="error" />
                  <span>即将到期胶卷 (7天内)</span>
                </Space>
              }
              size="small"
              extra={<Button type="link" onClick={() => navigate('/reminders')}>全部提醒</Button>}
            >
              {stats.expiring7Days.length > 0 ? (
                <Table
                  size="small"
                  dataSource={stats.expiring7Days}
                  columns={[
                    filmColumns[0],
                    filmColumns[1],
                    filmColumns[2],
                    {
                      title: '到期日期',
                      dataIndex: 'storageEndDate',
                      key: 'storageEndDate',
                      render: (date: string) => {
                        const diff = dayjs(date).diff(dayjs(), 'day')
                        return (
                          <Tag color={diff <= 0 ? 'error' : diff <= 3 ? 'warning' : 'default'}>
                            {date} ({diff <= 0 ? '已过期' : `还剩${diff}天`})
                          </Tag>
                        )
                      }
                    },
                    { title: '备注', dataIndex: 'remark', key: 'remark', render: (t: string) => t || '-' }
                  ]}
                  pagination={false}
                  rowKey="id"
                />
              ) : (
                <Empty description="暂无即将到期" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col lg={12} xl={12}>
            <Card 
              title={
                <Space>
                  <Badge status="processing" />
                  <span>待处理提醒</span>
                </Space>
              }
              size="small"
              extra={<Button type="link" onClick={() => navigate('/reminders')}>全部</Button>}
            >
              {reminders.length > 0 ? (
                <Table
                  size="small"
                  dataSource={reminders}
                  columns={reminderColumns}
                  pagination={false}
                  rowKey="id"
                />
              ) : (
                <Empty description="暂无提醒" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>

        <Card 
          title={
            <Space>
              <HistoryOutlined />
              <span>最近处理记录</span>
            </Space>
          }
          size="small"
          extra={<Button type="link" onClick={() => navigate('/process')}>全部记录</Button>}
        >
          {recentProcess.length > 0 ? (
            <Table
              size="small"
              dataSource={recentProcess}
              columns={processColumns}
              pagination={false}
              rowKey="id"
            />
          ) : (
            <Empty description="暂无处理记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        <Card 
          title={
            <Space>
              <ReloadOutlined spin />
              <span>返工胶卷历史 (需回查)</span>
            </Space>
          }
          size="small"
        >
          {stats.reworkList.length > 0 ? (
            <Table
              size="small"
              dataSource={stats.reworkList}
              columns={[
                filmColumns[0],
                filmColumns[1],
                filmColumns[2],
                filmColumns[3],
                { title: '返工次数', dataIndex: 'reworkCount', key: 'reworkCount', 
                  render: (c: number) => <Tag color="error">{c}次</Tag> },
                { title: '驳回原因', dataIndex: 'rejectReason', key: 'rejectReason' },
                filmColumns[5],
              ]}
              pagination={false}
              rowKey="id"
            />
          ) : (
            <Empty description="暂无返工记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Space>
    </div>
  )
}
