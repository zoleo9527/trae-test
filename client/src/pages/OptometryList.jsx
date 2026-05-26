import {
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Col, DatePicker,
    Form, Input,
    InputNumber,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table,
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { optometryApi } from '../api'

export default function OptometryList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [createModal, setCreateModal] = useState(false)
  const [updateModal, setUpdateModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [createForm] = Form.useForm()
  const [updateForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.keyword) params.keyword = filters.keyword
      if (filters.store) params.store = filters.store
      const result = await optometryApi.list(params)
      setData(result || [])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await optometryApi.create({
        ...values,
        exam_date: values.exam_date.format('YYYY-MM-DD'),
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
      customer_name: record.customer_name,
      customer_phone: record.customer_phone,
      left_sph: record.left_sph,
      left_cyl: record.left_cyl,
      left_axis: record.left_axis,
      right_sph: record.right_sph,
      right_cyl: record.right_cyl,
      right_axis: record.right_axis,
      pd: record.pd,
      lens_type: record.lens_type,
      lens_brand: record.lens_brand,
      frame_model: record.frame_model,
    })
    setUpdateModal(true)
  }

  const handleUpdateSubmit = async (values) => {
    try {
      await optometryApi.update(currentRecord.id, values)
      message.success('更新成功')
      setUpdateModal(false)
      loadData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const columns = [
    { title: '验光单号', dataIndex: 'order_no', width: 140 },
    { title: '客户', dataIndex: 'customer_name', width: 100 },
    { title: '电话', dataIndex: 'customer_phone', width: 120, render: (v) => v || '-' },
    { title: '门店', dataIndex: 'store_name', width: 120 },
    { title: '验光师', dataIndex: 'optometrist', width: 100 },
    {
      title: '验光日期',
      dataIndex: 'exam_date',
      width: 120,
      render: (val) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '左眼',
      key: 'left_eye',
      width: 160,
      render: (_, r) => (
        <span>{r.left_sph || '-'}/{r.left_cyl || '-'} × {r.left_axis || '-'}</span>
      ),
    },
    {
      title: '右眼',
      key: 'right_eye',
      width: 160,
      render: (_, r) => (
        <span>{r.right_sph || '-'}/{r.right_cyl || '-'} × {r.right_axis || '-'}</span>
      ),
    },
    { title: 'PD', dataIndex: 'pd', width: 80, render: (v) => v || '-' },
    { title: '镜片', dataIndex: 'lens_brand', width: 100, render: (v) => v || '-' },
    { title: '镜架', dataIndex: 'frame_model', width: 120, render: (v) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleUpdate(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card className="filter-section" size="small">
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Input
              placeholder="搜索单号/客户/电话"
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </Col>
          <Col xs={24} md={6}>
            <Input
              placeholder="门店"
              allowClear
              onChange={(e) => setFilters({ ...filters, store: e.target.value })}
            />
          </Col>
          <Col xs={24} md={12}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
                新建验光单
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
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal title="新建验光单" open={createModal} onCancel={() => setCreateModal(false)} footer={null} width={700}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="order_no" label="验光单号" rules={[{ required: true }]}>
                <Input placeholder="如：YG20260101001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customer_name" label="客户姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customer_phone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="store_name" label="门店" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="optometrist" label="验光师" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="exam_date" label="验光日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="左眼" size="small" type="inner">
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item name="left_sph" label="球镜(SPH)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="left_cyl" label="柱镜(CYL)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="left_axis" label="轴位(AXIS)">
                      <InputNumber min={0} max={180} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="右眼" size="small" type="inner">
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item name="right_sph" label="球镜(SPH)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="right_cyl" label="柱镜(CYL)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="right_axis" label="轴位(AXIS)">
                      <InputNumber min={0} max={180} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Form.Item name="pd" label="瞳距(PD)">
                <InputNumber step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lens_type" label="镜片类型">
                <Select options={[
                  { value: '单光', label: '单光' },
                  { value: '渐进多焦点', label: '渐进多焦点' },
                  { value: '抗蓝光', label: '抗蓝光' },
                  { value: '变色', label: '变色' },
                  { value: '偏光', label: '偏光' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lens_brand" label="镜片品牌">
                <Select options={[
                  { value: '蔡司', label: '蔡司' },
                  { value: '依视路', label: '依视路' },
                  { value: '豪雅', label: '豪雅' },
                  { value: '凯米', label: '凯米' },
                  { value: '明月', label: '明月' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="frame_model" label="镜架型号">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="编辑验光单" open={updateModal} onCancel={() => setUpdateModal(false)} onOk={() => updateForm.submit()} width={700}>
        <Form form={updateForm} layout="vertical" onFinish={handleUpdateSubmit}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="customer_name" label="客户姓名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="customer_phone" label="联系电话">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="左眼" size="small" type="inner">
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item name="left_sph" label="球镜(SPH)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="left_cyl" label="柱镜(CYL)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="left_axis" label="轴位(AXIS)">
                      <InputNumber min={0} max={180} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="右眼" size="small" type="inner">
                <Row gutter={8}>
                  <Col span={8}>
                    <Form.Item name="right_sph" label="球镜(SPH)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="right_cyl" label="柱镜(CYL)">
                      <InputNumber step={0.25} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="right_axis" label="轴位(AXIS)">
                      <InputNumber min={0} max={180} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Form.Item name="pd" label="瞳距(PD)">
                <InputNumber step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lens_type" label="镜片类型">
                <Select options={[
                  { value: '单光', label: '单光' },
                  { value: '渐进多焦点', label: '渐进多焦点' },
                  { value: '抗蓝光', label: '抗蓝光' },
                  { value: '变色', label: '变色' },
                  { value: '偏光', label: '偏光' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lens_brand" label="镜片品牌">
                <Select options={[
                  { value: '蔡司', label: '蔡司' },
                  { value: '依视路', label: '依视路' },
                  { value: '豪雅', label: '豪雅' },
                  { value: '凯米', label: '凯米' },
                  { value: '明月', label: '明月' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="frame_model" label="镜架型号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
