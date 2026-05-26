import {
    CheckOutlined,
    PlusOutlined,
    ReloadOutlined
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
    Row,
    Select,
    Space,
    Table, Tag
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { visitApi } from '../api'

const { RangePicker } = DatePicker

const visitStatusColors = {
  '待回访': 'orange',
  '已回访': 'green',
  '回访失败': 'red',
  '已改期': 'blue',
}

export default function VisitList() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({})
  const [createModal, setCreateModal] = useState(false)
  const [completeModal, setCompleteModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [createForm] = Form.useForm()
  const [completeForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.dateRange) {
        params.date_from = filters.dateRange[0].format('YYYY-MM-DD')
        params.date_to = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const result = await visitApi.list(params)
      setData(result || [])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await visitApi.create({
        ...values,
        visit_no: `VS${dayjs().format('YYYYMMDDHHmmss')}`,
        planned_date: values.planned_date.format('YYYY-MM-DD'),
        repair_order_id: values.repair_order_id || 0,
      })
      message.success('创建成功')
      setCreateModal(false)
      createForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleComplete = (record) => {
    setCurrentRecord(record)
    completeForm.resetFields()
    completeForm.setFieldsValue({
      visitor: record.visitor,
      result: '满意',
    })
    setCompleteModal(true)
  }

  const handleCompleteSubmit = async (values) => {
    try {
      await visitApi.update(currentRecord.id, {
        ...values,
        status: '已回访',
        actual_date: dayjs().format('YYYY-MM-DD'),
      })
      message.success('回访完成')
      setCompleteModal(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleBatchUpdate = async (status) => {
    try {
      await visitApi.batchUpdate({
        ids: selectedRowKeys,
        status,
      })
      message.success('批量更新成功')
      setSelectedRowKeys([])
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '回访单号', dataIndex: 'visit_no', width: 140 },
    { title: '关联返修单ID', dataIndex: 'repair_order_id', width: 120, render: (v) => `#${v}` },
    { title: '回访类型', dataIndex: 'visit_type', width: 100 },
    {
      title: '计划日期',
      dataIndex: 'planned_date',
      width: 120,
      render: (val) => {
        const date = dayjs(val)
        const isOverdue = date.isBefore(dayjs()) && '待回访'
        return (
          <span>
            {date.format('YYYY-MM-DD')}
            {isOverdue && <Badge status="error" text="" style={{ marginLeft: 4 }} />}
          </span>
        )
      },
    },
    { title: '回访员', dataIndex: 'visitor', width: 100, render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => <Tag color={visitStatusColors[status]}>{status}</Tag>,
    },
    { title: '结果', dataIndex: 'result', width: 100, render: (v) => v || '-' },
    {
      title: '实际回访',
      dataIndex: 'actual_date',
      width: 120,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {record.status === '待回访' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleComplete(record)}>
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card className="filter-section" size="small">
        <Row gutter={16}>
          <Col xs={24} md={6}>
            <Select
              placeholder="回访状态"
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '待回访', label: '待回访' },
                { value: '已回访', label: '已回访' },
                { value: '回访失败', label: '回访失败' },
                { value: '已改期', label: '已改期' },
              ]}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
          <Col xs={24} md={10}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
                新建回访
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card size="small">
        <div className="action-bar">
          <Space>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchUpdate('已回访')}
            >
              标记已回访 ({selectedRowKeys.length})
            </Button>
            <Button
              disabled={selectedRowKeys.length === 0}
              onClick={() => handleBatchUpdate('已改期')}
            >
              标记已改期 ({selectedRowKeys.length})
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
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

      <Modal title="新建回访" open={createModal} onCancel={() => setCreateModal(false)} footer={null} width={560}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="visit_type" label="回访类型" rules={[{ required: true }]}>
                <Select options={[
                  { value: '佩戴回访', label: '佩戴回访' },
                  { value: '售后回访', label: '售后回访' },
                  { value: '退款回访', label: '退款回访' },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="planned_date" label="计划日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="repair_order_id" label="关联返修单ID">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="visitor" label="回访员">
            <Input />
          </Form.Item>
          <Form.Item name="content" label="回访内容">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成回访"
        open={completeModal}
        onCancel={() => setCompleteModal(false)}
        onOk={() => completeForm.submit()}
      >
        <Form form={completeForm} layout="vertical" onFinish={handleCompleteSubmit}>
          <Form.Item name="visitor" label="回访员" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="result" label="回访结果" rules={[{ required: true }]}>
            <Select options={[
              { value: '满意', label: '满意' },
              { value: '一般', label: '一般' },
              { value: '不满意', label: '不满意' },
            ]} />
          </Form.Item>
          <Form.Item name="content" label="回访内容">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="customer_feedback" label="客户反馈">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="next_visit_date" label="下次回访">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
