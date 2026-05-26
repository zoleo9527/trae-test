import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Select, Avatar, Rate } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trialAPI, staffAPI } from '../services/api';

const { Option } = Select;

const statusLabels = {
  pending: { text: '待处理', color: 'orange' },
  in_progress: { text: '进行中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
};

function Trials() {
  const navigate = useNavigate();
  const [trials, setTrials] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assigned_staff_id: '',
  });

  useEffect(() => {
    loadStaff();
    loadTrials();
  }, [filters]);

  const loadStaff = async () => {
    const data = await staffAPI.getAll();
    setStaff(data);
  };

  const loadTrials = async () => {
    setLoading(true);
    try {
      const data = await trialAPI.getAll({
        status: filters.status,
        assigned_staff_id: filters.assigned_staff_id,
      });
      setTrials(data);
    } catch (error) {
      console.error('加载试饮记录失败', error);
    }
    setLoading(false);
  };

  const columns = [
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
      title: '试饮产品',
      key: 'product',
      render: (_, record) => (
        <div>
          <div>{record.product_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.category} · {record.spec}</div>
        </div>
      ),
    },
    {
      title: '试饮数量',
      dataIndex: 'trial_quantity',
      key: 'trial_quantity',
      render: q => `${q}份`,
    },
    {
      title: '试饮日期',
      dataIndex: 'trial_date',
      key: 'trial_date',
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction_score',
      key: 'satisfaction_score',
      render: score => score ? <Rate disabled value={score} allowHalf style={{ fontSize: 14 }} /> : '-',
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
      title: '负责业务员',
      dataIndex: 'staff_name',
      key: 'staff_name',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/trials/${record.id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="试饮记录"
      extra={
        <Space wrap>
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
            value={filters.status || undefined}
            onChange={v => setFilters({ ...filters, status: v })}
          >
            <Option value="pending">待处理</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select
            placeholder="负责业务员"
            style={{ width: 120 }}
            allowClear
            value={filters.assigned_staff_id || undefined}
            onChange={v => setFilters({ ...filters, assigned_staff_id: v })}
          >
            {staff.filter(s => s.role === 'sales').map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
          <Button icon={<PlusOutlined />} type="primary">新建试饮</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={trials}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}

export default Trials;
