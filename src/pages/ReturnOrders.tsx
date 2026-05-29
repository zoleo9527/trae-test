import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Modal, Input, Form, Checkbox, message, Descriptions, Timeline, Row, Col, Select, Statistic } from 'antd'
import { EyeOutlined, CheckCircleOutlined, SendOutlined, InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { User, ReturnOrder, ReturnOrderItem, Batch, Clothes } from '../types'
import { RETURN_ORDER_STATUS, RETURN_ITEM_STATUS, CLOTHES_STATUS } from '../types'
import dayjs from 'dayjs'

interface ReturnOrdersProps {
  user: User
}

export default function ReturnOrders({ user }: ReturnOrdersProps) {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ReturnOrder[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [signVisible, setSignVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<ReturnOrder | null>(null)
  const [currentItem, setCurrentItem] = useState<ReturnOrderItem | null>(null)
  const [pendingClothes, setPendingClothes] = useState<Clothes[]>([])
  const [form] = Form.useForm()
  const [signForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const ordersData = user.role === 'store' 
      ? await window.electronAPI.getReturnOrders(user.id)
      : await window.electronAPI.getReturnOrders()
    setOrders(ordersData || [])
    
    if (user.role !== 'store') {
      const batchesData = await window.electronAPI.getBatches()
      const clothesData = await window.electronAPI.getClothesForReturn()
      setPendingClothes(clothesData || [])
      
      const batchesWithReturnable: Batch[] = []
      const returnableByBatch = new Map<number, number>()
      
      clothesData?.forEach((c: Clothes) => {
        if (c.batch_id) {
          returnableByBatch.set(c.batch_id, (returnableByBatch.get(c.batch_id) || 0) + 1)
        }
      })
      
      batchesData?.forEach((b: Batch) => {
        if (returnableByBatch.has(b.id) && b.status !== 'completed') {
          batchesWithReturnable.push(b)
        }
      })
      
      setBatches(batchesWithReturnable)
    }
  }

  const handleViewDetail = async (order: ReturnOrder) => {
    const detail = await window.electronAPI.getReturnOrderById(order.id)
    setCurrentOrder(detail)
    setDetailVisible(true)
  }

  const handleCreateOrder = async (values: { batch_id: number }) => {
    try {
      const batch = batches.find(b => b.id === values.batch_id)
      if (!batch) return
      
      await window.electronAPI.createReturnOrder({
        batch_id: values.batch_id,
        store_id: batch.store_id,
        store_name: batch.store_name,
        sent_by: user.id,
        sent_by_name: user.name
      })
      message.success('回单已创建并发送到门店')
      setCreateVisible(false)
      form.resetFields()
      loadData()
    } catch (e: any) {
      message.error(e.message || '创建失败')
    }
  }

  const handleSignItem = (item: ReturnOrderItem) => {
    setCurrentItem(item)
    signForm.resetFields()
    setSignVisible(true)
  }

  const handleConfirmSign = async (values: { damage_found?: boolean; damage_note?: string }) => {
    if (!currentItem) return
    
    try {
      await window.electronAPI.signReturnOrderItem({
        item_id: currentItem.id,
        clothes_id: currentItem.clothes_id,
        signed_by: user.id,
        signed_by_name: user.name,
        damage_found: values.damage_found ? 1 : 0,
        damage_note: values.damage_note
      })
      message.success('签收成功')
      setSignVisible(false)
      
      const detail = await window.electronAPI.getReturnOrderById(currentOrder!.id)
      setCurrentOrder(detail)
      loadData()
    } catch (e: any) {
      message.error(e.message || '签收失败')
    }
  }

  const handleBatchSign = async () => {
    if (!currentOrder) return
    
    try {
      const count = await window.electronAPI.batchSignReturnOrder({
        order_id: currentOrder.id,
        signed_by: user.id,
        signed_by_name: user.name
      })
      message.success(`批量签收成功，共 ${count} 件`)
      
      const detail = await window.electronAPI.getReturnOrderById(currentOrder.id)
      setCurrentOrder(detail)
      loadData()
    } catch (e: any) {
      message.error(e.message || '批量签收失败')
    }
  }

  const columns = [
    { title: '回单号', dataIndex: 'return_no', key: 'return_no', width: 160 },
    { title: '关联批次', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '总件数', dataIndex: 'total_count', key: 'total_count' },
    { 
      title: '已签收', 
      key: 'signed_progress',
      render: (_: any, record: any) => `${record.actual_signed_count || record.signed_count || 0} / ${record.total_count}`
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => {
        const statusMap: any = {
          pending: <Tag color="default">待发出</Tag>,
          sent: <Tag color="orange">待签收</Tag>,
          completed: <Tag color="green">已完成</Tag>
        }
        return statusMap[s] || s
      }
    },
    { 
      title: '发出时间', 
      dataIndex: 'sent_at', 
      key: 'sent_at',
      render: (t: string) => t ? dayjs(t).format('MM-DD HH:mm') : '-'
    },
    { 
      title: '签收时间', 
      dataIndex: 'signed_at', 
      key: 'signed_at',
      render: (t: string) => t ? dayjs(t).format('MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ReturnOrder) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  const itemColumns = [
    { title: '衣物编号', dataIndex: 'clothes_no', key: 'clothes_no', width: 160 },
    { title: '客户姓名', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => {
        const statusMap: any = {
          pending: <Tag color="orange">待签收</Tag>,
          signed: <Tag color="green">已签收</Tag>
        }
        return statusMap[s] || s
      }
    },
    { 
      title: '污损标记', 
      dataIndex: 'damage_found', 
      key: 'damage_found',
      render: (v: number) => v ? <Tag color="red">有新污损</Tag> : <Tag color="green">正常</Tag>
    },
    { title: '污损备注', dataIndex: 'damage_note', key: 'damage_note' },
    { 
      title: '签收时间', 
      dataIndex: 'signed_at', 
      key: 'signed_at',
      render: (t: string) => t ? dayjs(t).format('MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ReturnOrderItem) => (
        <Space>
          {record.status === 'pending' && user.role === 'store' && (
            <Button 
              size="small" 
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleSignItem(record)}
            >
              签收
            </Button>
          )}
        </Space>
      )
    }
  ]

  const pendingCount = orders.filter(o => o.status === 'sent').length
  const completedCount = orders.filter(o => o.status === 'completed').length

  return (
    <div>
      <div className="card-toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>门店回单</h2>
        {user.role !== 'store' && (
          <Button 
            type="primary" 
            icon={<SendOutlined />}
            onClick={() => setCreateVisible(true)}
          >
            发出回单
          </Button>
        )}
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="待签收回单" 
              value={pendingCount} 
              valueStyle={{ color: '#faad14' }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="已完成回单" 
              value={completedCount} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="回单总数" 
              value={orders.length} 
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table 
          columns={columns} 
          dataSource={orders} 
          rowKey="id"
        />
      </Card>

      <Modal
        title="回单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={900}
        footer={[
          currentOrder?.status === 'sent' && user.role === 'store' && 
          ((currentOrder as any).actual_signed_count || currentOrder.signed_count || 0) < currentOrder.total_count && (
            <Button 
              key="batch" 
              type="primary" 
              onClick={handleBatchSign}
            >
              一键签收全部 ({currentOrder.total_count - ((currentOrder as any).actual_signed_count || currentOrder.signed_count || 0)} 件)
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
      >
        {currentOrder && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="回单号">{currentOrder.return_no}</Descriptions.Item>
              <Descriptions.Item label="关联批次">{currentOrder.batch_no}</Descriptions.Item>
              <Descriptions.Item label="门店">{currentOrder.store_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={currentOrder.status === 'completed' ? 'green' : 'orange'}>
                  {RETURN_ORDER_STATUS[currentOrder.status as keyof typeof RETURN_ORDER_STATUS]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总件数">{currentOrder.total_count}</Descriptions.Item>
              <Descriptions.Item label="已签收">
                {(currentOrder as any).actual_signed_count || currentOrder.signed_count || 0}
              </Descriptions.Item>
              <Descriptions.Item label="发出时间">
                {currentOrder.sent_at ? dayjs(currentOrder.sent_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="签收时间">
                {currentOrder.signed_at ? dayjs(currentOrder.signed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
            
            <h4 style={{ marginBottom: 16 }}>衣物清单</h4>
            <Table 
              columns={itemColumns} 
              dataSource={currentOrder.items} 
              rowKey="id"
              size="small"
              pagination={false}
            />
          </>
        )}
      </Modal>

      <Modal
        title="发出回单"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
        width={600}
      >
        {pendingClothes.length > 0 && (
          <Card 
            size="small" 
            style={{ marginBottom: 16, background: '#fffbe6' }}
            title={`待返回衣物 (${pendingClothes.length} 件)`}
          >
            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
              {pendingClothes.map(c => (
                <div key={c.id} style={{ padding: '4px 0', fontSize: 12 }}>
                  <Tag color={c.status === 'return_to_store' ? 'red' : 'cyan'}>
                    {CLOTHES_STATUS[c.status as keyof typeof CLOTHES_STATUS]}
                  </Tag>
                  {c.clothes_no} - {c.customer_name} ({c.category})
                  <span style={{ color: '#999', marginLeft: 8 }}>[{c.batch_no}]</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        <Form form={form} onFinish={handleCreateOrder} layout="vertical">
          <Form.Item
            name="batch_id"
            label="选择批次"
            rules={[{ required: true, message: '请选择批次' }]}
          >
            <Select
              placeholder="选择要发出回单的批次"
              showSearch
              optionFilterProp="children"
            >
              {batches.map(b => {
                const returnableCount = pendingClothes.filter(c => c.batch_id === b.id).length
                const statusMap: any = {
                  pending: '待处理',
                  processing: '处理中',
                  returning: '返回中',
                  completed: '已完成'
                }
                return (
                  <Select.Option key={b.id} value={b.id}>
                    {b.batch_no} - {b.store_name} 
                    <Tag color="blue" style={{ marginLeft: 8 }}>{statusMap[b.status] || b.status}</Tag>
                    <span style={{ color: '#52c41a', marginLeft: 8 }}>可返回 {returnableCount} 件</span>
                  </Select.Option>
                )
              })}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              发出回单
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="签收衣物"
        open={signVisible}
        onCancel={() => setSignVisible(false)}
        footer={null}
        width={500}
      >
        {currentItem && (
          <>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="衣物编号">{currentItem.clothes_no}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{currentItem.customer_name}</Descriptions.Item>
              <Descriptions.Item label="类别">{currentItem.category}</Descriptions.Item>
            </Descriptions>
            
            <Form form={signForm} onFinish={handleConfirmSign} layout="vertical">
              <Form.Item name="damage_found" valuePropName="checked">
                <Checkbox>签收时发现新污损</Checkbox>
              </Form.Item>
              <Form.Item name="damage_note" label="污损描述">
                <Input.TextArea 
                  rows={3} 
                  placeholder="如有污损，请详细描述"
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  确认签收
                </Button>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}
