import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Button, Space, Tag, Divider, Modal, Form, Input, message, Spin } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, RollbackOutlined, PrinterOutlined, BarcodeOutlined } from '@ant-design/icons'
import { outboundAPI, workOrderAPI } from '../../utils/api'
import { printContent } from '../../utils/electron'

function OutboundDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [outbound, setOutbound] = useState(null)
  const [relatedWorkOrder, setRelatedWorkOrder] = useState(null)
  const [returnModalVisible, setReturnModalVisible] = useState(false)
  const [scanModalVisible, setScanModalVisible] = useState(false)
  const [scanValue, setScanValue] = useState('')
  const [scanLoading, setScanLoading] = useState(false)
  const [form] = Form.useForm()

  const statusMap = {
    pending: { label: '待对账', color: 'warning' },
    reconciled: { label: '已对账', color: 'success' },
    review: { label: '需回查', color: 'processing' }
  }

  const workOrderStatusMap = {
    pending: { label: '待处理', color: 'warning' },
    approved: { label: '已通过', color: 'success' },
    rejected: { label: '已驳回', color: 'error' },
    review: { label: '需回查', color: 'processing' }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [outboundData, workOrderData] = await Promise.all([
        outboundAPI.get(id),
        workOrderAPI.list()
      ])
      setOutbound(outboundData)
      const orders = Array.isArray(workOrderData) ? workOrderData : []
      setRelatedWorkOrder(orders.find(w => w.id === outboundData.workOrderId) || null)
    } catch (error) {
      console.error('加载出库详情失败:', error)
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

  if (!outbound) {
    return <div>出库单不存在</div>
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

  const handleReconcile = async () => {
    try {
      await outboundAPI.reconcile(id, {})
      message.success('对账完成')
      loadData()
    } catch (error) {
      console.error('对账失败:', error)
      message.error('操作失败')
    }
  }

  const handleReturn = () => {
    setReturnModalVisible(true)
  }

  const handleConfirmReturn = async () => {
    try {
      const values = await form.validateFields()
      await outboundAPI.return(id, values)
      setReturnModalVisible(false)
      form.resetFields()
      message.success('退货已登记')
      loadData()
    } catch (error) {
      console.error('退货登记失败:', error)
      message.error('操作失败')
    }
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

  const handleScanClick = () => {
    setScanValue('')
    setScanModalVisible(true)
  }

  const handleScanSubmit = async () => {
    if (!scanValue.trim()) {
      message.warning('请输入或扫描单据编号')
      return
    }
    const code = scanValue.trim().toUpperCase()
    setScanLoading(true)
    try {
      if (code.startsWith('WO')) {
        try {
          await workOrderAPI.get(code)
          setScanModalVisible(false)
          navigate(`/workorder/${code}`)
          return
        } catch {
          message.error(`未找到工单：${code}`)
          return
        }
      }
      if (code.startsWith('OB')) {
        try {
          await outboundAPI.get(code)
          setScanModalVisible(false)
          navigate(`/outbound/${code}`)
          return
        } catch {
          message.error(`未找到出库单：${code}`)
          return
        }
      }
      try {
        await workOrderAPI.get(code)
        setScanModalVisible(false)
        navigate(`/workorder/${code}`)
        return
      } catch {}
      try {
        await outboundAPI.get(code)
        setScanModalVisible(false)
        navigate(`/outbound/${code}`)
        return
      } catch {}
      message.error(`未匹配到任何单据：${code}`)
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/outbound')}>
          返回列表
        </Button>
        <Space>
          <Button onClick={loadData}>刷新</Button>
          <Button icon={<BarcodeOutlined />} onClick={handleScanClick}>扫码</Button>
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
                <Tag color={workOrderStatusMap[relatedWorkOrder.status]?.color || 'default'}>
                  {workOrderStatusMap[relatedWorkOrder.status]?.label || relatedWorkOrder.status}
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

      <Modal
        title="扫码查询"
        open={scanModalVisible}
        onOk={handleScanSubmit}
        onCancel={() => setScanModalVisible(false)}
        okText="查询"
        confirmLoading={scanLoading}
      >
        <p style={{ color: '#666', marginBottom: 12 }}>请输入或扫描工单号（WO开头）或出库单号（OB开头）</p>
        <Input
          autoFocus
          size="large"
          placeholder="例如：WO202401001 或 OB202401001"
          value={scanValue}
          onChange={(e) => setScanValue(e.target.value)}
          onPressEnter={handleScanSubmit}
          prefix={<BarcodeOutlined />}
        />
      </Modal>
    </div>
  )
}

export default OutboundDetail
