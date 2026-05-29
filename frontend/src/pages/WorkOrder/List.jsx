import React, { useState } from 'react'
import { Table, Tag, Button, Input, Select, Space, Modal, Form, message } from 'antd'
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, WindowsOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { mockWorkOrders, statusMap } from '../../mock/data'
import { openNewWindow } from '../../utils/electron'

const { Search } = Input
const { Option } = Select

function WorkOrderList() {
  const navigate = useNavigate()
  const [data, setData] = useState(mockWorkOrders)
  const [filterStatus, setFilterStatus] = useState('')
  const [searchText, setSearchText] = useState('')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectingId, setRejectingId] = useState(null)
  const [form] = Form.useForm()

  const filteredData = data.filter(item => {
    const matchStatus = !filterStatus || item.status === filterStatus
    const matchSearch = !searchText || 
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer.includes(searchText)
    return matchStatus && matchSearch
  })

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 140
    },
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer'
    },
    {
      title: '车型',
      dataIndex: 'carModel',
      key: 'carModel'
    },
    {
      title: '车牌号',
      dataIndex: 'carNumber',
      key: 'carNumber'
    },
    {
      title: '配件数量',
      dataIndex: 'items',
      key: 'itemCount',
      render: (items) => `${items.length}项`
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
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
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/workorder/${record.id}`)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                驳回
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

  const handleApprove = (id) => {
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'approved' } : item
    ))
    message.success('工单已通过')
  }

  const handleReject = (id) => {
    setRejectingId(id)
    setRejectModalVisible(true)
  }

  const handleConfirmReject = () => {
    form.validateFields().then(values => {
      setData(prev => prev.map(item => 
        item.id === rejectingId ? { ...item, status: 'rejected', rejectReason: values.reason } : item
      ))
      setRejectModalVisible(false)
      form.resetFields()
      message.success('工单已驳回')
    })
  }

  const handleOpenNewWindow = (id) => {
    openNewWindow(`/workorder/${id}`, `工单详情 - ${id}`, 900, 700)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Search
            placeholder="搜索工单号或客户"
            style={{ width: 240 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="筛选状态"
            style={{ width: 140 }}
            allowClear
            onChange={setFilterStatus}
          >
            <Option value="pending">待处理</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已驳回</Option>
            <Option value="review">需回查</Option>
          </Select>
        </Space>
        <Space>
          <Button icon={<WindowsOutlined />} onClick={() => openNewWindow('/workorder', '维修工单')}>
            多窗口
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            新建工单
          </Button>
        </Space>
      </div>

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

      <Modal
        title="驳回工单"
        open={rejectModalVisible}
        onOk={handleConfirmReject}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form form={form}>
          <Form.Item
            name="reason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入驳回原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkOrderList
