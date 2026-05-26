import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Space, Badge, Avatar } from 'antd';
import { CoffeeOutlined, PhoneOutlined, ShoppingOutlined, UserOutlined, WarningOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, followupAPI, orderAPI } from '../services/api';
import dayjs from 'dayjs';

const statusColors = {
  pending: 'orange',
  in_progress: 'blue',
  completed: 'green',
  pending_approval: 'gold',
  approved: 'blue',
  rejected: 'red',
  shipped: 'cyan',
};

const followupTypeLabels = {
  phone: '电话',
  visit: '拜访',
  wechat: '微信',
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [todayFollowups, setTodayFollowups] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [pendingExceptions, setPendingExceptions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, followupsData, ordersData, exceptionsData] = await Promise.all([
        dashboardAPI.getStats(),
        followupAPI.getAll({ scheduled_date: dayjs().format('YYYY-MM-DD') }),
        orderAPI.getAll({ status: 'pending_approval' }),
        dashboardAPI.getExceptions('pending'),
      ]);
      setStats(statsData);
      setTodayFollowups(followupsData);
      setPendingApprovals(ordersData);
      setPendingExceptions(exceptionsData);
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="试饮记录"
              value={stats.trials?.total || 0}
              prefix={<CoffeeOutlined style={{ color: '#1890ff' }} />}
              suffix={<Tag color={statusColors.pending}>进行中 {stats.trials?.pending || 0}</Tag>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="回访任务"
              value={stats.followups?.total || 0}
              prefix={<PhoneOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <Space>
                  <Tag color={statusColors.pending}>待处理 {stats.followups?.pending || 0}</Tag>
                  <Badge count={stats.followups?.today || 0} showZero style={{ backgroundColor: '#faad14' }}>
                    <span style={{ fontSize: 12 }}>今日</span>
                  </Badge>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={stats.orders?.total || 0}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              suffix={<Tag color="gold">待审批 {stats.orders?.pending_approval || 0}</Tag>}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="客户数"
              value={stats.customers?.total || 0}
              prefix={<UserOutlined style={{ color: '#eb2f96' }} />}
              suffix={
                stats.exceptions?.pending > 0 && (
                  <Tag color="red" icon={<WarningOutlined />}>异常 {stats.exceptions?.pending || 0}</Tag>
                )
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card
            title="今日回访"
            extra={<Button type="link" onClick={() => navigate('/followups')}>全部 <RightOutlined /></Button>}
          >
            {todayFollowups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>今日暂无回访任务</div>
            ) : (
              <List
                dataSource={todayFollowups}
                renderItem={item => (
                  <List.Item
                    actions={[<Tag color={statusColors[item.status]}>{item.status === 'pending' ? '待回访' : '已完成'}</Tag>]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{item.customer_name?.[0]}</Avatar>}
                      title={
                        <Space>
                          <span>{item.customer_name}</span>
                          <Tag size="small">{followupTypeLabels[item.followup_type]}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <span style={{ fontSize: 12 }}>{item.product_name}</span>
                          <span style={{ fontSize: 12, color: '#999' }}>{item.scheduled_time || '全天'}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="待审批订单"
            extra={<Button type="link" onClick={() => navigate('/approvals')}>全部 <RightOutlined /></Button>}
          >
            {pendingApprovals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无待审批订单</div>
            ) : (
              <List
                dataSource={pendingApprovals}
                renderItem={item => (
                  <List.Item onClick={() => navigate(`/orders/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.order_no}</span>
                          <Tag color="gold">待审批</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <span>{item.customer_name} - {item.product_name} x {item.quantity}</span>
                          <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{item.final_amount?.toFixed(2)}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title="待处理异常"
            extra={<Button type="link" onClick={() => navigate('/exceptions')}>全部 <RightOutlined /></Button>}
          >
            {pendingExceptions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无待处理异常</div>
            ) : (
              <List
                dataSource={pendingExceptions}
                renderItem={item => (
                  <List.Item className="exception-card">
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="red">{item.exception_type === 'batch_mix' ? '批次混发' : item.exception_type === 'price_confusion' ? '价格口径' : '其他'}</Tag>
                          <span style={{ fontSize: 12 }}>{item.related_no}</span>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ fontSize: 12, marginBottom: 4 }}>{item.description?.substring(0, 50)}...</div>
                          <span style={{ fontSize: 11, color: '#999' }}>上报人：{item.reporter_name}</span>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
