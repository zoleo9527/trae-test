import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Input, Select, Space, Modal, Form, message, Spin } from 'antd'
import { PlusOutlined, EyeOutlined, CheckOutlined, RollbackOutlined, WindowsOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { outboundAPI } from '../../utils/api'
import { openNewWindow } from '../../utils/electron'

const { Search } = Input
const { Option } = Select

function OutboundList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [searchText, setSearchText] = useState('')
  const [returnModalVisible, setReturnModalVisible] = useState(false)
  const [returningId, setReturningId] = useState(null)
  const [form] = Form.useForm()

  const statusMap = {
    pending: { label: '待对账', color: 'warning' },
    reconciled: { label: '已对账', color: 'success' },
    review: { label: '需回查', color: 'processing' }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await outboundAPI.list()
      setData(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error('加载出库列表失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = data.filter(item => {
    const matchStatus = !filterStatus || item.status === filterStatus
    const matchSearch = !searchText || 
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer.includes(searchText) ||
      item.workOrderId.toLowerCase().includes(searchText.toLowerCase())
    return matchStatus && matchSearch
  })

  const columns = [
    {
      title: '出库单号',
      dataIndex: 'id',
      key: 'id',
      width: 140
    },
    {
      title: '关联工单',
      dataIndex: 'workOrderId',
      key: 'workOrderId',
      width: 140,
      render: (id) => (
        <Button type="link" onClick={() => navigate(`/workorder/${id}`)}>
          {id}
        </Button>
      )
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: '仓库',
      dataIndex: 'warehouse',
      key: 'warehouse'
    },
    {
      title: '商品数量',
      dataIndex: 'items',
      key: 'itemCount',
      render: (items) => `${(items || []).length}项`
    },
    {
      title: '应收金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v) => `¥${v}`
    },
    {
      title: '实收金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (v) => `¥${v}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = statusMap[status]
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      }
    },
    {
      title: '退货',
      dataIndex: 'hasReturn',
      key: 'hasReturn',
      render: (v) => v ? <Tag color="orange">有退货</Tag> : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/outbound/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleReconcile(record.id)}
              >
                对账
              </Button>
              <Button
                type="link"
                icon={<RollbackOutlined />}
                onClick={() => handleReturn(record.id)}
              >
                退货
              </Button>
            </>
          )}
          <Button
            type="link"
            icon={<WindowsOutlined />}
            onClick={() => handleOpenNewWindow(record.id)}
          >
            新窗口
          </Button>
        </Space>
      )
    }
  ]

  const handleReconcile = async (id) => {
    try {
      await outboundAPI.reconcile(id, {})
      message.success('对账完成')
      loadData()
    } catch (error) {
      console.error('对账失败:', error)
      message.error('操作失败')
    }
  }

  const handleReturn = (id) => {
    setReturningId(id)
    setReturnModalVisible(true)
  }

  const handleConfirmReturn = async () => {
    try {
      const values = await form.validateFields()
      await outboundAPI.return(returningId, values)
      setReturnModalVisible(false)
      form.resetFields()
      message.success('退货已登记')
      loadData()
    } catch (error) {
      console.error('退货登记失败:', error)
      message.error('操作失败')
    }
  }

  const handleOpenNewWindow = (id) => {
    openNewWindow(`/outbound/${id}`, `出库详情 - ${id}`, 900, 700)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Search
            placeholder="搜索出库单、工单号或客户"
            style={{ width: 260 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="筛选状态"
            style={{ width: 140 }}
            allowClear
            onChange={setFilterStatus}
          >
            <Option value="pending">待对账</Option>
            <Option value="reconciled">已对账</Option>
            <Option value="review">需回查</Option>
          </Select>
          <Button onClick={loadData}>刷新</Button>
        </Space>
        <Space>
          <Button icon={<WindowsOutlined />} onClick={() => openNewWindow('/outbound', '出库对账')}>
            多窗口
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新建出库
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Spin>

      <Modal
        title="退货登记"
        open={returnModalVisible}
        onOk={handleConfirmReturn}
        onCancel={() => setReturnModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="itemName"
            label="退货商品名称"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item
            name="model"
            label="型号"
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="请输入型号" />
          </Form.Item>
          <Form.Item
            name="qty"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <Input type="number" placeholder="请输入数量" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="退货原因"
            rules={[{ required: true, message: '请输入退货原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入退货原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OutboundList
