import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Button, Space, message } from 'antd'
import {
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { notificationsAPI, checkinsAPI, inspectionsAPI, suppliesAPI, renewalsAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

function Dashboard() {
  const [overview, setOverview] = useState({})
  const [missedCheckins, setMissedCheckins] = useState([])
  const [pendingRectifications, setPendingRectifications] = useState([])
  const [lowStockSupplies, setLowStockSupplies] = useState([])
  const [pendingFollowups, setPendingFollowups] = useState([])
  const [supplyRequests, setSupplyRequests] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [
        overviewRes,
        missedRes,
        rectRes,
        suppliesRes,
        followupsRes,
        requestsRes
      ] = await Promise.all([
        notificationsAPI.getOverview(),
        checkinsAPI.getMissedCheckins(7),
        inspectionsAPI.getPendingRectifications(),
        suppliesAPI.getLowStock(),
        renewalsAPI.getPendingFollowups(),
        suppliesAPI.getRequests({ status: 'pending' })
      ])

      setOverview(overviewRes.data)
      setMissedCheckins(missedRes.data)
      setPendingRectifications(rectRes.data)
      setLowStockSupplies(suppliesRes.data)
      setPendingFollowups(followupsRes.data)
      setSupplyRequests(requestsRes.data)
    } catch (err) {
      message.error('加载数据失败')
    }
  }

  const statusColors = {
    missed: 'red',
    pending: 'orange',
    low: 'orange'
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="漏打卡（近7天）"
              value={overview.missedCheckins || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待整改"
              value={overview.pendingRectifications || 0}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="库存预警"
              value={overview.lowStockSupplies || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待续约跟进"
              value={overview.pendingFollowups || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title="漏打卡记录" 
            extra={
              <Button type="link" onClick={() => navigate('/review')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              className="card-scroll"
              dataSource={missedCheckins.slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="red">漏打卡</Tag>
                        {item.project_name}
                      </Space>
                    }
                    description={
                      <div>
                        {item.cleaner_name} · {item.schedule_date} · {item.shift_type === 'day' ? '白班' : '夜班'}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="待整改项目" 
            extra={
              <Button type="link" onClick={() => navigate('/review')}>
                批量处理 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              className="card-scroll"
              dataSource={pendingRectifications.slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="orange">待整改</Tag>
                        {item.project_name}
                      </Space>
                    }
                    description={
                      <div>
                        得分：{item.score}分 · 截止：{item.rectification_deadline}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card 
            title="库存预警" 
            extra={
              <Button type="link" onClick={() => navigate('/review')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              className="card-scroll"
              dataSource={lowStockSupplies.slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<InboxOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                    title={
                      <Space>
                        {item.name}
                        <Tag color="orange">库存不足</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        {item.project_name} · 当前库存：{item.quantity}{item.unit} / 预警值：{item.min_threshold}{item.unit}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card 
            title="续约待跟进" 
            extra={
              <Button type="link" onClick={() => navigate('/renewals')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              className="card-scroll"
              dataSource={pendingFollowups.slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={
                      <Space>
                        {item.project_name}
                        <Tag color="blue">待跟进</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        下次跟进：{item.next_followup_date} · 合同到期：{item.contract_end_date}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
