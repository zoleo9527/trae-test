import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Input, Select, Space, Modal, Form, message, Spin } from 'antd'
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, WindowsOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { workOrderAPI, outboundAPI } from '../../utils/api'
import { openNewWindow } from '../../utils/electron'

const { Search } = Input
const { Option } = Select

function WorkOrderList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [searchText, setSearchText] = useState('')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectingId, setRejectingId] = useState(null)
  const [form] = Form.useForm()

  const statusMap = {
    pending: { label: '待处理', color: 'warning' },
    approved: { label: '已通过', color: 'success' },
    rejected: { label: '已驳回', color: 'error' },
    review: { label: '需回查', color: 'processing' }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await workOrderAPI.list()
      setData(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error('加载工单列表失败:', error)
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
      render: (items) => `${(items || []).length}项`
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
      width: 280,
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
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleReview(record.id)}
            >
              回查
            </Button>
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

  const handleApprove = async (id) => {
    try {
      await workOrderAPI.approve(id)
      message.success('工单已通过，关联出库单已生成')
      loadData()
    } catch (error) {
      console.error('工单通过失败:', error)
      message.error('操作失败')
    }
  }

  const handleReject = (id) => {
    setRejectingId(id)
    setRejectModalVisible(true)
  }

  const handleConfirmReject = async () => {
    try {
      const values = await form.validateFields()
      await workOrderAPI.reject(rejectingId, values.reason)
      setRejectModalVisible(false)
      form.resetFields()
      message.success('工单已驳回')
      loadData()
    } catch (error) {
      console.error('工单驳回失败:', error)
      message.error('操作失败')
    }
  }

  const handleReview = async (id) => {
    try {
      await workOrderAPI.review(id, '需核对库存和价格')
      message.success('已标记为需回查')
      loadData()
    } catch (error) {
      console.error('标记回查失败:', error)
      message.error('操作失败')
    }
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
          <Button onClick={loadData}>刷新</Button>
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
