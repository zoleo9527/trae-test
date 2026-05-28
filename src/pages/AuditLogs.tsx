import { useState, useEffect } from 'react'
import { 
  Table, Button, Space, Input, Card, Tag, App as AntApp, 
  Typography, DatePicker, Select
} from 'antd'
import { SearchOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { auditApi } from '@/services/api'
import type { AuditLog } from '@/types'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const { message } = AntApp.useApp()

  useEffect(() => {
    loadLogs()
  }, [pagination.current, pagination.pageSize])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const result = await auditApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      let data = result.data
      
      if (searchText) {
        data = data.filter(l => 
          l.detail.includes(searchText) || 
          l.operator.includes(searchText) ||
          (l.targetId && String(l.targetId).includes(searchText))
        )
      }
      if (moduleFilter) {
        data = data.filter(l => l.module === moduleFilter)
      }
      if (actionFilter) {
        data = data.filter(l => l.action === actionFilter)
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        const start = dateRange[0].startOf('day')
        const end = dateRange[1].endOf('day')
        data = data.filter(l => {
          const t = dayjs(l.timestamp)
          return t.isAfter(start) && t.isBefore(end)
        })
      }
      
      setLogs(data)
      setPagination(p => ({ ...p, total: result.total }))
    } catch (e: any) {
      message.error('加载操作日志失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const moduleOptions = [
    { value: 'member', label: '会员管理' },
    { value: 'film', label: '胶卷管理' },
    { value: 'process', label: '处理流程' },
    { value: 'database', label: '数据库' },
    { value: 'system', label: '系统' },
  ]

  const actionOptions = [
    { value: 'create', label: '创建' },
    { value: 'update', label: '更新' },
    { value: 'delete', label: '删除' },
    { value: 'register', label: '登记' },
    { value: 'start_process', label: '开始冲扫' },
    { value: 'reject', label: '驳回' },
    { value: 'rework', label: '返工' },
    { value: 'finish_process', label: '冲扫完成' },
    { value: 'deliver', label: '交付' },
    { value: 'store', label: '入库' },
    { value: 'batch_import', label: '批量导入' },
    { value: 'export', label: '导出' },
    { value: 'backup', label: '备份' },
    { value: 'restore', label: '恢复' },
  ]

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      sorter: (a: AuditLog, b: AuditLog) => 
        dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (module: string) => {
        const colors: Record<string, string> = {
          member: 'blue',
          film: 'green',
          process: 'purple',
          database: 'orange',
          system: 'default',
        }
        const labels: Record<string, string> = {
          member: '会员管理',
          film: '胶卷管理',
          process: '处理流程',
          database: '数据库',
          system: '系统',
        }
        return <Tag color={colors[module] || 'default'}>{labels[module] || module}</Tag>
      }
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const colors: Record<string, string> = {
          create: 'green',
          update: 'blue',
          delete: 'red',
          register: 'cyan',
          reject: 'red',
          rework: 'orange',
          deliver: 'purple',
          backup: 'gold',
          restore: 'orange',
          batch_import: 'geekblue',
          export: 'purple',
        }
        const labels: Record<string, string> = {
          create: '创建',
          update: '更新',
          delete: '删除',
          register: '登记',
          start_process: '开始冲扫',
          reject: '驳回',
          rework: '返工',
          finish_process: '冲扫完成',
          deliver: '交付',
          store: '入库',
          batch_import: '批量导入',
          export: '导出',
          backup: '备份',
          restore: '恢复',
        }
        return <Tag color={colors[action] || 'default'}>{labels[action] || action}</Tag>
      }
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 80,
      render: (id: number) => id || '-',
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 120,
      render: (ip: string) => ip || '-',
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <Title level={4} style={{ margin: 0 }}>操作日志</Title>
            </Space>
          }
          extra={
            <Space wrap>
              <Input
                placeholder="搜索详情/操作人/目标ID"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
              <Select
                placeholder="按模块筛选"
                value={moduleFilter || undefined}
                onChange={setModuleFilter}
                style={{ width: 120 }}
                allowClear
                options={moduleOptions}
              />
              <Select
                placeholder="按操作筛选"
                value={actionFilter || undefined}
                onChange={setActionFilter}
                style={{ width: 120 }}
                allowClear
                options={actionOptions}
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={['开始日期', '结束日期']}
              />
              <Button icon={<ReloadOutlined />} onClick={loadLogs}>刷新</Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={logs}
            columns={columns}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
            }}
          />
        </Card>
      </Space>
    </div>
  )
}
