import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Input, Select, Row, Col, message } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { projectsAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const { Search } = Input
const { Option } = Select

function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ status: '', keyword: '' })
  const navigate = useNavigate()

  useEffect(() => {
    loadProjects()
  }, [filters])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      const res = await projectsAPI.getProjects(params)
      let data = res.data
      if (filters.keyword) {
        data = data.filter(p => 
          p.name.includes(filters.keyword) || 
          p.client_name.includes(filters.keyword)
        )
      }
      setProjects(data)
    } catch (err) {
      message.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    active: 'green',
    expiring: 'orange',
    renewal: 'blue',
    ended: 'gray'
  }

  const statusLabels = {
    active: '执行中',
    expiring: '即将到期',
    renewal: '续约中',
    ended: '已结束'
  }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>
          <strong>{text}</strong>
        </a>
      )
    },
    {
      title: '客户名称',
      dataIndex: 'client_name',
      key: 'client_name'
    },
    {
      title: '项目主管',
      dataIndex: 'manager_name',
      key: 'manager_name'
    },
    {
      title: '合同金额',
      dataIndex: 'contract_amount',
      key: 'contract_amount',
      render: (val) => `¥${val?.toLocaleString() || 0}`
    },
    {
      title: '合同期限',
      key: 'contract',
      render: (_, record) => (
        <div>
          <div>{record.contract_start_date}</div>
          <div style={{ color: '#999' }}>至 {record.contract_end_date}</div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <Tag color={statusColors[val]}>{statusLabels[val]}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <Card 
      title="项目列表"
      extra={
        <Space>
          <Search
            placeholder="搜索项目/客户"
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => setFilters({ ...filters, keyword: value })}
            onChange={(e) => !e.target.value && setFilters({ ...filters, keyword: '' })}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>
          <Button type="primary">新建项目</Button>
        </Space>
      }
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={projects}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  )
}

export default Projects
