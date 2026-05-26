import {
    CheckOutlined,
    CloseOutlined,
    PlusOutlined,
    ReloadOutlined
} from '@ant-design/icons'
import {
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
import { refundApi } from '../api'

const statusColors = {
  '待审批': 'orange',
  '已审批': 'blue',
  '已退款': 'green',
  '已驳回': 'red',
}

export default function RefundList() {
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
      if (filters.status) params.status = filters.status
      const result = await refundApi.list(params)
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
      await refundApi.create({
        ...values,
        refund_no: `RF${dayjs().format('YYYYMMDDHHmmss')}`,
      })
      message.success('创建成功')
      setCreateModal(false)
      createForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleApprove = async (record, status) => {
    try {
      await refundApi.update(record.id, {
        status,
        approver: '系统管理员',
        approved_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        paid_at: status === '已退款' ? dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined,
      })
      message.success(status === '已退款' ? '退款完成' : '审批通过')
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleReject = (record) => {
    setCurrentRecord(record)
    updateForm.resetFields()
    setUpdateModal(true)
  }

  const handleRejectSubmit = async (values) => {
    try {
      await refundApi.update(currentRecord.id, {
        status: '已驳回',
        reject_reason: values.reject_reason,
        rejected_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      })
      message.success('已驳回')
      setUpdateModal(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '退款单号', dataIndex: 'refund_no', width: 140 },
    { title: '关联返修单ID', dataIndex: 'repair_order_id', width: 120, render: (v) => `#${v}` },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v) => <span style={{ color: '#cf1322', fontWeight: 500 }}>¥{v}</span> },
    { title: '原因', dataIndex: 'reason', width: 200 },
    { title: '申请人', dataIndex: 'applicant', width: 100 },
    { title: '审批人', dataIndex: 'approver', width: 100, render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 140,
      render: (val) => dayjs(val).format('MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          {record.status === '待审批' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record, '已审批')}>
                审批
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                驳回
              </Button>
            </>
          )}
          {record.status === '已审批' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record, '已退款')}>
              确认退款
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
              placeholder="状态"
              allowClear
              style={{ width: '100%' }}
              options={[
                { value: '待审批', label: '待审批' },
                { value: '已审批', label: '已审批' },
                { value: '已退款', label: '已退款' },
                { value: '已驳回', label: '已驳回' },
              ]}
              onChange={(val) => setFilters({ ...filters, status: val })}
            />
          </Col>
          <Col xs={24} md={18}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
                新建退款
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

      <Modal title="新建退款申请" open={createModal} onCancel={() => setCreateModal(false)} footer={null} width={500}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="amount" label="退款金额" rules={[{ required: true }]}>
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item name="reason" label="退款原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="applicant" label="申请人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="repair_order_id" label="关联返修单ID" rules={[{ required: true, message: '请输入关联返修单ID' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="驳回退款" open={updateModal} onCancel={() => setUpdateModal(false)} onOk={() => updateForm.submit()}>
        <Form form={updateForm} layout="vertical" onFinish={handleRejectSubmit}>
          <Form.Item name="reject_reason" label="驳回原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
