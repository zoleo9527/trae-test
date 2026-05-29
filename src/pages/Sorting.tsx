import { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Table, Tag, Space, Modal, Form, Select, message, Row, Col } from 'antd'
import { ScanOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { User, Clothes, Batch } from '../types'
import { CLOTHES_STATUS, CLOTHES_CATEGORIES, DAMAGE_TYPES } from '../types'
import dayjs from 'dayjs'

interface SortingProps {
  user: User
}

export default function Sorting({ user }: SortingProps) {
  const [scanCode, setScanCode] = useState('')
  const [currentClothes, setCurrentClothes] = useState<Clothes | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null)
  const [damageModalVisible, setDamageModalVisible] = useState(false)
  const [scannedList, setScannedList] = useState<Clothes[]>([])
  const [form] = Form.useForm()
  const inputRef = useRef<any>(null)

  useEffect(() => {
    loadBatches()
    loadCache()
  }, [])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const loadBatches = async () => {
    const data = await window.electronAPI.getBatches()
    setBatches(data || [])
  }

  const loadCache = async () => {
    const cached = await window.electronAPI.getCache('sorting_list')
    if (cached) {
      const cachedList = JSON.parse(cached) as Clothes[]
      const validList: Clothes[] = []
      for (const c of cachedList) {
        if (typeof c.id === 'number' && c.id > 0 && Number.isInteger(c.id)) {
          const dbClothes = await window.electronAPI.getClothesById(c.id)
          if (dbClothes) {
            validList.push(dbClothes)
          }
        }
      }
      setScannedList(validList)
      if (validList.length !== cachedList.length) {
        saveCache(validList)
      }
    }
  }

  const saveCache = async (list: Clothes[]) => {
    await window.electronAPI.saveCache('sorting_list', JSON.stringify(list))
  }

  const handleScan = async () => {
    if (!scanCode.trim() || !selectedBatch) {
      if (!selectedBatch) message.warning('请先选择批次')
      return
    }

    const existing = scannedList.find(c => c.clothes_no === scanCode)
    if (existing) {
      message.warning('该衣物已扫描')
      setScanCode('')
      return
    }

    const results = await window.electronAPI.searchClothes(scanCode)
    let clothes: Clothes | null = results?.[0] || null

    if (clothes) {
      if (clothes.batch_id && clothes.batch_id !== selectedBatch) {
        message.error(`该衣物已属于其他批次 (${clothes.batch_no})，不允许跨批次混入`)
        setScanCode('')
        return
      }
    } else {
      const clothesNo = scanCode.startsWith('C') ? scanCode : `C${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000)}`
      try {
        const newId = await window.electronAPI.addClothes({
          clothes_no: clothesNo,
          batch_id: selectedBatch,
          customer_name: '',
          customer_phone: '',
          category: '未分类',
          brand: '',
          color: '',
          size: '',
          price: 0,
          services: '',
          status: 'sorting',
          operator_id: user.id,
          operator_name: user.name
        })
        clothes = await window.electronAPI.getClothesById(newId)
      } catch (e) {
        message.error('衣物入库失败，请重试')
        setScanCode('')
        return
      }
    }

    if (clothes) {
      const newList = [clothes, ...scannedList]
      setScannedList(newList)
      setCurrentClothes(clothes)
      setScanCode('')
      saveCache(newList)
    }

    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleReportDamage = async (values: any) => {
    if (!currentClothes) return
    
    try {
      await window.electronAPI.reportDamage({
        clothes_id: currentClothes.id,
        damage_type: values.damage_type,
        description: values.description,
        severity: values.severity,
        evidence_photos: '',
        reported_by: user.id,
        reported_by_name: user.name
      })
      message.success('污损已上报')
      setDamageModalVisible(false)
      form.resetFields()
      
      const updatedList = scannedList.map(c => 
        c.id === currentClothes.id ? { ...c, has_damage: 1, status: 'damage_reported' } : c
      )
      setScannedList(updatedList)
      saveCache(updatedList)
    } catch (e) {
      message.error('上报失败')
    }
  }

  const handleCompleteSorting = async (item: Clothes) => {
    try {
      await window.electronAPI.updateClothesStatus(item.id, 'sorted', user.id, user.name)
      message.success('分拣完成')
      
      const updatedList = scannedList.map(c => 
        c.id === item.id ? { ...c, status: 'sorted' } : c
      )
      setScannedList(updatedList)
      saveCache(updatedList)
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleClearCache = async () => {
    await window.electronAPI.clearCache('sorting_list')
    setScannedList([])
    message.success('缓存已清空')
  }

  const columns = [
    { title: '衣物编号', dataIndex: 'clothes_no', key: 'clothes_no', width: 160 },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '客户', dataIndex: 'customer_name', key: 'customer_name' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s: string) => {
        const statusMap: any = {
          sorting: <Tag color="orange">分拣中</Tag>,
          sorted: <Tag color="green">已分拣</Tag>,
          damage_reported: <Tag color="red">污损待确认</Tag>
        }
        return statusMap[s] || s
      }
    },
    { 
      title: '污损', 
      dataIndex: 'has_damage', 
      key: 'has_damage',
      render: (v: number) => v ? <Tag color="red">有污损</Tag> : <Tag color="green">正常</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Clothes) => (
        <Space>
          {record.status === 'sorting' && (
            <>
              <Button 
                size="small" 
                danger
                icon={<ExclamationCircleOutlined />}
                onClick={() => {
                  setCurrentClothes(record)
                  setDamageModalVisible(true)
                }}
              >
                报污损
              </Button>
              <Button 
                size="small" 
                type="primary"
                onClick={() => handleCompleteSorting(record)}
              >
                分拣完成
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 className="page-title">收衣分拣</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择批次"
              value={selectedBatch}
              onChange={setSelectedBatch}
            >
              {batches.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.batch_no} - {b.store_name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={14}>
            <Input.Search
              ref={inputRef}
              value={scanCode}
              onChange={e => setScanCode(e.target.value)}
              onSearch={handleScan}
              placeholder="扫描衣物编号或直接输入"
              enterButton={<Button type="primary" icon={<ScanOutlined />}>扫描</Button>}
              size="large"
              onPressEnter={handleScan}
              autoFocus
            />
          </Col>
          <Col span={4}>
            <Button onClick={handleClearCache}>清空缓存</Button>
          </Col>
        </Row>
      </Card>

      <Card title={`已扫描 (${scannedList.length})`}>
        <Table 
          columns={columns} 
          dataSource={scannedList} 
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="上报污损"
        open={damageModalVisible}
        onCancel={() => setDamageModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleReportDamage} layout="vertical">
          <Form.Item
            name="damage_type"
            label="污损类型"
            rules={[{ required: true }]}
          >
            <Select>
              {DAMAGE_TYPES.map(t => (
                <Select.Option key={t} value={t}>{t}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="severity"
            label="严重程度"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="minor">轻微</Select.Option>
              <Select.Option value="major">较重</Select.Option>
              <Select.Option value="critical">严重</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={3} placeholder="请详细描述污损情况" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认上报
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
