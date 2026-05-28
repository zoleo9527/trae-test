import { useState, useEffect } from 'react'
import { 
  Table, Button, Space, Input, Card, Tag, App as AntApp, 
  Typography, DatePicker, Select
} from 'antd'
import { SearchOutlined, ReloadOutlined, DownloadOutlined, ArrowRightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { processApi, importExportApi } from '@/services/api'
import { getStatusLabel, getStatusColor } from '@/constants'
import type { ProcessRecord } from '@/types'

const { Title } = Typography
const { RangePicker } = DatePicker

export default function ProcessRecords() {
  const [records, setRecords] = useState<ProcessRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [actionFilter, setActionFilter] = useState<string>('')
  const { message } = AntApp.useApp()

  useEffect(() => {
    loadRecords()
  }, [pagination.current, pagination.pageSize, searchText, dateRange, actionFilter])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchText || undefined,
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const result = await processApi.getList(params)
      let data = result.data
      if (actionFilter) {
        data = data.filter(r => r.action === actionFilter)
      }
      setRecords(data)
      setPagination(p => ({ ...p, total: result.total }))
    } catch (e: any) {
      message.error('加载处理记录失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const filePath = await importExportApi.exportData('process')
      message.success(`导出成功: ${filePath}`)
    } catch (e: any) {
      message.error('导出失败: ' + e.message)
    }
  }

  const actionOptions = [
    { value: 'register', label: '登记' },
    { value: 'start_process', label: '开始冲扫' },
    { value: 'reject', label: '驳回' },
    { value: 'rework', label: '返工' },
    { value: 'finish_process', label: '冲扫完成' },
    { value: 'ready_delivery', label: '准备交付' },
    { value: 'deliver', label: '交付' },
    { value: 'store', label: '入库' },
  ]

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      sorter: (a: ProcessRecord, b: ProcessRecord) => 
        dayjs(a.timestamp).unix() - dayjs(b.timestamp).unix(),
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
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => {
        const colors: Record<string, string> = {
          register: 'default',
          start_process: 'blue',
          reject: 'red',
          rework: 'orange',
          finish_process: 'green',
          ready_delivery: 'purple',
          deliver: 'cyan',
          store: 'default',
        }
        const labels: Record<string, string> = {
          register: '登记',
          start_process: '开始冲扫',
          reject: '驳回',
          rework: '返工',
          finish_process: '冲扫完成',
          ready_delivery: '准备交付',
          deliver: '交付',
          store: '入库',
        }
        return <Tag color={colors[action] || 'default'}>{labels[action] || action}</Tag>
      }
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
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
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (t: string) => t || '-',
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card 
          title={<Title level={4} style={{ margin: 0 }}>处理记录</Title>}
          extra={
            <Space wrap>
              <Input
                placeholder="搜索胶卷编号/会员"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                placeholder="按操作筛选"
                value={actionFilter || undefined}
                onChange={setActionFilter}
                style={{ width: 140 }}
                allowClear
                options={actionOptions}
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={['开始日期', '结束日期']}
              />
              <Button icon={<ReloadOutlined />} onClick={loadRecords}>刷新</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={records}
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
