import {
    ArrowLeftOutlined,
    EditOutlined,
    HistoryOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Col,
    DatePicker,
    Descriptions,
    Form, Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Table,
    Tag, Timeline
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { lensTransferApi, refundApi, repairApi, visitApi } from '../api'

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

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [transferModal, setTransferModal] = useState(false)
  const [refundModal, setRefundModal] = useState(false)
  const [visitModal, setVisitModal] = useState(false)
  const [statusForm] = Form.useForm()
  const [transferForm] = Form.useForm()
  const [refundForm] = Form.useForm()
  const [visitForm] = Form.useForm()

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [detail, historyData] = await Promise.all([
        repairApi.get(id),
        repairApi.getHistory(id),
      ])
      setData(detail)
      setHistory(historyData || [])
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (values) => {
    try {
      await repairApi.updateStatus(id, values.status, values.changed_by || '系统', values.reason)
      message.success('状态更新成功')
      setStatusModal(false)
      statusForm.resetFields()
      loadData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleCreateTransfer = async (values) => {
    try {
      await lensTransferApi.create({
        ...values,
        repair_order_id: parseInt(id),
        transfer_no: `LT${dayjs().format('YYYYMMDDHHmmss')}`,
      })
      message.success('创建调拨单成功')
      setTransferModal(false)
      transferForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleCreateRefund = async (values) => {
    try {
      await refundApi.create({
        ...values,
        repair_order_id: parseInt(id),
        refund_no: `RF${dayjs().format('YYYYMMDDHHmmss')}`,
      })
      message.success('创建退款记录成功')
      setRefundModal(false)
      refundForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleCreateVisit = async (values) => {
    try {
      await visitApi.create({
        ...values,
        repair_order_id: parseInt(id),
        visit_no: `VS${dayjs().format('YYYYMMDDHHmmss')}`,
        planned_date: values.planned_date.format('YYYY-MM-DD'),
      })
      message.success('创建回访成功')
      setVisitModal(false)
      visitForm.resetFields()
      loadData()
    } catch (error) {
      message.error('创建失败')
    }
  }

  if (!data) return <div style={{ padding: 24 }}>加载中...</div>

  const transferColumns = [
    { title: '调拨单号', dataIndex: 'transfer_no', width: 140 },
    { title: '调出门店', dataIndex: 'from_store', width: 120 },
    { title: '调入门店', dataIndex: 'to_store', width: 120 },
    { title: '镜片规格', dataIndex: 'lens_spec', width: 200 },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === '已发货' ? 'blue' : 'orange'}>{s}</Tag> },
  ]

  const refundColumns = [
    { title: '退款单号', dataIndex: 'refund_no', width: 140 },
    { title: '金额', dataIndex: 'amount', width: 100, render: (v) => `¥${v}` },
    { title: '原因', dataIndex: 'reason', width: 200 },
    { title: '申请人', dataIndex: 'applicant', width: 100 },
    { title: '状态', dataIndex: 'status', width: 100, render: (s) => <Tag color={s === '已退款' ? 'green' : s === '待审批' ? 'orange' : 'red'}>{s}</Tag> },
  ]

  const visitColumns = [
    { title: '回访单号', dataIndex: 'visit_no', width: 140 },
    { title: '类型', dataIndex: 'visit_type', width: 100 },
    { title: '计划日期', dataIndex: 'planned_date', width: 120, render: (v) => dayjs(v).format('YYYY-MM-DD') },
    { title: '回访员', dataIndex: 'visitor', width: 100, render: (v) => v || '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: (s) => {
      const c = { '待回访': 'orange', '已回访': 'green', '回访失败': 'red', '已改期': 'blue' }
      return <Tag color={c[s]}>{s}</Tag>
    }},
    { title: '结果', dataIndex: 'result', width: 100, render: (v) => v || '-' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/repairs')}>
          返回列表
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={`返修单 - ${data.repair_no}`}
            extra={<Tag color={colorMap[data.status]} style={{ fontSize: 14 }}>{data.status}</Tag>}
            className="detail-section"
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="验光单号">{data.optometry_order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="客户">{data.customer_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{data.customer_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="门店">{data.store_name}</Descriptions.Item>
              <Descriptions.Item label="返修类型">{data.repair_type}</Descriptions.Item>
              <Descriptions.Item label="优先级">{data.priority}</Descriptions.Item>
              <Descriptions.Item label="处理人">{data.processor || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责人">{data.handler || '-'}</Descriptions.Item>
              <Descriptions.Item label="镜片状态">
                <Tag color={data.lens_status === '已丢失' ? 'red' : data.lens_status === '库存不足' ? 'orange' : 'green'}>
                  {data.lens_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(data.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="返修原因" span={2}>{data.repair_reason}</Descriptions.Item>
              {data.reject_reason && (
                <Descriptions.Item label="驳回原因" span={2}>{data.reject_reason}</Descriptions.Item>
              )}
              {data.refund_amount && (
                <>
                  <Descriptions.Item label="退款金额">¥{data.refund_amount}</Descriptions.Item>
                  <Descriptions.Item label="退款原因">{data.refund_reason}</Descriptions.Item>
                </>
              )}
              {data.completed_at && (
                <Descriptions.Item label="完成时间" span={2}>
                  {dayjs(data.completed_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<EditOutlined />} onClick={() => setStatusModal(true)}>
                更新状态
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setTransferModal(true)}>
                镜片调拨
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setRefundModal(true)}>
                退款申请
              </Button>
              <Button icon={<PlusOutlined />} onClick={() => setVisitModal(true)}>
                创建回访
              </Button>
            </Space>
          </Card>

          {data.lens_transfers && data.lens_transfers.length > 0 && (
            <Card title="镜片调拨记录" size="small" className="detail-section" style={{ marginTop: 16 }}>
              <Table columns={transferColumns} dataSource={data.lens_transfers} rowKey="id" size="small" pagination={false} />
            </Card>
          )}

          {data.refunds && data.refunds.length > 0 && (
            <Card title="退款记录" size="small" className="detail-section" style={{ marginTop: 16 }}>
              <Table columns={refundColumns} dataSource={data.refunds} rowKey="id" size="small" pagination={false} />
            </Card>
          )}

          {data.visits && data.visits.length > 0 && (
            <Card title="回访记录" size="small" className="detail-section" style={{ marginTop: 16 }}>
              <Table columns={visitColumns} dataSource={data.visits} rowKey="id" size="small" pagination={false} />
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<span><HistoryOutlined /> 状态时间轴</span>}
            className="detail-section"
            size="small"
          >
            <Timeline
              className="status-timeline"
              items={history.map((h) => ({
                color: h.to_status === '已完成' ? 'green' : h.to_status === '已驳回' ? 'red' : h.to_status === '需回查' ? 'gold' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>{h.to_status}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {h.changed_by} · {dayjs(h.changed_at).format('MM-DD HH:mm')}
                    </div>
                    {h.change_reason && <div style={{ fontSize: 12, marginTop: 4 }}>{h.change_reason}</div>}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="更新状态" open={statusModal} onCancel={() => setStatusModal(false)} onOk={() => statusForm.submit()}>
        <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate}>
          <Form.Item name="status" label="新状态" rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name="changed_by" label="操作人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="变更原因">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建镜片调拨" open={transferModal} onCancel={() => setTransferModal(false)} onOk={() => transferForm.submit()} width={560}>
        <Form form={transferForm} layout="vertical" onFinish={handleCreateTransfer}>
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
          <Form.Item name="quantity" label="数量" initialValue={1}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="申请退款" open={refundModal} onCancel={() => setRefundModal(false)} onOk={() => refundForm.submit()}>
        <Form form={refundForm} layout="vertical" onFinish={handleCreateRefund}>
          <Form.Item name="amount" label="退款金额" rules={[{ required: true }]}>
            <Input type="number" prefix="¥" />
          </Form.Item>
          <Form.Item name="reason" label="退款原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="applicant" label="申请人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建回访" open={visitModal} onCancel={() => setVisitModal(false)} onOk={() => visitForm.submit()}>
        <Form form={visitForm} layout="vertical" onFinish={handleCreateVisit}>
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
          <Form.Item name="visitor" label="回访员">
            <Input />
          </Form.Item>
          <Form.Item name="content" label="回访内容">
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
