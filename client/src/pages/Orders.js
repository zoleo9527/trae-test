import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Select, Avatar, Badge } from 'antd';
import { PlusOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderAPI, staffAPI } from '../services/api';

const { Option } = Select;

const statusLabels = {
  pending_approval: { text: '待审批', color: 'gold' },
  approved: { text: '已审批', color: 'blue' },
  rejected: { text: '已驳回', color: 'red' },
  shipped: { text: '已发货', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
};

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    created_by: '',
  });

  useEffect(() => {
    loadStaff();
    loadOrders();
  }, [filters]);

  const loadStaff = async () => {
    const data = await staffAPI.getAll();
    setStaff(data);
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.getAll({
        status: filters.status,
        created_by: filters.created_by,
      });
      setOrders(data);
    } catch (error) {
      console.error('加载订单失败', error);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text, record) => (
        <Space>
          {text}
          {record.exceptions?.length > 0 && (
            <Badge count={record.exceptions?.length} size="small">
              <WarningOutlined style={{ color: '#ff4d4f' }} />
            </Badge>
          )}
        </Space>
      ),
    },
    {
      title: '客户',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{record.customer_name?.[0]}</Avatar>
          <div>
            <div>{record.customer_name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.company}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '产品',
      key: 'product',
      render: (_, record) => (
        <div>
          <div>{record.product_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>x {record.quantity}</div>
        </div>
      ),
    },
    {
      title: '金额',
      key: 'amount',
      render: (_, record) => (
        <div>
          <div style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{record.final_amount?.toFixed(2)}</div>
          {record.discount_rate > 0 && (
            <div style={{ fontSize: 12, color: '#999' }}>
              原价 ¥{record.total_amount?.toFixed(2)} · {(record.discount_rate * 100).toFixed(0)}%折扣
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const info = statusLabels[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/orders/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="订单管理"
      extra={
        <Space wrap>
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
            value={filters.status || undefined}
            onChange={v => setFilters({ ...filters, status: v })}
          >
            <Option value="pending_approval">待审批</Option>
            <Option value="approved">已审批</Option>
            <Option value="rejected">已驳回</Option>
            <Option value="shipped">已发货</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select
            placeholder="创建人"
            style={{ width: 120 }}
            allowClear
            value={filters.created_by || undefined}
            onChange={v => setFilters({ ...filters, created_by: v })}
          >
            {staff.filter(s => s.role === 'sales').map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
          <Button icon={<PlusOutlined />} type="primary">新建订单</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}

export default Orders;
