import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Select, Avatar, Rate, Modal, Form, InputNumber, DatePicker, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { trialAPI, staffAPI, customerAPI, productAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const statusLabels = {
  pending: { text: '待处理', color: 'orange' },
  in_progress: { text: '进行中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
};

function Trials() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [trials, setTrials] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assigned_staff_id: '',
  });

  useEffect(() => {
    loadStaff();
    loadCustomers();
    loadProducts();
    loadTrials();
  }, [filters]);

  const loadStaff = async () => {
    const data = await staffAPI.getAll();
    setStaff(data);
  };

  const loadCustomers = async () => {
    const data = await customerAPI.getAll();
    setCustomers(data);
  };

  const loadProducts = async () => {
    const data = await productAPI.getAll();
    setProducts(data);
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
      message.error('加载试饮记录失败');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await trialAPI.create({
        ...values,
        trial_date: values.trial_date.format('YYYY-MM-DD'),
      });
      message.success('试饮记录创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTrials();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      console.error('创建试饮记录失败', error);
      message.error(error.response?.data?.error || '创建试饮记录失败');
    } finally {
      setSubmitting(false);
    }
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
    <>
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
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setModalVisible(true)}>新建试饮</Button>
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

      <Modal
        title="新建试饮记录"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customer_id"
            label="选择客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="请选择客户" showSearch optionFilterProp="children">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} - {c.company}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="product_id"
            label="试饮产品"
            rules={[{ required: true, message: '请选择试饮产品' }]}
          >
            <Select placeholder="请选择试饮产品">
              {products.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.spec})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="trial_quantity"
            label="试饮数量"
            rules={[{ required: true, message: '请输入试饮数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入试饮数量" />
          </Form.Item>
          <Form.Item
            name="trial_date"
            label="试饮日期"
            rules={[{ required: true, message: '请选择试饮日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择试饮日期" />
          </Form.Item>
          <Form.Item
            name="assigned_staff_id"
            label="负责业务员"
            rules={[{ required: true, message: '请选择负责业务员' }]}
          >
            <Select placeholder="请选择负责业务员">
              {staff.filter(s => s.role === 'sales').map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Trials;
