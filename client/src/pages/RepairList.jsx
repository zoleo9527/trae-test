import {
    BatchUpdateOutlined,
    DeleteOutlined,
    EyeOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined
} from '@ant-design/icons'
import {
    Badge,
    Button,
    Card,
    Col,
    DatePicker,
    Form, Input,
    message,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repairApi } from '../api'

const { RangePicker } = DatePicker

const statusOptions = [
  { value: '待处理', label: '待处理' },
  { value: '处理中', label: '处理中' },
  { value: '待镜片', label: '待镜片' },
  { value: '镜片调拨中', label: '镜片调拨中' },
  { value: '镜片丢失', label: '镜片丢失' },
  { value: '返修中', label: '返修中' },
  { value: '已完成', label: '已完成' },
  { value: '已驳回', label: '已驳回' },
  { value: '退款中', label: '退款中' },
  { value: '已退款', label: '已退款' },
  { value: '需回查', label: '需回查' },
]

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

export default function RepairList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({})
  const [createModal, setCreateModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [createForm] = Form.useForm()
  const [statusForm] = Form.useForm()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.store) params.store = filters.store
      if (filters.dateRange) {
        params.date_from = filters.dateRange[0].format('YYYY-MM-DD')
        params.date_to = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const result = await repairApi.list(params)
      setData(result || [])
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      const params = {
        ...values,
        repair_no: `RP${dayjs().format('YYYYMMDDHHmmss')}`,
      }
      await repairApi.create(params)
      message.success('创建成功')
      setCreateModal(false)
      createForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleBatchUpdate = () => {
    statusForm.resetFields()
    setStatusModal(true)
  }

  const handleBatchUpdateSubmit = async (values) => {
    try {
      await repairApi.batchUpdate({
        ids: selectedRowKeys,
        status: values.status,
        processor: values.processor,
        handler: values.handler,
      })
      message.success('批量更新成功')
      setStatusModal(false)
      setSelectedRowKeys([])
      loadData()
    } catch (error) {
      message.error('批量更新失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await repairApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '返修单号', dataIndex: 'repair_no', width: 140, fixed: 'left' },
    { title: '验光单号', dataIndex: 'optometry_order_no', width: 140 },
    { title: '客户', dataIndex: 'customer_name', width: 100 },
    { title: '门店', dataIndex: 'store_name', width: 120 },
    { title: '返修类型', dataIndex: 'repair_type', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => <Tag color={colorMap[status]}>{status}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (p) => p === '加急' ? <Badge status="error" text="加急" /> : <Badge status="default" text="普通" />,
    },
    { title: '处理人', dataIndex: 'processor', width: 100, render: (v) => v || '-' },
    { title: '负责人', dataIndex: 'handler', width: 100, render: (v) => v || '-' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/repairs/${record.id}`)}>
            详情
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card className="filter-section" size="small">
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Input
              placeholder="搜索单号/客户/验光单"
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              options={statusOptions}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Col>
          <Col xs={24} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} md={8}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
                新建返修
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card size="small">
        <div className="action-bar">
          <Space>
            <Tooltip title="批量更新状态">
              <Button
                icon={<BatchUpdateOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBatchUpdate}
              >
                批量更新 ({selectedRowKeys.length})
              </Button>
            </Tooltip>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建返修单"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="optometry_order_no" label="验光单号">
                <Input placeholder="选填，关联验光单" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_name" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customer_phone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="store_name" label="门店" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="repair_type" label="返修类型" rules={[{ required: true }]}>
                <Select options={[
                  { value: '镜片更换', label: '镜片更换' },
                  { value: '镜架维修', label: '镜架维修' },
                  { value: '重制镜片', label: '重制镜片' },
                  { value: '清洁保养', label: '清洁保养' },
                  { value: '度数调整', label: '度数调整' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="普通">
                <Select options={[
                  { value: '普通', label: '普通' },
                  { value: '加急', label: '加急' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="repair_reason" label="返修原因" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="processor" label="处理人">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="handler" label="负责人">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量更新状态"
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={() => statusForm.submit()}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item name="status" label="新状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="processor" label="处理人">
            <Input />
          </Form.Item>
          <Form.Item name="handler" label="负责人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
