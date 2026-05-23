import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button, Select, Alert, List, Badge, Typography } from 'antd';
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  UserOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { workOrderApi } from '../services/api';
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderStatusLabels,
  AbnormalTypeLabels,
  UserRole,
  RoleLabels,
} from '../types/index';
import { useRole } from '../contexts/RoleContext';

const { Text } = Typography;
const { Option } = Select;

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
  const { currentRole, setCurrentRole, roleTodoStatuses, getActionLabel } = useRole();
  const [statistics, setStatistics] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentRole]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        workOrderApi.getStatistics(),
        workOrderApi.getList({ limit: 100 }),
      ]);
      setStatistics(statsRes.data);
      setAllOrders(ordersRes.data.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const todoOrders = useMemo(() => {
    return allOrders.filter((order) => roleTodoStatuses.includes(order.status));
  }, [allOrders, roleTodoStatuses]);

  const groupedTodoOrders = useMemo(() => {
    const grouped: Record<string, WorkOrder[]> = {};
    roleTodoStatuses.forEach((status) => {
      grouped[status] = todoOrders.filter((o) => o.status === status);
    });
    return grouped;
  }, [todoOrders, roleTodoStatuses]);

  const totalTodoDowntime = useMemo(() => {
    return todoOrders.reduce((sum, o) => sum + (o.totalDowntimeMinutes || 0), 0);
  }, [todoOrders]);

  const pendingPartApprovalCount = useMemo(() => {
    return allOrders.filter((o) => o.status === WorkOrderStatus.PART_REQUESTED).length;
  }, [allOrders]);

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
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: WorkOrderStatus) => (
        <Tag color={statusColors[status]}>
          {WorkOrderStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '待办动作',
      key: 'action',
      width: 120,
      render: (_: any, record: WorkOrder) => (
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => navigate(`/work-orders/${record.id}`)}
        >
          {getActionLabel(record.status)}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <Text strong style={{ fontSize: 16 }}>当前视角：</Text>
          <Select
            value={currentRole}
            onChange={(value) => setCurrentRole(value)}
            style={{ width: 160 }}
          >
            <Option value={UserRole.STATION_MASTER}>{RoleLabels[UserRole.STATION_MASTER]}</Option>
            <Option value={UserRole.INSPECTION_ENGINEER}>{RoleLabels[UserRole.INSPECTION_ENGINEER]}</Option>
            <Option value={UserRole.OPERATION_STAFF}>{RoleLabels[UserRole.OPERATION_STAFF]}</Option>
            <Option value={UserRole.ADMIN}>{RoleLabels[UserRole.ADMIN]}</Option>
          </Select>
        </Space>
        <Alert
          message={
            <Space>
              <ExclamationCircleOutlined />
              当前视角有 <Text strong type="danger">{todoOrders.length}</Text> 项待办工单
            </Space>
          }
          type="info"
          showIcon
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="我的待办工单"
              value={todoOrders.length}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待办累计停机时长"
              value={Math.round(totalTodoDowntime / 60)}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待审批备件申请"
              value={pendingPartApprovalCount}
              prefix={<DollarOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已关闭工单"
              value={statistics?.statusCounts?.find((s: any) => s.status === WorkOrderStatus.CLOSED)?.count || 0}
              prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {roleTodoStatuses.map((status) => {
        const orders = groupedTodoOrders[status] || [];
        if (orders.length === 0) return null;

        return (
          <Card
            key={status}
            title={
              <Space>
                <Badge count={orders.length} />
                <Tag color={statusColors[status]}>{WorkOrderStatusLabels[status]}</Tag>
                <Text type="secondary">- {getActionLabel(status)}</Text>
              </Space>
            }
            style={{ marginBottom: 16 }}
            extra={
              <Button type="link" onClick={() => navigate(`/work-orders?status=${status}`)}>
                查看全部 <ArrowRightOutlined />
              </Button>
            }
          >
            <List
              grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
              dataSource={orders.slice(0, 6)}
              renderItem={(order) => (
                <List.Item>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => navigate(`/work-orders/${order.id}`)}
                    actions={[
                      <Button type="primary" size="small" block>
                        {getActionLabel(order.status)}
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={order.orderNo}
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>{order.title}</div>
                          <Space direction="vertical" size="small">
                            <Tag size="small">{AbnormalTypeLabels[order.abnormalType]}</Tag>
                            {order.totalDowntimeMinutes && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <ClockCircleOutlined /> {order.totalDowntimeMinutes} 分钟
                              </Text>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        );
      })}

      <Card
        title="全部工单"
        extra={
          <Button type="link" onClick={() => navigate('/work-orders')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={allOrders.slice(0, 8)}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
