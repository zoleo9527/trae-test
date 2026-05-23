import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Select, Input, Select as AntSelect, message, Card, Typography, Descriptions, Steps, Timeline
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, SwapOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { TRANSFER_STATUS, PRIORITY } from '../utils/constants';
import useAuthStore from '../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = AntSelect;

const Transfers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [form] = Form.useForm();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadData();
    loadStores();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await request.get('/transfers');
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const result = await request.get('/stores');
      setStores(result);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadProducts = async (storeId) => {
    try {
      const result = await request.get('/products', { params: { storeId, status: 'in_stock' } });
      setProducts(result.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const canCreateTransfer = ['sales_associate', 'store_manager'].includes(user.role);

  const handleCreate = () => {
    if (!canCreateTransfer) return;
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await request.post('/transfers', { ...values, from_store_id: user.store_id });
      message.success('调货申请创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error('Failed to create transfer:', error);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await request.get(`/transfers/${record.id}`);
      setSelectedTransfer(detail);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to load transfer detail:', error);
    }
  };

  const handleApprove = async (id, approved) => {
    if (user.role !== 'store_manager') {
      message.error('只有店长可以审批');
      return;
    }
    if (approved) {
      Modal.confirm({
        title: '确认批准调货申请',
        content: '确定批准此调货申请吗？',
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            await request.post(`/transfers/${id}/approve`, {});
            message.success('已批准');
            loadData();
            if (selectedTransfer) {
              handleViewDetail({ id });
            }
          } catch (error) {
            console.error('Failed to approve transfer:', error);
          }
        }
      });
    } else {
      Modal.confirm({
        title: '拒绝调货申请',
        content: '确定拒绝此调货申请吗？',
        okText: '确定拒绝',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await request.post(`/transfers/${id}/approve`, {
              rejection_reason: '店长拒绝'
            });
            message.success('已拒绝');
            loadData();
            if (selectedTransfer) {
              handleViewDetail({ id });
            }
          } catch (error) {
            console.error('Failed to reject transfer:', error);
          }
        }
      });
    }
  };

  const handleShip = async (id) => {
    if (!['sales_associate', 'store_manager'].includes(user.role)) {
      message.error('只有导购和店长可以发货');
      return;
    }
    try {
      await request.post(`/transfers/${id}/ship`);
      message.success('已标记发货');
      loadData();
      if (selectedTransfer) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to ship:', error);
    }
  };

  const handleReceive = async (id) => {
    if (!['sales_associate', 'store_manager'].includes(user.role)) {
      message.error('只有导购和店长可以收货');
      return;
    }
    try {
      await request.post(`/transfers/${id}/receive`);
      message.success('已确认收货');
      loadData();
      if (selectedTransfer) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to receive:', error);
    }
  };

  const handleComplete = async (id) => {
    if (user.role !== 'store_manager') {
      message.error('只有店长可以完成调货');
      return;
    }
    try {
      await request.post(`/transfers/${id}/complete`);
      message.success('调货已完成');
      loadData();
      if (selectedTransfer) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  const canApprove = (record) => record.status === 'pending' && record.from_store_id === user.store_id && user.role === 'store_manager';
  const canShip = (record) => record.status === 'approved' && record.from_store_id === user.store_id && ['sales_associate', 'store_manager'].includes(user.role);
  const canReceive = (record) => record.status === 'shipped' && record.to_store_id === user.store_id && ['sales_associate', 'store_manager'].includes(user.role);
  const canComplete = (record) => record.status === 'received' && user.role === 'store_manager';

  const columns = [
    {
      title: '申请单号',
      dataIndex: 'request_no',
      key: 'request_no',
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
      title: '调出门店',
      dataIndex: 'from_store_name',
      key: 'from_store_name',
      width: 120
    },
    {
      title: '调入门店',
      dataIndex: 'to_store_name',
      key: 'to_store_name',
      width: 120
    },
    {
      title: '申请人',
      dataIndex: 'requester_name',
      key: 'requester_name',
      width: 100
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (text) => PRIORITY[text] || text
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = TRANSFER_STATUS[status] || { label: status, color: 'default' };
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
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {canApprove(record) && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id, true)}>
                批准
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleApprove(record.id, false)}>
                拒绝
              </Button>
            </>
          )}
          {canShip(record) && (
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleShip(record.id)}>
              发货
            </Button>
          )}
          {canReceive(record) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleReceive(record.id)}>
              收货
            </Button>
          )}
          {canComplete(record) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleComplete(record.id)}>
              完成
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
            <Title level={4} style={{ margin: 0 }}>调货管理</Title>
            <Text type="secondary">跨门店货品调拨申请与跟踪</Text>
          </div>
          {canCreateTransfer && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建调货申请
            </Button>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="新建调货申请"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="to_store_id"
            label="调入门店"
            rules={[{ required: true, message: '请选择调入门店' }]}
          >
            <Select placeholder="请选择调入门店">
              {stores.filter(s => s.id !== user.store_id).map(store => (
                <Option key={store.id} value={store.id}>{store.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="product_id"
            label="调出货品"
            rules={[{ required: true, message: '请选择调出货品' }]}
          >
            <Select 
              placeholder="请选择货品"
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              onFocus={() => loadProducts(user.store_id)}
            >
              {products.map(product => (
                <Option key={product.id} value={product.id}>
                  {product.name} ({product.sku}) - ¥{product.retail_price}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            initialValue="normal"
          >
            <Select>
              {Object.entries(PRIORITY).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reason"
            label="调货原因"
            rules={[{ required: true, message: '请输入调货原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明调货原因..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交申请</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="调货详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          selectedTransfer && canApprove(selectedTransfer) && (
            <Button key="approve" type="primary" onClick={() => handleApprove(selectedTransfer.id, true)}>
              批准
            </Button>
          ),
          selectedTransfer && canApprove(selectedTransfer) && (
            <Button key="reject" danger onClick={() => handleApprove(selectedTransfer.id, false)}>
              拒绝
            </Button>
          ),
          selectedTransfer && canShip(selectedTransfer) && (
            <Button key="ship" type="primary" onClick={() => handleShip(selectedTransfer.id)}>
              确认发货
            </Button>
          ),
          selectedTransfer && canReceive(selectedTransfer) && (
            <Button key="receive" type="primary" onClick={() => handleReceive(selectedTransfer.id)}>
              确认收货
            </Button>
          ),
          selectedTransfer && canComplete(selectedTransfer) && (
            <Button key="complete" type="primary" onClick={() => handleComplete(selectedTransfer.id)}>
              完成调货
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ].filter(Boolean)}
        width={800}
      >
        {selectedTransfer && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="申请单号">{selectedTransfer.request_no}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={TRANSFER_STATUS[selectedTransfer.status]?.color}>
                    {TRANSFER_STATUS[selectedTransfer.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="调出门店">{selectedTransfer.from_store_name}</Descriptions.Item>
                <Descriptions.Item label="调入门店">{selectedTransfer.to_store_name}</Descriptions.Item>
                <Descriptions.Item label="申请人">{selectedTransfer.requester_name}</Descriptions.Item>
                <Descriptions.Item label="优先级">{PRIORITY[selectedTransfer.priority]}</Descriptions.Item>
                <Descriptions.Item label="申请时间">{dayjs(selectedTransfer.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="货品名称">{selectedTransfer.product_name}</Descriptions.Item>
                <Descriptions.Item label="SKU">{selectedTransfer.sku}</Descriptions.Item>
                <Descriptions.Item label="品类">{selectedTransfer.category}</Descriptions.Item>
                <Descriptions.Item label="零售价">¥{selectedTransfer.retail_price}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="处理流程" size="small">
              <Steps
                direction="vertical"
                current={
                  selectedTransfer.status === 'pending' ? 1 :
                  selectedTransfer.status === 'approved' ? 2 :
                  selectedTransfer.status === 'shipped' ? 3 :
                  selectedTransfer.status === 'received' ? 4 :
                  selectedTransfer.status === 'completed' ? 5 :
                  selectedTransfer.status === 'rejected' ? 1 : 1
                }
                status={selectedTransfer.status === 'rejected' ? 'error' : 'process'}
              >
                <Steps.Step title="创建申请" description={`${selectedTransfer.requester_name} - ${dayjs(selectedTransfer.created_at).format('MM-DD HH:mm')}`} status="finish" />
                <Steps.Step title="店长审批" description={selectedTransfer.status !== 'pending' ? `${selectedTransfer.approver_name || '系统'} - ${dayjs(selectedTransfer.approved_at || selectedTransfer.created_at).format('MM-DD HH:mm')}` : '待审批'} status={selectedTransfer.status === 'pending' ? 'process' : selectedTransfer.status === 'rejected' ? 'error' : 'finish'} />
                <Steps.Step title="调出门店发货" description={selectedTransfer.shipped_at ? `${dayjs(selectedTransfer.shipped_at).format('MM-DD HH:mm')}` : '待发货'} status={['shipped', 'received', 'completed'].includes(selectedTransfer.status) ? 'finish' : 'wait'} />
                <Steps.Step title="调入门店收货" description={selectedTransfer.received_at ? `${dayjs(selectedTransfer.received_at).format('MM-DD HH:mm')}` : '待收货'} status={['received', 'completed'].includes(selectedTransfer.status) ? 'finish' : 'wait'} />
                <Steps.Step title="调货完成" description={selectedTransfer.completed_at ? `${dayjs(selectedTransfer.completed_at).format('MM-DD HH:mm')}` : '待完成'} status={selectedTransfer.status === 'completed' ? 'finish' : 'wait'} />
              </Steps>
            </Card>

            {selectedTransfer.reason && (
              <Card title="调货原因" size="small">
                <Text>{selectedTransfer.reason}</Text>
              </Card>
            )}

            <Card title="操作日志" size="small">
              <Timeline
                style={{ maxHeight: 200, overflow: 'auto' }}
                items={(selectedTransfer.logs || []).map(log => ({
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

export default Transfers;
