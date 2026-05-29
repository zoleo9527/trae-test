import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Space, Tag, Divider, Modal, Form, Input, message, Row, Col } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, PrinterOutlined, BarcodeOutlined } from '@ant-design/icons'
import { mockWorkOrders, statusMap } from '../../mock/data'
import { printContent } from '../../utils/electron'

function WorkOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(mockWorkOrders.find(o => o.id === id))
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [form] = Form.useForm()

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

  const handleApprove = () => {
    setOrder(prev => ({ ...prev, status: 'approved' }))
    message.success('工单已通过')
  }

  const handleReject = () => {
    setRejectModalVisible(true)
  }

  const handleConfirmReject = () => {
    form.validateFields().then(values => {
      setOrder(prev => ({ ...prev, status: 'rejected', rejectReason: values.reason }))
      setRejectModalVisible(false)
      message.success('工单已驳回')
    })
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
          <Button icon={<BarcodeOutlined />}>扫码</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>
          {order.status === 'pending' && (
            <>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleApprove}>
                通过
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
