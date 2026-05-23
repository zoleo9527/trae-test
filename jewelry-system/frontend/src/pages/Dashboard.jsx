import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Typography, Space, Timeline } from 'antd';
import { 
  SwapOutlined, 
  UnorderedListOutlined, 
  GiftOutlined, 
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import request from '../utils/request';
import { TRANSFER_STATUS, INVENTORY_STATUS } from '../utils/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewData, activitiesData] = await Promise.all([
        request.get('/dashboard/overview'),
        request.get('/dashboard/recent-activities', { params: { limit: 10 } })
      ]);
      setOverview(overviewData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ marginBottom: 8 }}>数据概览</Title>
          <Text type="secondary">门店运营数据实时统计</Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="调货申请总数"
                value={overview?.transfers?.total || 0}
                prefix={<SwapOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <Space size={8} style={{ marginTop: 8 }} wrap>
                <Tag color={TRANSFER_STATUS.pending.color}>
                  待审批: {overview?.transfers?.pending || 0}
                </Tag>
                <Tag color={TRANSFER_STATUS.shipped.color}>
                  运输中: {overview?.transfers?.shipped || 0}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="盘点记录总数"
                value={overview?.inventory?.total || 0}
                prefix={<UnorderedListOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <Space size={8} style={{ marginTop: 8 }} wrap>
                <Tag color={INVENTORY_STATUS.reviewing.color}>
                  复核中: {overview?.inventory?.reviewing || 0}
                </Tag>
                <Tag color="orange">
                  差异数: {overview?.inventory?.total_differences || 0}
                </Tag>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="在库货品"
                value={overview?.products?.total_products || 0}
                prefix={<GiftOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  总价值: ¥{(overview?.products?.total_value || 0).toLocaleString()}
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card loading={loading}>
              <Statistic
                title="待确认差异"
                value={overview?.pending_dispositions || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">需要及时处理</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card 
              title="调货状态分布" 
              loading={loading}
              extra={<Text type="secondary">本周数据</Text>}
            >
              <Row gutter={[16, 16]}>
                {Object.entries(TRANSFER_STATUS).map(([key, value]) => (
                  <Col span={8} key={key}>
                    <Statistic
                      title={value.label}
                      value={overview?.transfers?.[key] || 0}
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card 
              title="最近操作日志" 
              loading={loading}
              extra={<Text type="secondary">最近10条</Text>}
            >
              <Timeline
                style={{ maxHeight: 300, overflow: 'auto' }}
                items={activities.map(activity => ({
                  color: activity.to_status === 'completed' ? 'green' : 
                         activity.to_status === 'rejected' ? 'red' : 'blue',
                  children: (
                    <div>
                      <Text strong>{activity.action}</Text>
                      <div style={{ fontSize: 12 }}>
                        <Text type="secondary">{activity.operator_name}</Text>
                        {' · '}
                        <Text type="secondary">{dayjs(activity.created_at).format('MM-DD HH:mm')}</Text>
                      </div>
                      {activity.remarks && (
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          <Text type="secondary">{activity.remarks}</Text>
                        </div>
                      )}
                    </div>
                  )
                }))}
              />
            </Card>
          </Col>
        </Row>

        <Card title="处理流程说明" type="inner">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Title level={5}>调货申请流程</Title>
              <List
                dataSource={[
                  { icon: <ClockCircleOutlined />, text: '导购创建调货申请，货品状态变为"已分配"' },
                  { icon: <CheckCircleOutlined />, text: '店长审批（通过/拒绝）' },
                  { icon: <SwapOutlined />, text: '调出门店发货' },
                  { icon: <GiftOutlined />, text: '调入门店收货确认' },
                  { icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />, text: '店长确认完成' }
                ]}
                renderItem={item => (
                  <List.Item>
                    <Space>
                      {item.icon}
                      <span>{item.text}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>
            <Col xs={24} md={12}>
              <Title level={5}>盘点差异处理</Title>
              <List
                dataSource={[
                  { icon: <UnorderedListOutlined />, text: '导购录入盘点结果，标记差异' },
                  { icon: <ClockCircleOutlined />, text: '售后专员复核，创建差异处理' },
                  { icon: <WarningOutlined />, text: '关联调货单/确认责任人/登记赔付' },
                  { icon: <CheckCircleOutlined />, text: '店长确认责任归属' },
                  { icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />, text: '盘点单标记为已处理' }
                ]}
                renderItem={item => (
                  <List.Item>
                    <Space>
                      {item.icon}
                      <span>{item.text}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default Dashboard;
