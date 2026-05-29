import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Progress, Spin, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api';

const statusColorMap = {
  '待确认': '#1677ff',
  '已确认': '#13c2c2',
  '起苗中': '#fa8c16',
  '已完成': '#52c41a',
  '异常': '#f5222d',
};

const severityColorMap = {
  '一般': '#1677ff',
  '严重': '#fa8c16',
  '紧急': '#f5222d',
};

const typeRouteMap = {
  '排单': '/orders',
  '装车': '/loading',
  '异常': '/exceptions',
};

const typeColorMap = {
  '排单': 'blue',
  '装车': 'green',
  '异常': 'red',
};

const pendingStatusColorMap = {
  '待处理': 'error',
  '处理中': 'warning',
  '待确认': 'default',
  '已确认': 'processing',
  '起苗中': 'warning',
  '待装车': 'default',
  '装车中': 'warning',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchPendingActions = async () => {
    try {
      const res = await api.get('/dashboard/pending-actions');
      setPendingActions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendingActions();
  }, []);

  if (loading || !stats) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="地块总数" value={stats.total_plots} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="排单总数" value={stats.total_orders} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="装车记录数" value={stats.total_loading} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Statistic title="异常记录数" value={stats.total_exceptions} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="排单状态分布">
            {stats.orders_by_status && Object.entries(stats.orders_by_status).map(([status, count]) => {
              const total = stats.total_orders || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <Row key={status} align="middle" style={{ marginBottom: 12 }}>
                  <Col span={6}>
                    <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>
                  </Col>
                  <Col span={14}>
                    <Progress
                      percent={percent}
                      size="small"
                      strokeColor={statusColorMap[status]}
                      format={() => `${count} 单`}
                    />
                  </Col>
                </Row>
              );
            })}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="异常严重程度分布">
            {stats.exceptions_by_severity && Object.entries(stats.exceptions_by_severity).map(([severity, count]) => {
              const total = stats.total_exceptions || 1;
              const percent = Math.round((count / total) * 100);
              return (
                <Row key={severity} align="middle" style={{ marginBottom: 12 }}>
                  <Col span={6}>
                    <Tag color={severityColorMap[severity] || 'default'}>{severity}</Tag>
                  </Col>
                  <Col span={14}>
                    <Progress
                      percent={percent}
                      size="small"
                      strokeColor={severityColorMap[severity]}
                      format={() => `${count} 条`}
                    />
                  </Col>
                </Row>
              );
            })}
          </Card>
        </Col>
      </Row>

      <Card title="待办事项">
        <List
          dataSource={pendingActions}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '8px 0' }}
              onClick={() => navigate(typeRouteMap[item.type] || '/')}
            >
              <List.Item.Meta
                avatar={<Tag color={typeColorMap[item.type]}>{item.type}</Tag>}
                title={item.title}
                description={
                  <Space>
                    <Tag color={pendingStatusColorMap[item.status] || 'default'}>{item.status}</Tag>
                    {item.created_at && <span style={{ color: '#999' }}>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
