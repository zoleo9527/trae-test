import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, InputNumber, message, Upload, Timeline } from 'antd'
import { PlusOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import type { User, Batch, Clothes, OperationLog } from '../types'
import { CLOTHES_STATUS, CLOTHES_CATEGORIES } from '../types'
import dayjs from 'dayjs'

interface BatchDetailProps {
  user: User
}

export default function BatchDetail({ user }: BatchDetailProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [batch, setBatch] = useState<Batch | null>(null)
  const [clothes, setClothes] = useState<Clothes[]>([])
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [logsVisible, setLogsVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    const batchData = await window.electronAPI.getBatchById(Number(id))
    const clothesData = await window.electronAPI.getClothesByBatch(Number(id))
    const logsData = await window.electronAPI.getOperationLogs(undefined, Number(id))
    
    setBatch(batchData)
    setClothes(clothesData || [])
    setLogs(logsData || [])
  }

  const handleAddClothes = async (values: any) => {
    try {
      const clothesNo = `C${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000)}`
      await window.electronAPI.addClothes({
        ...values,
        clothes_no: clothesNo,
        batch_id: Number(id),
        status: 'received',
        operator_id: user.id,
        operator_name: user.name
      })
      message.success('添加成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const handleImportExcel = async () => {
    const filePath = await window.electronAPI.selectFile()
    if (!filePath) return

    try {
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const data = XLSX.utils.sheet_to_json(sheet) as any[]

      const clothesList = data.map((item: any, index: number) => ({
        clothes_no: item['衣物编号'] || `C${dayjs().format('YYYYMMDDHHmmss')}${String(index).padStart(3, '0')}`,
        batch_id: Number(id),
        customer_name: item['客户姓名'] || '',
        customer_phone: String(item['客户电话'] || ''),
        category: item['衣物类别'] || '其他',
        brand: item['品牌'] || '',
        color: item['颜色'] || '',
        size: item['尺码'] || '',
        price: item['价格'] || 0,
        services: item['服务项目'] || '标准洗涤',
        status: 'received',
        operator_id: user.id,
        operator_name: user.name
      }))

      await window.electronAPI.batchAddClothes(clothesList)
      message.success(`成功导入 ${clothesList.length} 件衣物`)
      loadData()
    } catch (e) {
      message.error('导入失败')
    }
  }

  const handleStatusChange = async (record: Clothes, status: string) => {
    await window.electronAPI.updateClothesStatus(record.id, status, user.id, user.name)
    message.success('状态已更新')
    loadData()
  }

  const columns = [
    { title: '衣物编号', dataIndex: 'clothes_no', key: 'clothes_no', width: 160 },
    { title: '客户姓名', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '客户电话', dataIndex: 'customer_phone', key: 'customer_phone' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '颜色', dataIndex: 'color', key: 'color' },
    { title: '价格', dataIndex: 'price', key: 'price' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => {
        const statusMap: any = {
          received: <Tag color="blue">已收件</Tag>,
          sorting: <Tag color="orange">分拣中</Tag>,
          sorted: <Tag color="cyan">已分拣</Tag>,
          damage_reported: <Tag color="red">污损待确认</Tag>,
          washing: <Tag color="purple">洗涤中</Tag>,
          washed: <Tag color="green">已洗涤</Tag>,
          returned: <Tag color="default">已返回</Tag>
        }
        return statusMap[s] || s
      }
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: Clothes) => (
        <Space>
          <Select
            size="small"
            placeholder="变更状态"
            style={{ width: 120 }}
            onChange={(v: string) => handleStatusChange(record, v)}
          >
            {Object.entries(CLOTHES_STATUS).map(([key, label]) => (
              <Select.Option key={key} value={key}>{label}</Select.Option>
            ))}
          </Select>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="batch-detail-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/batches')}>
            返回
          </Button>
          <h2 className="page-title" style={{ margin: 0 }}>
            批次详情 - {batch?.batch_no}
          </h2>
          <Tag>{batch?.store_name}</Tag>
        </Space>
        <Button onClick={() => setLogsVisible(true)}>查看操作日志</Button>
      </div>

      <Card>
        <div className="card-toolbar">
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              添加衣物
            </Button>
            <Button icon={<UploadOutlined />} onClick={handleImportExcel}>
              批量导入Excel
            </Button>
          </Space>
          <span>共 {clothes.length} 件衣物</span>
        </div>

        <Table 
          columns={columns} 
          dataSource={clothes} 
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="添加衣物"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleAddClothes} layout="vertical">
          <Form.Item name="customer_name" label="客户姓名">
            <Input placeholder="请输入客户姓名" />
          </Form.Item>
          <Form.Item name="customer_phone" label="客户电话">
            <Input placeholder="请输入客户电话" />
          </Form.Item>
          <Form.Item name="category" label="衣物类别">
            <Select>
              {CLOTHES_CATEGORIES.map(c => (
                <Select.Option key={c} value={c}>{c}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input placeholder="请输入品牌" />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Input placeholder="请输入颜色" />
          </Form.Item>
          <Form.Item name="size" label="尺码">
            <Input placeholder="请输入尺码" />
          </Form.Item>
          <Form.Item name="price" label="价格">
            <InputNumber style={{ width: '100%' }} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item name="services" label="服务项目">
            <Input placeholder="请输入服务项目" defaultValue="标准洗涤" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="操作日志"
        open={logsVisible}
        onCancel={() => setLogsVisible(false)}
        footer={null}
        width={600}
      >
        <Timeline>
          {logs.map(log => (
            <Timeline.Item key={log.id}>
              <div>
                <strong>{log.operator_name}</strong> {log.operation}
                {log.note && <p style={{ color: '#666', margin: 0 }}>{log.note}</p>}
                <span style={{ color: '#999', fontSize: 12 }}>
                  {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Modal>
    </div>
  )
}
