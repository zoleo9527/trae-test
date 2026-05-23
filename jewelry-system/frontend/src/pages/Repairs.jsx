import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, message, Card, Typography, Descriptions, Steps, Timeline,
  InputNumber, Input, Select, Row, Col, Statistic
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { REPAIR_STATUS, REPAIR_TYPE, PRODUCT_STATUS } from '../utils/constants';
import useAuthStore from '../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Repairs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadData();
    loadProducts();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await request.get('/repairs');
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to load repairs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const result = await request.get('/products', { params: { storeId: user.store_id } });
      setProducts(result.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const canCreateRepair = ['sales_associate', 'store_manager', 'after_sales'].includes(user.role);
  const canHandleRepair = () => ['after_sales', 'store_manager'].includes(user.role);

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await request.post('/repairs', values);
      message.success('返修单创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to create repair:', error);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await request.get(`/repairs/${record.id}`);
      setSelectedRepair(detail);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to load repair detail:', error);
    }
  };

  const handleStart = async (id) => {
    try {
      await request.post(`/repairs/${id}/start`);
      message.success('已开始处理');
      loadData();
      if (selectedRepair) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  const handleComplete = async (values) => {
    try {
      await request.post(`/repairs/${selectedRepair.id}/complete`, values);
      message.success('返修已完成');
      setCompleteModalVisible(false);
      loadData();
      if (selectedRepair) {
        handleViewDetail({ id: selectedRepair.id });
      }
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  const handlePickup = async (id) => {
    try {
      await request.post(`/repairs/${id}/pickup`);
      message.success('客户已取货');
      loadData();
      if (selectedRepair) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to pickup:', error);
    }
  };

  const columns = [
    {
      title: '返修单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '货品',
      dataIndex: 'product_name',
      key: 'product_name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.sku}</div>
        </div>
      )
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 120
    },
    {
      title: '返修类型',
      dataIndex: 'repair_type',
      key: 'repair_type',
      width: 120,
      render: (type) => REPAIR_TYPE[type] || type
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: 100
    },
    {
      title: '收单人',
      dataIndex: 'received_by_name',
      key: 'received_by_name',
      width: 100
    },
    {
      title: '费用',
      dataIndex: 'agreed_price',
      key: 'agreed_price',
      width: 100,
      render: (val) => `¥${val || 0}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = REPAIR_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {canHandleRepair() && record.status === 'received' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleStart(record.id)}>
              开始处理
            </Button>
          )}
          {canHandleRepair() && record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setSelectedRepair(record); completeForm.resetFields(); setCompleteModalVisible(true); }}>
              完成
            </Button>
          )}
          {canHandleRepair() && record.status === 'completed' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handlePickup(record.id)}>
              取货
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>返修管理</Title>
            <Text type="secondary">货品返修登记与处理跟踪</Text>
          </div>
          {canCreateRepair && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建返修单
            </Button>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="新建返修单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="product_id"
            label="返修货品"
            rules={[{ required: true, message: '请选择货品' }]}
          >
            <Select placeholder="请选择货品" showSearch>
              {products.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {PRODUCT_STATUS[p.status]?.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="repair_type"
            label="返修类型"
            rules={[{ required: true, message: '请选择返修类型' }]}
          >
            <Select placeholder="请选择">
              {Object.entries(REPAIR_TYPE).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer_name"
                label="客户姓名"
              >
                <Input placeholder="请输入客户姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customer_phone"
                label="联系电话"
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="agreed_price"
            label="约定费用（元）"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="description"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={3} placeholder="请详细描述返修问题" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成返修"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
          <Form.Item
            name="repair_result"
            label="返修结果"
            rules={[{ required: true, message: '请输入返修结果' }]}
          >
            <TextArea rows={3} placeholder="请描述返修结果" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCompleteModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认完成</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="返修详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          selectedRepair && canHandleRepair() && selectedRepair.status === 'received' && (
            <Button key="start" type="primary" onClick={() => handleStart(selectedRepair.id)}>
              开始处理
            </Button>
          ),
          selectedRepair && canHandleRepair() && selectedRepair.status === 'in_progress' && (
            <Button key="complete" type="primary" onClick={() => { completeForm.resetFields(); setCompleteModalVisible(true); }}>
              完成返修
            </Button>
          ),
          selectedRepair && canHandleRepair() && selectedRepair.status === 'completed' && (
            <Button key="pickup" type="primary" onClick={() => handlePickup(selectedRepair.id)}>
              客户取货
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ].filter(Boolean)}
        width={800}
      >
        {selectedRepair && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="返修单号" value={selectedRepair.order_no} />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="状态" 
                    value={REPAIR_STATUS[selectedRepair.status]?.label}
                    valueStyle={{ color: REPAIR_STATUS[selectedRepair.status]?.color }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic title="门店" value={selectedRepair.store_name} />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="费用" 
                    value={selectedRepair.agreed_price || 0}
                    prefix="¥"
                  />
                </Col>
              </Row>
            </Card>

            <Card title="货品信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="货品名称">{selectedRepair.product_name}</Descriptions.Item>
                <Descriptions.Item label="SKU">{selectedRepair.sku}</Descriptions.Item>
                <Descriptions.Item label="品类">{selectedRepair.category}</Descriptions.Item>
                <Descriptions.Item label="零售价">¥{selectedRepair.retail_price}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="返修信息" size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="返修类型">{REPAIR_TYPE[selectedRepair.repair_type]}</Descriptions.Item>
                <Descriptions.Item label="客户">{selectedRepair.customer_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{selectedRepair.customer_phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="收单人">{selectedRepair.received_by_name}</Descriptions.Item>
                {selectedRepair.picked_up_by_name && (
                  <Descriptions.Item label="取货人">{selectedRepair.picked_up_by_name}</Descriptions.Item>
                )}
                <Descriptions.Item label="约定费用">¥{selectedRepair.agreed_price || 0}</Descriptions.Item>
              </Descriptions>
              {selectedRepair.description && (
                <div style={{ marginTop: 8 }}>
                  <Text strong>问题描述：</Text>
                  <Text style={{ marginLeft: 8 }}>{selectedRepair.description}</Text>
                </div>
              )}
            </Card>

            <Card title="处理流程" size="small">
              <Steps
                direction="vertical"
                current={
                  selectedRepair.status === 'received' ? 0 :
                  selectedRepair.status === 'in_progress' ? 1 :
                  selectedRepair.status === 'completed' ? 2 :
                  selectedRepair.status === 'picked_up' ? 3 : 0
                }
              >
                <Steps.Step title="收单登记" description={`${selectedRepair.received_by_name} - ${dayjs(selectedRepair.created_at).format('MM-DD HH:mm')}`} status="finish" />
                <Steps.Step title="开始处理" description={selectedRepair.status !== 'received' ? '已开始' : '待处理'} status={['in_progress', 'completed', 'picked_up'].includes(selectedRepair.status) ? 'finish' : 'wait'} />
                <Steps.Step title="完成返修" description={selectedRepair.status === 'completed' || selectedRepair.status === 'picked_up' ? '已完成' : '待完成'} status={['completed', 'picked_up'].includes(selectedRepair.status) ? 'finish' : 'wait'} />
                <Steps.Step title="客户取货" description={selectedRepair.picked_up_at ? dayjs(selectedRepair.picked_up_at).format('MM-DD HH:mm') : '待取货'} status={selectedRepair.status === 'picked_up' ? 'finish' : 'wait'} />
              </Steps>
            </Card>

            <Card title="操作日志" size="small">
              <Timeline
                style={{ maxHeight: 200, overflow: 'auto' }}
                items={(selectedRepair.logs || []).map(log => ({
                  children: (
                    <div>
                      <Text strong>{log.action}</Text>
                      <div style={{ fontSize: 12 }}>
                        <Text type="secondary">{log.operator_name}</Text>
                        {' · '}
                        <Text type="secondary">{dayjs(log.created_at).format('MM-DD HH:mm')}</Text>
                      </div>
                    </div>
                  )
                }))}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default Repairs;
