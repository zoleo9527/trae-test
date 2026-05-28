import { useState, useEffect } from 'react'
import { 
  Table, Button, Space, Input, Form, Modal, Select, Tag, 
  Popconfirm, App as AntApp, Typography, Row, Col, Statistic, Card
} from 'antd'
import { 
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
  UserOutlined, FilmOutlined, HistoryOutlined
} from '@ant-design/icons'
import { memberApi, filmApi } from '@/services/api'
import { 
  MEMBER_LEVEL_OPTIONS, getMemberLevelLabel, getMemberLevelColor 
} from '@/constants'
import { useDataRefresh } from '@/contexts/DataContext'
import type { Member } from '@/types'

const { Title } = Typography

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [form] = Form.useForm()
  const { message, modal } = AntApp.useApp()
  const { refreshVersion } = useDataRefresh()

  useEffect(() => {
    loadMembers()
  }, [pagination.current, pagination.pageSize, searchText, refreshVersion])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const result = await memberApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchText || undefined
      })
      setMembers(result.data)
      setPagination(p => ({ ...p, total: result.total }))
    } catch (e: any) {
      message.error('加载会员列表失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingMember(null)
    form.resetFields()
    form.setFieldsValue({ memberLevel: 'normal', storageMonths: 3 })
    setModalVisible(true)
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    form.setFieldsValue(member)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await memberApi.delete(id)
      message.success('删除成功')
      loadMembers()
    } catch (e: any) {
      message.error('删除失败: ' + e.message)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingMember) {
        await memberApi.update(editingMember.id, values)
        message.success('更新成功')
      } else {
        await memberApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadMembers()
    } catch (e: any) {
      message.error('操作失败: ' + e.message)
    }
  }

  const handleLevelChange = (level: string) => {
    const option = MEMBER_LEVEL_OPTIONS.find(o => o.value === level)
    if (option) {
      form.setFieldsValue({ storageMonths: option.months })
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '会员姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      )
    },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '微信号', dataIndex: 'wechatId', key: 'wechatId', render: (t: string) => t || '-' },
    {
      title: '会员等级',
      dataIndex: 'memberLevel',
      key: 'memberLevel',
      render: (level: string) => (
        <Tag color={getMemberLevelColor(level)}>
          {getMemberLevelLabel(level)}
        </Tag>
      )
    },
    { title: '寄存期限(月)', dataIndex: 'storageMonths', key: 'storageMonths', width: 120 },
    { 
      title: '总胶卷数', 
      dataIndex: 'totalFilms', 
      key: 'totalFilms',
      width: 100,
      render: (t: number) => <Tag color="blue">{t}</Tag>
    },
    { 
      title: '进行中', 
      dataIndex: 'activeFilms', 
      key: 'activeFilms',
      width: 100,
      render: (t: number) => <Tag color="green">{t}</Tag>
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: (t: string) => t || '-' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: Member) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该会员？"
            description="删除后数据将无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic 
                title="会员总数" 
                value={pagination.total} 
                prefix={<UserOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic 
                title="总胶卷数" 
                value={members.reduce((sum, m) => sum + m.totalFilms, 0)} 
                prefix={<FilmOutlined />} 
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card size="small">
              <Statistic 
                title="进行中胶卷" 
                value={members.reduce((sum, m) => sum + m.activeFilms, 0)} 
                prefix={<HistoryOutlined />} 
              />
            </Card>
          </Col>
        </Row>

        <Card 
          title={<Title level={4} style={{ margin: 0 }}>会员管理</Title>}
          extra={
            <Space>
              <Input
                placeholder="搜索姓名/手机号/微信号"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增会员
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={members}
            columns={columns}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
            }}
          />
        </Card>
      </Space>

      <Modal
        title={editingMember ? '编辑会员' : '新增会员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="会员姓名"
            rules={[{ required: true, message: '请输入会员姓名' }]}
          >
            <Input placeholder="请输入会员姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号码"
            rules={[
              { required: true, message: '请输入手机号码' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' }
            ]}
          >
            <Input placeholder="请输入手机号码" />
          </Form.Item>
          <Form.Item name="wechatId" label="微信号">
            <Input placeholder="请输入微信号" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="memberLevel"
                label="会员等级"
                rules={[{ required: true, message: '请选择会员等级' }]}
              >
                <Select 
                  options={MEMBER_LEVEL_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                  onChange={handleLevelChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="storageMonths"
                label="寄存期限(月)"
                rules={[{ required: true, message: '请输入寄存期限' }]}
              >
                <Input type="number" min="1" max="120" placeholder="月" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
