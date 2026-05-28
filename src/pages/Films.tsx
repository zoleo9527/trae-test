import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  Table, Button, Space, Input, Form, Modal, Select, Tag, 
  Popconfirm, App as AntApp, Typography, DatePicker, Switch,
  Upload, message, Row, Col, Statistic, Card
} from 'antd'
import type { UploadProps } from 'antd'
import { 
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ImportOutlined, ExportOutlined, ReloadOutlined,
  FileTextOutlined, HistoryOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import Papa from 'papaparse'
import { filmApi, memberApi, importExportApi, dialogApi } from '@/services/api'
import { 
  FILM_STATUS_OPTIONS, FILM_TYPE_OPTIONS, FILM_BRAND_OPTIONS,
  FORMAT_OPTIONS, ISO_OPTIONS, PROCESS_TYPE_OPTIONS, SCAN_RESOLUTION_OPTIONS,
  DELIVERY_VERSION_OPTIONS, HANDLER_OPTIONS, MEMBER_LEVEL_OPTIONS,
  getStatusLabel, getStatusColor, getMemberLevelLabel
} from '@/constants'
import type { Film, Member } from '@/types'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function Films() {
  const [films, setFilms] = useState<Film[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingFilm, setEditingFilm] = useState<Film | null>(null)
  const [form] = Form.useForm()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { modal } = AntApp.useApp()

  useEffect(() => {
    const statusFromUrl = searchParams.get('status')
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    loadMembers()
  }, [])

  useEffect(() => {
    loadFilms()
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, dateRange])

  const loadMembers = async () => {
    try {
      const result = await memberApi.getList({ pageSize: 1000 })
      setMembers(result.data)
    } catch (e: any) {
      console.error('加载会员列表失败', e)
    }
  }

  const loadFilms = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchText || undefined,
        status: statusFilter || undefined,
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const result = await filmApi.getList(params)
      setFilms(result.data)
      setPagination(p => ({ ...p, total: result.total }))
    } catch (e: any) {
      message.error('加载胶卷列表失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingFilm(null)
    form.resetFields()
    form.setFieldsValue({
      format: '135',
      deliveryVersion: 'standard',
      isUrgent: false,
      storageStartDate: dayjs(),
      storageEndDate: dayjs().add(6, 'month')
    })
    setModalVisible(true)
  }

  const handleEdit = (film: Film) => {
    setEditingFilm(film)
    form.setFieldsValue({
      ...film,
      storageStartDate: dayjs(film.storageStartDate),
      storageEndDate: dayjs(film.storageEndDate)
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await filmApi.delete(id)
      message.success('删除成功')
      loadFilms()
    } catch (e: any) {
      message.error('删除失败: ' + e.message)
    }
  }

  const handleMemberChange = (memberId: number) => {
    const member = members.find(m => m.id === memberId)
    if (member) {
      form.setFieldsValue({
        memberName: member.name,
        storageEndDate: dayjs(form.getFieldValue('storageStartDate') || dayjs()).add(member.storageMonths, 'month')
      })
    }
  }

  const handleStartDateChange = (date: dayjs.Dayjs | null) => {
    const memberId = form.getFieldValue('memberId')
    const member = members.find(m => m.id === memberId)
    if (member && date) {
      form.setFieldsValue({
        storageEndDate: date.add(member.storageMonths, 'month')
      })
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const isDuplicate = await filmApi.checkDuplicate(values.filmNo, editingFilm?.id)
      if (isDuplicate) {
        message.error('胶卷编号已存在，请检查')
        return
      }

      const data = {
        ...values,
        isUrgent: values.isUrgent ? 1 : 0,
        storageStartDate: values.storageStartDate.format('YYYY-MM-DD'),
        storageEndDate: values.storageEndDate.format('YYYY-MM-DD'),
        status: editingFilm ? values.status : 'registered',
        rejectReason: editingFilm ? values.rejectReason : undefined,
        reworkCount: editingFilm ? values.reworkCount : 0
      }

      if (editingFilm) {
        await filmApi.update(editingFilm.id, data)
        message.success('更新成功')
      } else {
        await filmApi.create(data)
        message.success('登记成功')
      }
      setModalVisible(false)
      loadFilms()
    } catch (e: any) {
      message.error('操作失败: ' + e.message)
    }
  }

  const handleExport = async () => {
    try {
      const filePath = await importExportApi.exportData('films')
      message.success(`导出成功: ${filePath}`)
    } catch (e: any) {
      message.error('导出失败: ' + e.message)
    }
  }

  const handleImport: UploadProps['customRequest'] = async ({ file }) => {
    try {
      const text = await (file as File).text()
      const result = Papa.parse(text, { header: true, skipEmptyLines: true })
      
      const data = result.data.map((row: any, index: number) => ({
        ...row,
        _row: index + 2
      }))

      const importResult = await importExportApi.batchImportFilms(data)
      
      if (importResult.errors.length > 0) {
        modal.warning({
          title: '导入完成',
          content: (
            <div>
              <p>成功: {importResult.success} 条</p>
              <p>失败: {importResult.failed} 条</p>
              <div style={{ maxHeight: 200, overflow: 'auto', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {importResult.errors.map((err, i) => (
                  <p key={i} style={{ color: '#ff4d4f', margin: '4px 0' }}>{err}</p>
                ))}
              </div>
            </div>
          ),
          onOk: () => loadFilms()
        })
      } else {
        message.success(`导入成功: ${importResult.success} 条`)
        loadFilms()
      }
    } catch (e: any) {
      message.error('导入失败: ' + e.message)
    }
  }

  const columns = [
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
    {
      title: '胶卷信息',
      key: 'filmInfo',
      render: (_, r: Film) => `${r.filmBrand} ${r.filmType} ${r.iso} ${r.format}`
    },
    { title: '张数', dataIndex: 'shots', key: 'shots', width: 80 },
    { title: '冲扫工艺', dataIndex: 'processType', key: 'processType', width: 100 },
    { title: '扫描分辨率', dataIndex: 'scanResolution', key: 'scanResolution', width: 110 },
    {
      title: '交付版本',
      dataIndex: 'deliveryVersion',
      key: 'deliveryVersion',
      width: 90,
      render: (v: string) => DELIVERY_VERSION_OPTIONS.find(o => o.value === v)?.label || v
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status as any)}>
          {getStatusLabel(status as any)}
        </Tag>
      )
    },
    {
      title: '到期日期',
      dataIndex: 'storageEndDate',
      key: 'storageEndDate',
      width: 120,
      render: (date: string) => {
        const diff = dayjs(date).diff(dayjs(), 'day')
        let color = 'default'
        if (diff <= 0) color = 'error'
        else if (diff <= 7) color = 'warning'
        return <Tag color={color}>{date}</Tag>
      }
    },
    {
      title: '加急',
      dataIndex: 'isUrgent',
      key: 'isUrgent',
      width: 70,
      render: (urgent: boolean | number) => (
        <Tag color={urgent ? 'error' : 'default'}>{urgent ? '是' : '否'}</Tag>
      )
    },
    {
      title: '返工次数',
      dataIndex: 'reworkCount',
      key: 'reworkCount',
      width: 90,
      render: (c: number) => c > 0 ? <Tag color="error">{c}次</Tag> : '-'
    },
    { title: '处理人', dataIndex: 'currentHandler', key: 'currentHandler', render: (t: string) => t || '-' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record: Film) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/films/${record.id}`)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该胶卷？"
            description="删除后数据将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="胶卷总数" 
                value={pagination.total} 
                prefix={<FileTextOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="进行中" 
                value={films.filter(f => !['delivered', 'expired'].includes(f.status)).length} 
                prefix={<HistoryOutlined />} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="待返工" 
                value={films.filter(f => f.status === 'rework').length} 
                prefix={<HistoryOutlined />} 
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic 
                title="7天内到期" 
                value={films.filter(f => dayjs(f.storageEndDate).diff(dayjs(), 'day') <= 7).length} 
                prefix={<HistoryOutlined />} 
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        <Card 
          title={<Title level={4} style={{ margin: 0 }}>胶卷寄存管理</Title>}
          extra={
            <Space wrap>
              <Input
                placeholder="搜索胶卷编号/会员/品牌/类型"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 220 }}
                allowClear
              />
              <Select
                placeholder="按状态筛选"
                value={statusFilter || undefined}
                onChange={setStatusFilter}
                style={{ width: 140 }}
                allowClear
                options={FILM_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              />
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as any)}
                placeholder={['开始日期', '结束日期']}
              />
              <Button icon={<ReloadOutlined />} onClick={loadFilms}>刷新</Button>
              <Upload
                accept=".csv"
                showUploadList={false}
                customRequest={handleImport}
              >
                <Button icon={<ImportOutlined />}>批量导入</Button>
              </Upload>
              <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                登记胶卷
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={films}
            columns={columns}
            scroll={{ x: 1400 }}
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

      <Modal
        title={editingFilm ? '编辑胶卷' : '登记胶卷'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="memberId"
                label="会员"
                rules={[{ required: true, message: '请选择会员' }]}
              >
                <Select 
                  showSearch
                  optionFilterProp="children"
                  placeholder="选择会员"
                  onChange={handleMemberChange}
                  options={members.map(m => ({ 
                    value: m.id, 
                    label: `${m.name} (${m.phone}) - ${getMemberLevelLabel(m.memberLevel)}` 
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="memberName"
                label="会员姓名"
                rules={[{ required: true, message: '请输入会员姓名' }]}
              >
                <Input placeholder="自动填充，可修改" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="filmNo"
                label="胶卷编号"
                rules={[{ required: true, message: '请输入胶卷编号' }]}
                extra="编号必须唯一，建议格式：FLM + 年份 + 序号"
              >
                <Input placeholder="如：FLM202401001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isUrgent"
                label="加急处理"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="filmBrand"
                label="胶卷品牌"
                rules={[{ required: true, message: '请选择品牌' }]}
              >
                <Select options={FILM_BRAND_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="filmType"
                label="胶卷类型"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select options={FILM_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="iso"
                label="ISO"
                rules={[{ required: true, message: '请选择ISO' }]}
              >
                <Select options={ISO_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="format"
                label="格式"
                rules={[{ required: true, message: '请选择格式' }]}
              >
                <Select options={FORMAT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="shots"
                label="张数"
                rules={[{ required: true, message: '请输入张数' }]}
              >
                <Input type="number" min="1" placeholder="如：36" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="processType"
                label="冲扫工艺"
                rules={[{ required: true, message: '请选择工艺' }]}
              >
                <Select options={PROCESS_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scanResolution"
                label="扫描分辨率"
                rules={[{ required: true, message: '请选择分辨率' }]}
              >
                <Select options={SCAN_RESOLUTION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deliveryVersion"
                label="交付版本"
                rules={[{ required: true, message: '请选择版本' }]}
              >
                <Select options={DELIVERY_VERSION_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storageStartDate"
                label="寄存开始日期"
                rules={[{ required: true, message: '请选择开始日期' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  onChange={handleStartDateChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="storageEndDate"
                label="到期日期"
                rules={[{ required: true, message: '请选择到期日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          {editingFilm && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择状态' }]}
                >
                  <Select 
                    options={FILM_STATUS_OPTIONS.map(o => ({ value: o.value, label: o.label }))} 
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="currentHandler"
                  label="当前处理人"
                >
                  <Select 
                    allowClear
                    options={HANDLER_OPTIONS} 
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
