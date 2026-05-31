import { useState, useEffect } from 'react'
import { 
  Card, Table, Tag, Button, Space, Modal, Form, Input, 
  Select, DatePicker, Rate, message, Row, Col, Statistic
} from 'antd'
import { PlusOutlined, CheckCircleOutlined, CommentOutlined } from '@ant-design/icons'
import { renewalsAPI, projectsAPI } from '../services/api'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

function Renewals() {
  const [renewals, setRenewals] = useState([])
  const [projects, setProjects] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [renewalsRes, projectsRes] = await Promise.all([
        renewalsAPI.getRenewals(),
        projectsAPI.getProjects({ status: 'expiring' })
      ])
      setRenewals(renewalsRes.data)
      setProjects(projectsRes.data)
    } catch (err) {
      message.error('加载数据失败')
    }
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      await renewalsAPI.createRenewal({
        ...values,
        visit_date: values.visit_date.format('YYYY-MM-DD'),
        next_followup_date: values.next_followup_date?.format('YYYY-MM-DD'),
        status: values.next_followup_date ? 'followup' : 'completed'
      })
      message.success('回访记录创建成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (err) {
      message.error('创建失败')
    } finally {
      setLoading(false)
    }
  }

  const intentionColors = { high: 'green', medium: 'orange', low: 'red' }
  const intentionLabels = { high: '高', medium: '中', low: '低' }

  const statusColors = { pending: 'default', followup: 'blue', completed: 'green' }
  const statusLabels = { pending: '待回访', followup: '待跟进', completed: '已完成' }

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name'
    },
    {
      title: '回访日期',
      dataIndex: 'visit_date',
      key: 'visit_date'
    },
    {
      title: '客户对接人',
      dataIndex: 'client_contact',
      key: 'client_contact'
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction_score',
      key: 'satisfaction_score',
      render: (val) => <Rate disabled value={val} />
    },
    {
      title: '续约意向',
      dataIndex: 'renewal_intention',
      key: 'renewal_intention',
      render: (val) => val && <Tag color={intentionColors[val]}>{intentionLabels[val]}</Tag>
    },
    {
      title: '下次跟进',
      dataIndex: 'next_followup_date',
      key: 'next_followup_date',
      render: (val) => val || '-'
    },
    {
      title: '合同到期',
      dataIndex: 'contract_end_date',
      key: 'contract_end_date'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) => <Tag color={statusColors[val]}>{statusLabels[val]}</Tag>
    }
  ]

  const pendingCount = renewals.filter(r => r.status === 'followup').length

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待跟进回访" 
              value={pendingCount}
              prefix={<CommentOutlined style={{ color: '#1890ff' }} />
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="总回访记录" 
              value={renewals.length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="续约意向高" 
              value={renewals.filter(r => r.renewal_intention === 'high').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="续约意向低" 
              value={renewals.filter(r => r.renewal_intention === 'low').length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="续约回访记录"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新增回访记录
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={renewals}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增回访记录"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="project_id" label="选择项目" rules={[{ required: true }]}>
            <Select placeholder="请选择项目">
              {projects.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name} - {p.client_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="visit_date" label="回访日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="client_contact" label="客户对接人" rules={[{ required: true }]}>
            <Input placeholder="请输入对接人姓名" />
          </Form.Item>
          <Form.Item name="satisfaction_score" label="满意度评分" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="renewal_intention" label="续约意向" rules={[{ required: true }]}>
            <Select>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
          </Form.Item>
          <Form.Item name="feedback" label="客户反馈">
            <TextArea rows={3} placeholder="请输入客户反馈内容" />
          </Form.Item>
          <Form.Item name="next_followup_date" label="下次跟进日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Renewals
