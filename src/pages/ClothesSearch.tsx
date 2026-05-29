import { useState, useEffect } from 'react'
import { Card, Input, Table, Tag, Button, Modal, Descriptions, Timeline, Space, message } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { User, Clothes, OperationLog } from '../types'
import dayjs from 'dayjs'

interface ClothesSearchProps {
  user: User
}

export default function ClothesSearch({ user }: ClothesSearchProps) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Clothes[]>([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentClothes, setCurrentClothes] = useState<Clothes | null>(null)
  const [logs, setLogs] = useState<OperationLog[]>([])

  const handleSearch = async () => {
    if (!keyword.trim()) {
      message.warning('请输入搜索关键词')
      return
    }
    const data = await window.electronAPI.searchClothes(keyword)
    setResults(data || [])
  }

  const handleViewDetail = async (record: Clothes) => {
    setCurrentClothes(record)
    const logsData = await window.electronAPI.getOperationLogs(record.id)
    setLogs(logsData || [])
    setDetailVisible(true)
  }

  const columns = [
    { title: '衣物编号', dataIndex: 'clothes_no', key: 'clothes_no', width: 160 },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '门店', dataIndex: 'store_name', key: 'store_name' },
    { title: '客户姓名', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
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
          returned: <Tag color="default">已返回</Tag>,
          return_to_store: <Tag color="volcano">退回门店</Tag>
        }
        return statusMap[s] || s
      }
    },
    { 
      title: '污损标记', 
      dataIndex: 'has_damage', 
      key: 'has_damage',
      render: (v: number) => v ? <Tag color="red">有污损</Tag> : <Tag color="green">正常</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Clothes) => (
        <Button 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          追踪
        </Button>
      )
    }
  ]

  return (
    <div>
      <h2 className="page-title">衣物查询</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="输入衣物编号、客户姓名、电话搜索"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Button 
            type="primary" 
            size="large" 
            icon={<SearchOutlined />}
            onClick={handleSearch}
          >
            搜索
          </Button>
        </Space.Compact>
      </Card>

      <Card title={`搜索结果 (${results.length})`}>
        <Table 
          columns={columns} 
          dataSource={results} 
          rowKey="id"
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="衣物追踪详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
      >
        {currentClothes && (
          <>
            <Descriptions column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="衣物编号">{currentClothes.clothes_no}</Descriptions.Item>
              <Descriptions.Item label="批次号">{currentClothes.batch_no}</Descriptions.Item>
              <Descriptions.Item label="门店">{currentClothes.store_name}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{currentClothes.customer_name}</Descriptions.Item>
              <Descriptions.Item label="客户电话">{currentClothes.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="类别">{currentClothes.category}</Descriptions.Item>
              <Descriptions.Item label="品牌">{currentClothes.brand}</Descriptions.Item>
              <Descriptions.Item label="颜色">{currentClothes.color}</Descriptions.Item>
              <Descriptions.Item label="尺码">{currentClothes.size}</Descriptions.Item>
              <Descriptions.Item label="价格">¥{currentClothes.price}</Descriptions.Item>
            </Descriptions>
            
            <h4 style={{ marginBottom: 16 }}>操作日志</h4>
            <Timeline>
              {logs.map(log => (
                <Timeline.Item key={log.id}>
                  <div>
                    <strong>{log.operator_name}</strong> - {log.operation}
                    {log.note && <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: 12 }}>{log.note}</p>}
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                </Timeline.Item>
              ))}
              {logs.length === 0 && <p style={{ color: '#999' }}>暂无操作记录</p>}
            </Timeline>
          </>
        )}
      </Modal>
    </div>
  )
}
