import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Select, Input, InputNumber, message, Space, Descriptions } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import type { User, DamageRecord } from '../types'
import dayjs from 'dayjs'

interface DamageListProps {
  user: User
}

export default function DamageList({ user }: DamageListProps) {
  const [records, setRecords] = useState<DamageRecord[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [detailVisible, setDetailVisible] = useState(false)
  const [resolveVisible, setResolveVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<DamageRecord | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    const data = await window.electronAPI.getDamageRecords(
      filterStatus === 'all' ? undefined : filterStatus
    )
    setRecords(data || [])
  }

  const handleViewDetail = (record: DamageRecord) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  const handleResolve = (record: DamageRecord) => {
    setCurrentRecord(record)
    setResolveVisible(true)
  }

  const handleConfirmResolve = async (values: any) => {
    if (!currentRecord) return

    try {
      await window.electronAPI.resolveDamage({
        id: currentRecord.id,
        status: values.status,
        dispute_note: values.dispute_note,
        resolved_by: user.id,
        resolved_by_name: user.name,
        compensation_amount: values.compensation_amount || 0
      })
      message.success('处理完成')
      setResolveVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error('处理失败')
    }
  }

  const severityText = (s: string) => {
    const map: any = { minor: '轻微', major: '较重', critical: '严重' }
    return map[s] || s
  }

  const severityColor = (s: string) => {
    const map: any = { minor: 'gold', major: 'orange', critical: 'red' }
    return map[s] || 'default'
  }

  const columns = [
    { title: '衣物编号', dataIndex: 'clothes_no', key: 'clothes_no', width: 140 },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '客户姓名', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '污损类型', dataIndex: 'damage_type', key: 'damage_type' },
    { 
      title: '严重程度', 
      dataIndex: 'severity', 
      key: 'severity',
      render: (s: string) => <Tag color={severityColor(s)}>{severityText(s)}</Tag>
    },
    { title: '上报人', dataIndex: 'reporter_name', key: 'reporter_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => {
        const map: any = {
          pending: <Tag color="orange">待处理</Tag>,
          confirmed: <Tag color="green">已确认洗涤</Tag>,
          rejected: <Tag color="red">退回门店</Tag>
        }
        return map[s] || s
      }
    },
    { 
      title: '上报时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (t: string) => dayjs(t).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DamageRecord) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && user.role === 'factory' && (
            <>
              <Button 
                size="small" 
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleResolve(record)}
              >
                复判
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="card-toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>污损复判</h2>
        <Space>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 150 }}
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="pending">待处理</Select.Option>
            <Select.Option value="confirmed">已确认</Select.Option>
            <Select.Option value="rejected">已退回</Select.Option>
          </Select>
        </Space>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={records} 
          rowKey="id"
        />
      </Card>

      <Modal
        title="污损详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={600}
      >
        {currentRecord && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="衣物编号">{currentRecord.clothes_no}</Descriptions.Item>
            <Descriptions.Item label="衣物类别">{currentRecord.category}</Descriptions.Item>
            <Descriptions.Item label="客户姓名">{currentRecord.customer_name}</Descriptions.Item>
            <Descriptions.Item label="污损类型">{currentRecord.damage_type}</Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Tag color={severityColor(currentRecord.severity)}>{severityText(currentRecord.severity)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="详细描述">{currentRecord.description || '无'}</Descriptions.Item>
            <Descriptions.Item label="上报人">{currentRecord.reporter_name}</Descriptions.Item>
            <Descriptions.Item label="上报时间">
              {dayjs(currentRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {currentRecord.dispute_note && (
              <Descriptions.Item label="复判意见">{currentRecord.dispute_note}</Descriptions.Item>
            )}
            {currentRecord.compensation_amount && currentRecord.compensation_amount > 0 && (
              <Descriptions.Item label="赔付金额">¥{currentRecord.compensation_amount}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="污损复判"
        open={resolveVisible}
        onCancel={() => setResolveVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleConfirmResolve} layout="vertical">
          <Form.Item
            name="status"
            label="处理结果"
            rules={[{ required: true, message: '请选择处理结果' }]}
          >
            <Select>
              <Select.Option value="confirmed">确认洗涤（工厂承担风险）</Select.Option>
              <Select.Option value="rejected">退回门店（不洗涤）</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="compensation_amount"
            label="赔付金额（元）"
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="如有赔付请填写金额" />
          </Form.Item>
          <Form.Item
            name="dispute_note"
            label="复判意见"
          >
            <Input.TextArea rows={3} placeholder="请填写复判意见和说明" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认处理
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
