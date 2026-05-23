import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd';
import { ThunderboltOutlined, ClockCircleOutlined, DollarOutlined, FileTextOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { workOrderApi } from '../services/api';
import { WorkOrder, WorkOrderStatus, WorkOrderStatusLabels, AbnormalTypeLabels } from '../types';

const statusColors: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.ABNORMAL_REPORTED]: 'red',
  [WorkOrderStatus.DOWNTIME_CONFIRMED]: 'orange',
  [WorkOrderStatus.PART_REQUESTED]: 'gold',
  [WorkOrderStatus.PART_APPROVED]: 'cyan',
  [WorkOrderStatus.PART_RECEIVED]: 'blue',
  [WorkOrderStatus.REPAIR_COMPLETED]: 'geekblue',
  [WorkOrderStatus.REVIEW_SUBMITTED]: 'purple',
  [WorkOrderStatus.CLOSED]: 'green',
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        workOrderApi.getStatistics(),
        workOrderApi.getList({ limit: 5 }),
      ]);
      setStatistics(statsRes.data);
      setRecentOrders(ordersRes.data.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '异常类型',
      dataIndex: 'abnormalType',
      key: 'abnormalType',
      width: 120,
      render: (type: string) => AbnormalTypeLabels[type as any] || type,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: WorkOrderStatus) => (
        <Tag color={statusColors[status]}>
          {WorkOrderStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '电站',
      dataIndex: 'station',
      key: 'station',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: WorkOrder) => (
        <Button type="link" onClick={() => navigate(`/work-orders/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="处理中工单"
              value={statistics?.statusCounts?.filter((s: any) => s.status !== WorkOrderStatus.CLOSED).reduce((sum: number, s: any) => sum + parseInt(s.count), 0) || 0}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="近30天停机时长"
              value={Math.round((statistics?.totalDowntimeMinutes || 0) / 60)}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="近30天发电量损失"
              value={statistics?.totalPowerLoss || 0}
              suffix="kWh"
              prefix={<ThunderboltOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已关闭工单"
              value={statistics?.statusCounts?.find((s: any) => s.status === WorkOrderStatus.CLOSED)?.count || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="最新工单"
        extra={
          <Button type="link" onClick={() => navigate('/work-orders')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
