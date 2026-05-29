import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Space, Tag, Divider, Modal, Form, Input, message, Spin } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, PrinterOutlined, BarcodeOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { workOrderAPI, outboundAPI } from '../../utils/api'
import { printContent } from '../../utils/electron'

function WorkOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
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
      const result = await workOrderAPI.get(id)
      setOrder(result)
    } catch (error) {
      console.error('加载工单详情失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>
  }

  if (!order) {
    return <div>工单不存在</div>
  }

  const itemColumns = [
    {
      title: '配件名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model'
    },
    {
      title: '数量',
      dataIndex: 'qty',
      key: 'qty'
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (v) => `¥${v}`
    },
    {
      title: '小计',
      key: 'subtotal',
      render: (_, record) => `¥${record.qty * record.price}`
    }
  ]

  const handleApprove = async () => {
    try {
      await workOrderAPI.approve(id)
      message.success('工单已通过，关联出库单已生成')
      loadData()
    } catch (error) {
      console.error('工单通过失败:', error)
      message.error('操作失败')
    }
  }

  const handleReject = () => {
    setRejectModalVisible(true)
  }

  const handleConfirmReject = async () => {
    try {
      const values = await form.validateFields()
      await workOrderAPI.reject(id, values.reason)
      setRejectModalVisible(false)
      form.resetFields()
      message.success('工单已驳回')
      loadData()
    } catch (error) {
      console.error('工单驳回失败:', error)
      message.error('操作失败')
    }
  }

  const handleReview = async () => {
    try {
      await workOrderAPI.review(id, '需核对库存和价格')
      message.success('已标记为需回查')
      loadData()
    } catch (error) {
      console.error('标记回查失败:', error)
      message.error('操作失败')
    }
  }

  const handlePrint = () => {
    const printHtml = `
      <div class="print-content">
        <div class="print-header">
          <h2>维修工单</h2>
          <p>工单编号：${order.id}</p>
        </div>
        <p><strong>客户：</strong>${order.customer}</p>
        <p><strong>车型：</strong>${order.carModel}</p>
        <p><strong>车牌号：</strong>${order.carNumber}</p>
        <table class="print-table">
          <thead>
            <tr>
              <th>配件名称</th>
              <th>型号</th>
              <th>数量</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.model}</td>
                <td>${item.qty}</td>
                <td>¥${item.price}</td>
                <td>¥${item.qty * item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="text-align: right; margin-top: 20px;"><strong>总计：</strong>¥${order.totalAmount}</p>
      </div>
    `
    printContent(printHtml)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/workorder')}>
          返回列表
        </Button>
        <Space>
          <Button onClick={loadData}>刷新</Button>
          <Button icon={<BarcodeOutlined />}>扫码</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>
          {order.status === 'pending' && (
            <>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
                通过
              </Button>
              <Button icon={<ExclamationCircleOutlined />} onClick={handleReview}>
                需回查
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={handleReject}>
                驳回
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card>
        <Descriptions title="工单信息" bordered column={2}>
          <Descriptions.Item label="工单编号">{order.id}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[order.status].color}>
              {statusMap[order.status].label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="客户">{order.customer}</Descriptions.Item>
          <Descriptions.Item label="经办人">{order.handler}</Descriptions.Item>
          <Descriptions.Item label="车型">{order.carModel}</Descriptions.Item>
          <Descriptions.Item label="车牌号">{order.carNumber}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{order.createTime}</Descriptions.Item>
          <Descriptions.Item label="总金额">¥{order.totalAmount}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <h3>配件明细</h3>
        <Table
          columns={itemColumns}
          dataSource={order.items}
          rowKey={(record, index) => index}
          pagination={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={4} align="right">总计</Table.Summary.Cell>
              <Table.Summary.Cell>
                <strong>¥{order.totalAmount}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />

        {order.remark && (
          <>
            <Divider />
            <p><strong>备注：</strong>{order.remark}</p>
          </>
        )}

        {order.rejectReason && (
          <>
            <Divider />
            <p><strong>驳回原因：</strong>{order.rejectReason}</p>
          </>
        )}

        {order.reviewNote && (
          <>
            <Divider />
            <p><strong>回查备注：</strong>{order.reviewNote}</p>
          </>
        )}
      </Card>

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

export default WorkOrderDetail
