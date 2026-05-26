import {
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    WarningOutlined,
} from '@ant-design/icons'
import {
    Badge,
    Button,
    Card,
    Col,
    Form, Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table, Tag
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { lensTransferApi } from '../api'

const statusColors = {
  '待发货': 'orange',
  '已发货': 'blue',
  '已收货': 'green',
}

export default function LensTransferList() {
  const [data, setData] = useState([])
  const [repairOptions, setRepairOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [createModal, setCreateModal] = useState(false)
  const [updateModal, setUpdateModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [createForm] = Form.useForm()
  const [updateForm] = Form.useForm()

  useEffect(() => {
    loadData()
    loadRepairOptions()
  }, [filters])

  const loadRepairOptions = async () => {
    try {
      const list = await repairApi.getSimpleList()
      setRepairOptions(list || [])
    } catch (error) {
      console.error('加载返修单失败:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.is_lost !== undefined) params.is_lost = filters.is_lost
      const result = await lensTransferApi.list(params)
      setData(result || [])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      if (!values.repair_order_id) {
        message.error('请填写关联返修单ID')
        return
      }
      await lensTransferApi.create({
        ...values,
        transfer_no: `LT${dayjs().format('YYYYMMDDHHmmss')}`,
      })
      message.success('创建成功')
      setCreateModal(false)
      createForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleUpdate = (record) => {
    setCurrentRecord(record)
    updateForm.setFieldsValue({
      status: record.status,
      is_lost: record.is_lost,
      lost_reason: record.lost_reason,
      remark: record.remark,
    })
    setUpdateModal(true)
  }

  const handleUpdateSubmit = async (values) => {
    try {
      await lensTransferApi.update(currentRecord.id, values)
      message.success('更新成功')
      setUpdateModal(false)
      loadData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const columns = [
    { title: '调拨单号', dataIndex: 'transfer_no', width: 140 },
    { title: '调出门店', dataIndex: 'from_store', width: 120 },
    { title: '调入门店', dataIndex: 'to_store', width: 120 },
    { title: '镜片规格', dataIndex: 'lens_spec', width: 200 },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status, record) => (
        <Space>
          <Tag color={statusColors[status] || 'default'}>{status}</Tag>
          {record.is_lost === 1 && (
            <Badge status="error" text={<><WarningOutlined /> 丢失</>} />
          )}
        </Space>
      ),
    },
    {
      title: '发货时间',
      dataIndex: 'sent_at',
      width: 140,
      render: (val) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '收货时间',
      dataIndex: 'received_at',
      width: 140,
      render: (val) => val ? dayjs(val).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleUpdate(record)}>
          更新
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card className="filter-section" size="small">
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '待发货', label: '待发货' },
                { value: '已发货', label: '已发货' },
                { value: '已收货', label: '已收货' },
              ]}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="是否丢失"
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: 1, label: '已丢失' },
                { value: 0, label: '正常' },
              ]}
              onChange={(val) => setFilters({ ...filters, is_lost: val })}
            />
          </Col>
          <Col xs={24} md={12}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
                新建调拨
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card size="small">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal title="新建镜片调拨" open={createModal} onCancel={() => setCreateModal(false)} footer={null} width={560}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_store" label="调出门店" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_store" label="调入门店" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="lens_spec" label="镜片规格" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="如：蔡司 抗蓝光 左-2.00/-0.50 右-2.50/-0.25" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quantity" label="数量" initialValue={1}>
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="repair_order_id" label="关联返修单" rules={[{ required: true, message: '请选择关联返修单' }]}>
                <Select
                  showSearch
                  placeholder="选择返修单"
                  optionFilterProp="label"
                  options={repairOptions.map(r => ({
                    value: r.id,
                    label: `${r.repair_no} - ${r.customer_name} (${r.store_name})`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="更新调拨状态" open={updateModal} onCancel={() => setUpdateModal(false)} onOk={() => updateForm.submit()}>
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateSubmit}>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={[
              { value: '待发货', label: '待发货' },
              { value: '已发货', label: '已发货' },
              { value: '已收货', label: '已收货' },
            ]} />
          </Form.Item>
          <Form.Item name="is_lost" label="是否丢失">
            <Select options={[
              { value: 0, label: '正常' },
              { value: 1, label: '已丢失' },
            ]} />
          </Form.Item>
          <Form.Item name="lost_reason" label="丢失原因">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
