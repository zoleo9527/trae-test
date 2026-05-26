import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Input, Select, Avatar } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { customerAPI, staffAPI } from '../services/api';

const { Option } = Select;

const levelLabels = {
  vip: { text: 'VIP客户', color: 'gold' },
  regular: { text: '普通客户', color: 'blue' },
  potential: { text: '潜在客户', color: 'default' },
};

function Customers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    level: '',
    assigned_staff_id: '',
  });

  useEffect(() => {
    loadStaff();
    loadCustomers();
  }, []);

  const loadStaff = async () => {
    const data = await staffAPI.getAll();
    setStaff(data);
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await customerAPI.getAll({
        assigned_staff_id: filters.assigned_staff_id,
        level: filters.level,
      });
      setCustomers(data.filter(c => 
        !filters.keyword || 
        c.name.includes(filters.keyword) || 
        c.company?.includes(filters.keyword) ||
        c.phone.includes(filters.keyword)
      ));
    } catch (error) {
      console.error('加载客户失败', error);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{text?.[0]}</Avatar>
          <div>
            <div>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.company}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '客户级别',
      dataIndex: 'level',
      key: 'level',
      render: level => {
        const info = levelLabels[level] || { text: level, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '负责业务员',
      dataIndex: 'assigned_staff_id',
      key: 'assigned_staff_id',
      render: id => {
        const s = staff.find(item => item.id === id);
        return s?.name || '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/customers/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="客户管理"
      extra={
        <Space wrap>
          <Input
            placeholder="搜索客户名称/公司/电话"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={loadCustomers}
          />
          <Select
            placeholder="客户级别"
            style={{ width: 120 }}
            allowClear
            value={filters.level || undefined}
            onChange={v => setFilters({ ...filters, level: v })}
          >
            <Option value="vip">VIP客户</Option>
            <Option value="regular">普通客户</Option>
            <Option value="potential">潜在客户</Option>
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
          <Button icon={<PlusOutlined />} type="primary">新建客户</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}

export default Customers;
