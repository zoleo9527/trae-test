import { useState, useEffect } from 'react'
import { 
  Card, Descriptions, Tag, Tabs, Table, List, Avatar, 
  Space, Button, Timeline, message, Row, Col, Statistic
} from 'antd'
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CommentOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  projectsAPI, 
  checkinsAPI, 
  inspectionsAPI, 
  suppliesAPI, 
  renewalsAPI,
  statusHistoryAPI 
} from '../services/api'
import dayjs from 'dayjs'

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [inspections, setInspections] = useState([])
  const [supplies, setSupplies] = useState([])
  const [renewals, setRenewals] = useState([])
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        projectRes, 
        checkinsRes, 
        inspectionsRes, 
        suppliesRes, 
        renewalsRes,
        historyRes
      ] = await Promise.all([
        projectsAPI.getProject(id),
        checkinsAPI.getCheckins({ project_id: id }),
        inspectionsAPI.getInspections({ project_id: id }),
        suppliesAPI.getSupplies({ project_id: id }),
        renewalsAPI.getRenewals({ project_id: id }),
        statusHistoryAPI.getHistory({ related_type: 'project', related_id: id })
      ])

      setProject(projectRes.data)
      setCheckins(checkinsRes.data.slice(0, 20))
      setInspections(inspectionsRes.data)
      setSupplies(suppliesRes.data)
      setRenewals(renewalsRes.data)
      setStatusHistory(historyRes.data)
    } catch (err) {
      message.error('加载项目详情失败')
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

  const checkinStatusColors = {
    normal: 'green',
    late: 'orange',
    missed: 'red',
    verified: 'blue'
  }

  const checkinStatusLabels = {
    normal: '正常',
    late: '迟到',
    missed: '漏打卡',
    verified: '已核实'
  }

  const checkinColumns = [
    { title: '日期', dataIndex: 'schedule_date', key: 'schedule_date' },
    { title: '清洁员', dataIndex: 'cleaner_name', key: 'cleaner_name' },
    { title: '班次', dataIndex: 'shift_type', key: 'shift_type', render: v => v === 'day' ? '白班' : '夜班' },
    { title: '打卡时间', key: 'time', render: (_, r) => `${r.checkin_time || '-'} / ${r.checkout_time || '-'}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={checkinStatusColors[v]}>{checkinStatusLabels[v]}</Tag> }
  ]

  const inspectionColumns = [
    { title: '日期', dataIndex: 'inspection_date', key: 'inspection_date' },
    { title: '质检员', dataIndex: 'inspector_name', key: 'inspector_name' },
    { title: '得分', dataIndex: 'score', key: 'score', render: v => <span style={{ color: v < 85 ? '#ff4d4f' : '#52c41a' }}>{v}分</span> },
    { title: '问题', dataIndex: 'issues', key: 'issues', ellipsis: true },
    { title: '整改状态', dataIndex: 'rectification_status', key: 'rect', render: v => v === 'pending' ? <Tag color="orange">待整改</Tag> : v === 'completed' ? <Tag color="green">已完成</Tag> : '-' }
  ]

  const supplyColumns = [
    { title: '耗材名称', dataIndex: 'name', key: 'name' },
    { title: '当前库存', dataIndex: 'quantity', key: 'quantity', render: (v, r) => (
      <span style={{ color: v < r.min_threshold ? '#ff4d4f' : 'inherit' }}>
        {v}{r.unit}
      </span>
    )},
    { title: '预警值', dataIndex: 'min_threshold', key: 'min_threshold', render: (v, r) => `${v}${r.unit}` },
    { title: '状态', key: 'status', render: (_, r) => r.quantity < r.min_threshold ? <Tag color="red">库存不足</Tag> : <Tag color="green">正常</Tag> }
  ]

  const tabItems = [
    {
      key: 'checkins',
      label: '打卡记录',
      children: <Table rowKey="id" columns={checkinColumns} dataSource={checkins} pagination={{ pageSize: 10 }} />
    },
    {
      key: 'inspections',
      label: '质检记录',
      children: <Table rowKey="id" columns={inspectionColumns} dataSource={inspections} pagination={{ pageSize: 10 }} />
    },
    {
      key: 'supplies',
      label: '耗材管理',
      children: <Table rowKey="id" columns={supplyColumns} dataSource={supplies} pagination={false} />
    },
    {
      key: 'renewals',
      label: '续约回访',
      children: (
        <List
          dataSource={renewals}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<CommentOutlined />} />}
                title={
                  <Space>
                    <span>{item.visit_date} 回访</span>
                    <Tag>{item.satisfaction_score}星</Tag>
                    {item.renewal_intention === 'high' && <Tag color="green">续约意向高</Tag>}
                    {item.renewal_intention === 'medium' && <Tag color="orange">续约意向中</Tag>}
                    {item.renewal_intention === 'low' && <Tag color="red">续约意向低</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div>对接人：{item.client_contact}</div>
                    <div>反馈：{item.feedback}</div>
                    {item.next_followup_date && <div style={{ color: '#1890ff' }}>下次跟进：{item.next_followup_date}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: 'history',
      label: '状态变更历史',
      children: (
        <Timeline>
          {statusHistory.map((h, idx) => (
            <Timeline.Item key={idx}>
              <p>
                <Tag>{h.old_status} → {h.new_status}</Tag>
                <span style={{ marginLeft: 8 }}>{h.changer_name}</span>
                <span style={{ color: '#999', marginLeft: 8 }}>
                  {dayjs(h.created_at).format('YYYY-MM-DD HH:mm')}
                </span>
              </p>
              {h.remark && <p style={{ color: '#666' }}>备注：{h.remark}</p>}
            </Timeline.Item>
          ))}
          {statusHistory.length === 0 && <div style={{ color: '#999', padding: 20 }}>暂无变更记录</div>}
        </Timeline>
      )
    }
  ]

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      {project && (
        <>
          <Card title={project.name} style={{ marginBottom: 16 }}>
            <Descriptions column={3}>
              <Descriptions.Item label="客户名称">{project.client_name}</Descriptions.Item>
              <Descriptions.Item label="项目主管">{project.manager_name}</Descriptions.Item>
              <Descriptions.Item label="项目状态">
                <Tag color={statusColors[project.status]}>{statusLabels[project.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="合同金额">¥{project.contract_amount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="合同开始日期">{project.contract_start_date}</Descriptions.Item>
              <Descriptions.Item label="合同结束日期">{project.contract_end_date}</Descriptions.Item>
              <Descriptions.Item label="项目地址" span={3}>{project.address}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic 
                    title="本月打卡异常" 
                    value={checkins.filter(c => c.status !== 'normal').length}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic 
                    title="待整改项" 
                    value={inspections.filter(i => i.rectification_status === 'pending').length}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic 
                    title="库存预警" 
                    value={supplies.filter(s => s.quantity < s.min_threshold).length}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic 
                    title="回访记录" 
                    value={renewals.length}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>

          <Card>
            <Tabs defaultActiveKey="checkins" items={tabItems} />
          </Card>
        </>
      )}
    </div>
  )
}

export default ProjectDetail
