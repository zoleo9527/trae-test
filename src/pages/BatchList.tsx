import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { User, Batch } from '../types'
import dayjs from 'dayjs'

interface BatchListProps {
  user: User
}

export default function BatchList({ user }: BatchListProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [batches, setBatches] = useState<Batch[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    setLoading(true)
    const data = await window.electronAPI.getBatches()
    setBatches(data || [])
    setLoading(false)
  }

  const handleCreateBatch = async (values: any) => {
    try {
      const batchNo = `B${dayjs().format('YYYYMMDDHHmmss')}`
      await window.electronAPI.createBatch({
        batch_no: batchNo,
        store_id: values.store_id,
        store_name: values.store_name
      })
      message.success('批次创建成功')
      setModalVisible(false)
      form.resetFields()
      loadBatches()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const columns = [
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no', width: 180 },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '衣物数量', dataIndex: 'total_count', key: 'total_count' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'pending' ? 'orange' : s === 'processing' ? 'blue' : 'green'}>
          {s === 'pending' ? '待处理' : s === 'processing' ? '处理中' : '已完成'}
        </Tag>
      )
    },
    { 
      title: '收件时间', 
      dataIndex: 'received_at', 
      key: 'received_at',
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Batch) => (
        <div className="table-actions">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/batches/${record.id}`)}
          >
            查看
          </Button>
        </div>
      )
    }
  ]

  return (
    <div>
      <div className="card-toolbar">
        <h2 className="page-title" style={{ margin: 0 }}>批次管理</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          新建批次
        </Button>
      </div>

      <Card>
        <Table 
          columns={columns} 
          dataSource={batches} 
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="新建批次"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleCreateBatch} layout="vertical">
          <Form.Item
            name="store_name"
            label="门店名称"
            rules={[{ required: true, message: '请输入门店名称' }]}
          >
            <Input placeholder="请输入门店名称" />
          </Form.Item>
          <Form.Item
            name="store_id"
            label="门店ID"
            rules={[{ required: true, message: '请输入门店ID' }]}
          >
            <Input type="number" placeholder="请输入门店ID" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建批次
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
