import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Descriptions, Card, Button, Space, Tag, Timeline, Form, 
  Modal, Select, Input, App as AntApp, Typography, 
  Row, Col, Statistic, Divider, Empty, Steps
} from 'antd'
import { 
  ArrowLeftOutlined, EditOutlined, HistoryOutlined,
  PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  RedoOutlined, SendOutlined, InboxOutlined, CloudServerOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { filmApi, processApi } from '@/services/api'
import { 
  FILM_STATUS_OPTIONS, PROCESS_ACTION_OPTIONS, HANDLER_OPTIONS,
  getStatusLabel, getStatusColor
} from '@/constants'
import { useDataRefresh } from '@/contexts/DataContext'
import type { Film, ProcessRecord, ProcessAction, FilmStatus } from '@/types'

const { Title, Text } = Typography

const statusFlow: FilmStatus[] = [
  'registered',
  'waiting_process',
  'processing',
  'waiting_delivery',
  'delivered'
]

const actionIcons: Record<ProcessAction, any> = {
  register: InboxOutlined,
  start_process: PlayCircleOutlined,
  reject: CloseCircleOutlined,
  rework: RedoOutlined,
  finish_process: CheckCircleOutlined,
  ready_delivery: SendOutlined,
  deliver: CheckCircleOutlined,
  store: CloudServerOutlined,
}

export default function FilmDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [film, setFilm] = useState<(Film & { processRecords: ProcessRecord[] }) | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [selectedAction, setSelectedAction] = useState<ProcessAction | null>(null)
  const [form] = Form.useForm()
  const { message } = AntApp.useApp()
  const { refreshVersion } = useDataRefresh()

  const loadFilmDetail = useCallback(async (filmId: number) => {
    setLoading(true)
    try {
      const data = await filmApi.getOne(filmId)
      setFilm(data)
    } catch (e: any) {
      message.error('加载详情失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    if (id) {
      loadFilmDetail(parseInt(id))
    }
  }, [id, loadFilmDetail, refreshVersion])

  const getAvailableActions = (): ProcessAction[] => {
    if (!film) return []
    const status = film.status
    const actions: ProcessAction[] = []
    
    switch (status) {
      case 'registered':
        actions.push('start_process', 'store')
        break
      case 'waiting_process':
        actions.push('start_process', 'store')
        break
      case 'processing':
        actions.push('finish_process', 'reject')
        break
      case 'rework':
        actions.push('rework')
        break
      case 'waiting_delivery':
        actions.push('deliver', 'store')
        break
      case 'stored':
        actions.push('deliver')
        break
      default:
        break
    }
    
    return actions
  }

  const handleActionClick = (action: ProcessAction) => {
    setSelectedAction(action)
    form.resetFields()
    const option = PROCESS_ACTION_OPTIONS.find(o => o.value === action)
    form.setFieldsValue({
      action,
      newStatus: option?.nextStatus,
      operator: film?.currentHandler || undefined
    })
    setActionModalVisible(true)
  }

  const handleActionSubmit = async () => {
    if (!film || !selectedAction) return
    
    try {
      const values = await form.validateFields()
      const option = PROCESS_ACTION_OPTIONS.find(o => o.value === selectedAction)
      
      await processApi.create({
        filmId: film.id,
        filmNo: film.filmNo,
        memberId: film.memberId,
        memberName: film.memberName,
        action: selectedAction,
        previousStatus: film.status,
        newStatus: option?.nextStatus || film.status,
        operator: values.operator,
        remark: values.remark
      })
      
      message.success('操作成功')
      setActionModalVisible(false)
      loadFilmDetail(film.id)
    } catch (e: any) {
      message.error('操作失败: ' + e.message)
    }
  }

  const getCurrentStep = () => {
    if (!film) return 0
    const idx = statusFlow.indexOf(film.status)
    if (film.status === 'rework') return 2
    if (film.status === 'stored') return 4
    return idx >= 0 ? idx : 0
  }

  if (!film) {
    return <Empty description="加载中..." />
  }

  const availableActions = getAvailableActions()

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/films')}>
            返回列表
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            胶卷详情 - {film.filmNo}
            <Tag 
              color={getStatusColor(film.status)} 
              style={{ marginLeft: 12 }}
            >
              {getStatusLabel(film.status)}
            </Tag>
            {film.isUrgent && <Tag color="error">加急</Tag>}
            {film.reworkCount > 0 && <Tag color="warning">返工 {film.reworkCount} 次</Tag>}
          </Title>
        </Space>

        <Card loading={loading}>
          <Title level={5}>处理进度</Title>
          <Steps 
            current={getCurrentStep()} 
            items={[
              { title: '已登记', description: film.createdAt },
              { title: '待冲扫', description: '等待分配' },
              { title: '冲扫中', description: film.currentHandler ? `处理人: ${film.currentHandler}` : '未分配' },
              { title: '待交付', description: '等待客户取件' },
              { title: '已完成', description: film.status === 'delivered' ? film.updatedAt : '' },
            ]}
            style={{ marginBottom: 24 }}
          />

          <Divider />

          <Title level={5}>基本信息</Title>
          <Row gutter={16}>
            <Col xs={12} sm={8} md={6}>
              <Statistic title="会员" value={film.memberName} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic title="胶卷品牌" value={`${film.filmBrand} ${film.filmType}`} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic title="ISO/格式" value={`${film.iso} / ${film.format}`} />
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Statistic title="张数" value={film.shots} />
            </Col>
          </Row>

          <Divider />

          <Title level={5}>冲扫信息</Title>
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="冲扫工艺">{film.processType}</Descriptions.Item>
            <Descriptions.Item label="扫描分辨率">{film.scanResolution}</Descriptions.Item>
            <Descriptions.Item label="交付版本">
              {film.deliveryVersion === 'standard' ? '标准版' : 
               film.deliveryVersion === 'high' ? '高清版' : 'RAW原片'}
            </Descriptions.Item>
            <Descriptions.Item label="当前处理人">{film.currentHandler || '-'}</Descriptions.Item>
            <Descriptions.Item label="驳回原因">{film.rejectReason || '-'}</Descriptions.Item>
            <Descriptions.Item label="返工次数">{film.reworkCount} 次</Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={5}>寄存信息</Title>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="寄存开始日期">
              <Tag color="blue">{film.storageStartDate}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="到期日期">
              {(() => {
                const diff = dayjs(film.storageEndDate).diff(dayjs(), 'day')
                let color = 'default'
                if (diff <= 0) color = 'error'
                else if (diff <= 7) color = 'warning'
                return (
                  <Tag color={color}>
                    {film.storageEndDate} ({diff <= 0 ? '已过期' : `还剩${diff}天`})
                  </Tag>
                )
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{film.remark || '-'}</Descriptions.Item>
          </Descriptions>

          <Divider />

          <Title level={5}>状态操作</Title>
          {availableActions.length > 0 ? (
            <Space wrap>
              {availableActions.map(action => {
                const option = PROCESS_ACTION_OPTIONS.find(o => o.value === action)
                const Icon = actionIcons[action]
                return (
                  <Button 
                    key={action}
                    type={action === 'reject' ? 'default' : action === 'deliver' ? 'primary' : 'default'}
                    danger={action === 'reject'}
                    icon={Icon ? <Icon /> : null}
                    onClick={() => handleActionClick(action)}
                  >
                    {option?.label}
                  </Button>
                )
              })}
            </Space>
          ) : (
            <Text type="secondary">该状态下无可用操作</Text>
          )}
        </Card>

        <Card 
          title={
            <Space>
              <HistoryOutlined />
              <span>处理记录</span>
            </Space>
          }
          loading={loading}
        >
          {film.processRecords && film.processRecords.length > 0 ? (
            <Timeline
              items={film.processRecords.map(record => {
                const Icon = actionIcons[record.action]
                return {
                  color: record.action === 'reject' || record.action === 'rework' ? 'red' : 
                         record.action === 'deliver' || record.action === 'finish_process' ? 'green' : 'blue',
                  dot: Icon ? <Icon style={{ fontSize: 16 }} /> : undefined,
                  children: (
                    <Card size="small" style={{ marginBottom: 8 }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Space>
                          <Tag color={getStatusColor(record.previousStatus)}>
                            {getStatusLabel(record.previousStatus)}
                          </Tag>
                          <Text type="secondary">→</Text>
                          <Tag color={getStatusColor(record.newStatus)}>
                            {getStatusLabel(record.newStatus)}
                          </Tag>
                          <Text type="secondary">操作人: {record.operator}</Text>
                        </Space>
                        <Text type="secondary">{record.timestamp}</Text>
                        {record.remark && <p style={{ margin: 0 }}>{record.remark}</p>}
                      </Space>
                    </Card>
                  )
                }
              })}
            />
          ) : (
            <Empty description="暂无处理记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </Space>

      <Modal
        title={selectedAction ? PROCESS_ACTION_OPTIONS.find(o => o.value === selectedAction)?.label : '状态操作'}
        open={actionModalVisible}
        onOk={handleActionSubmit}
        onCancel={() => setActionModalVisible(false)}
        okText="确认操作"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="action" label="操作" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="newStatus" label="新状态" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="operator"
            label="操作人"
            rules={[{ required: true, message: '请选择操作人' }]}
          >
            <Select 
              placeholder="请选择操作人"
              options={HANDLER_OPTIONS}
            />
          </Form.Item>
          {(selectedAction === 'reject' || selectedAction === 'rework') && (
            <Form.Item
              name="remark"
              label={selectedAction === 'reject' ? '驳回原因' : '返工说明'}
              rules={[{ required: true, message: '请填写原因' }]}
            >
              <Input.TextArea 
                rows={3} 
                placeholder={selectedAction === 'reject' ? '请详细描述驳回原因' : '请描述返工要求'}
              />
            </Form.Item>
          )}
          {selectedAction !== 'reject' && selectedAction !== 'rework' && (
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={3} placeholder="选填" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
