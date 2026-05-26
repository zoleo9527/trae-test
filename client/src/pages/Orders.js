import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Select, Avatar, Badge, Modal, Form, InputNumber, Input, message } from 'antd';
import { PlusOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderAPI, staffAPI, customerAPI, productAPI } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

const statusLabels = {
  pending_approval: { text: '待审批', color: 'gold' },
  approved: { text: '已审批', color: 'blue' },
  rejected: { text: '已驳回', color: 'red' },
  shipped: { text: '已发货', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
};

const warehouseOptions = ['杭州仓', '福州仓', '昆明仓'];

function Orders() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [orders, setOrders] = useState([]);
  const [staff, setStaff] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [discountRate, setDiscountRate] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    created_by: '',
  });

  useEffect(() => {
    loadStaff();
    loadCustomers();
    loadProducts();
    loadOrders();
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
      message.error('加载订单失败');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const product = products.find(p => p.id === values.product_id);
      await orderAPI.create({
        ...values,
        unit_price: product.unit_price,
      });
      message.success('订单创建成功');
      setModalVisible(false);
      form.resetFields();
      setSelectedProduct(null);
      setQuantity(1);
      setDiscountRate(0);
      loadOrders();
    } catch (error) {
        if (error.errorFields) {
          return;
        }
      console.error('创建订单失败', error);
      message.error(error.response?.data?.error || '创建订单失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductChange = (productId) => {
    setSelectedProduct(products.find(p => p.id === productId));
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    return selectedProduct.unit_price * quantity * (1 - discountRate);
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
    <>
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
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setModalVisible(true)}>新建订单</Button>
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

      <Modal
        title="新建订单"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          setSelectedProduct(null);
          setQuantity(1);
          setDiscountRate(0);
        }}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            quantity: 1,
            discount_rate: 0,
          }}
        >
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
            label="订购产品"
            rules={[{ required: true, message: '请选择产品' }]}
          >
            <Select placeholder="请选择产品" onChange={handleProductChange}>
              {products.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.spec}) - ¥{p.unit_price}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <Form.Item
              name="quantity"
              label="订购数量"
              rules={[{ required: true, message: '请输入数量' }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber
                min={1}
                style={{ width: '100%' }}
                placeholder="数量"
                onChange={setQuantity}
              />
            </Form.Item>
            <Form.Item
              name="discount_rate"
              label="折扣率"
              rules={[{ required: true, message: '请输入折扣率' }]}
              style={{ flex: 1, marginBottom: 0 }}
            >
              <InputNumber
                min={0}
                max={0.99}
                step={0.01}
                style={{ width: '100%' }}
                placeholder="0-0.99"
                onChange={setDiscountRate}
              />
            </Form.Item>
          </div>
          {selectedProduct && (
            <Card size="small" style={{ marginBottom: 24 }}>
              <div>单价: ¥{selectedProduct.unit_price}</div>
              <div>数量: {quantity}</div>
              <div>折扣: {(discountRate * 100).toFixed(0)}%</div>
              <div style={{ fontWeight: 'bold', color: '#fa8c16', marginTop: 8 }}>
                应付金额: ¥{calculateTotal().toFixed(2)}
              </div>
            </Card>
          )}
          <Form.Item
            name="warehouse"
            label="发货仓库"
            rules={[{ required: true, message: '请选择仓库' }]}
          >
            <Select placeholder="请选择发货仓库">
              {warehouseOptions.map(w => (
                <Option key={w} value={w}>{w}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="delivery_address"
            label="配送地址"
            rules={[{ required: true, message: '请输入配送地址' }]}
          >
            <TextArea rows={2} placeholder="请输入配送地址" />
          </Form.Item>
          <Form.Item
            name="created_by"
            label="创建人"
            rules={[{ required: true, message: '请选择创建人' }]}
          >
            <Select placeholder="请选择创建人">
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

export default Orders;
