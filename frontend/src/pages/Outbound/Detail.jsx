import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Space, Tag, Divider, Modal, Form, Input, message } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, RollbackOutlined, PrinterOutlined, BarcodeOutlined } from '@ant-design/icons'
import { mockOutbounds, mockWorkOrders, statusMap } from '../../mock/data'
import { printContent } from '../../utils/electron'

function OutboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [outbound, setOutbound] = useState(mockOutbounds.find(o => o.id === id))
  const [returnModalVisible, setReturnModalVisible] = useState(false)
  const [form] = Form.useForm()

  if (!outbound) {
    return <div>出库单不存在</div>
  }

  const relatedWorkOrder = mockWorkOrders.find(w => w.id === outbound.workOrderId)

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
      title: '应出数量',
      dataIndex: 'qty',
      key: 'qty'
    },
    {
      title: '实出数量',
      dataIndex: 'actualQty',
      key: 'actualQty'
    },
    {
      title: '退货数量',
      dataIndex: 'returnedQty',
      key: 'returnedQty',
      render: (v) => v || 0
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
      render: (_, record) => `¥${(record.actualQty || 0) * record.price}`
    }
  ]

  const returnColumns = [
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
      title: '退货原因',
      dataIndex: 'reason',
      key: 'reason'
    }
  ]

  const handleReconcile = () => {
    setOutbound(prev => ({ ...prev, status: 'reconciled' }))
    message.success('对账完成')
  }

  const handleReturn = () => {
    setReturnModalVisible(true)
  }

  const handleConfirmReturn = () => {
    form.validateFields().then(values => {
      setOutbound(prev => ({ 
        ...prev, 
        hasReturn: true,
        returnItems: [...(prev.returnItems || []), { 
          name: values.itemName, 
          model: values.model, 
          qty: values.qty, 
          reason: values.reason 
        }]
      }))
      setReturnModalVisible(false)
      form.resetFields()
      message.success('退货已登记')
    })
  }

  const handlePrint = () => {
    const printHtml = `
      <div class="print-content">
        <div class="print-header">
          <h2>出库单</h2>
          <p>出库单号：${outbound.id}</p>
        </div>
        <p><strong>关联工单：</strong>${outbound.workOrderId}</p>
        <p><strong>客户：</strong>${outbound.customer}</p>
        <p><strong>仓库：</strong>${outbound.warehouse}</p>
        <p><strong>经办人：</strong>${outbound.operator}</p>
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
            ${outbound.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.model}</td>
                <td>${item.actualQty || item.qty}</td>
                <td>¥${item.price}</td>
                <td>¥${(item.actualQty || item.qty) * item.price}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="text-align: right; margin-top: 20px;"><strong>总计：</strong>¥${outbound.actualAmount}</p>
      </div>
    `
    printContent(printHtml)
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/outbound')}>
          返回列表
        </Button>
        <Space>
          <Button icon={<BarcodeOutlined />}>扫码</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>打印</Button>
          {outbound.status === 'pending' && (
            <>
              <Button type="primary" icon={<CheckOutlined />} onClick={handleReconcile}>
                完成对账
              </Button>
              <Button icon={<RollbackOutlined />} onClick={handleReturn}>
                登记退货
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card>
        <Descriptions title="出库信息" bordered column={2}>
          <Descriptions.Item label="出库单号">{outbound.id}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[outbound.status].color}>
              {statusMap[outbound.status].label}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="关联工单">
            <Button type="link" onClick={() => navigate(`/workorder/${outbound.workOrderId}`)}>
              {outbound.workOrderId}
            </Button>
          </Descriptions.Item>
          <Descriptions.Item label="客户">{outbound.customer}</Descriptions.Item>
          <Descriptions.Item label="仓库">{outbound.warehouse}</Descriptions.Item>
          <Descriptions.Item label="经办人">{outbound.operator}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{outbound.createTime}</Descriptions.Item>
          <Descriptions.Item label="实收金额">¥{outbound.actualAmount}</Descriptions.Item>
        </Descriptions>

        {relatedWorkOrder && (
          <>
            <Divider />
            <Descriptions title="关联工单信息" bordered column={2} size="small">
              <Descriptions.Item label="车型">{relatedWorkOrder.carModel}</Descriptions.Item>
              <Descriptions.Item label="车牌号">{relatedWorkOrder.carNumber}</Descriptions.Item>
              <Descriptions.Item label="工单金额">¥{relatedWorkOrder.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="工单状态">
                <Tag color={statusMap[relatedWorkOrder.status].color}>
                  {statusMap[relatedWorkOrder.status].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        <Divider />

        <h3>出库明细</h3>
        <Table
          columns={itemColumns}
          dataSource={outbound.items}
          rowKey={(record, index) => index}
          pagination={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={6} align="right">实收总计</Table.Summary.Cell>
              <Table.Summary.Cell>
                <strong>¥{outbound.actualAmount}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />

        {outbound.returnItems && outbound.returnItems.length > 0 && (
          <>
            <Divider />
            <h3>退货记录</h3>
            <Table
              columns={returnColumns}
              dataSource={outbound.returnItems}
              rowKey={(record, index) => index}
              pagination={false}
            />
          </>
        )}

        {outbound.remark && (
          <>
            <Divider />
            <p><strong>备注：</strong>{outbound.remark}</p>
          </>
        )}
      </Card>

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

export default OutboundDetail
