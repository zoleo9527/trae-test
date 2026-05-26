import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, List, Input, Form, message, Timeline, Avatar, Modal, Select, Steps, Checkbox } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, TruckOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { orderAPI, approvalAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const statusLabels = {
  pending_approval: { text: '待审批', color: 'gold' },
  approved: { text: '已审批', color: 'blue' },
  rejected: { text: '已驳回', color: 'red' },
  shipped: { text: '已发货', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
};

const exceptionTypeLabels = {
  batch_mix: '批次混发',
  price_confusion: '价格口径',
  damage: '货物破损',
  other: '其他',
};

function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [form] = Form.useForm();
  const [exceptionForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.getById(id);
      setOrder(data);
    } catch (error) {
      message.error('加载订单详情失败');
    }
    setLoading(false);
  };

  const addRemark = async (values) => {
    try {
      await orderAPI.addRemark(id, {
        content: values.content,
        created_by: 'staff_001',
        is_supplement: values.is_supplement ? 1 : 0,
      });
      message.success('备注添加成功');
      form.resetFields();
      loadOrder();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleApprove = async () => {
    try {
      await approvalAPI.approve(id, { approver_id: 'staff_001' });
      message.success('审批通过');
      setApproveModalVisible(false);
      loadOrder();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReject = async (values) => {
    try {
      await approvalAPI.reject(id, { approver_id: 'staff_001', reason: values.reason });
      message.success('已驳回');
      setRejectModalVisible(false);
      loadOrder();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleShip = async (values) => {
    try {
      await approvalAPI.ship(id, { shipper_id: 'staff_004', batch_no: values.batch_no });
      message.success('发货完成');
      setShipModalVisible(false);
      loadOrder();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReceive = async () => {
    try {
      await approvalAPI.receive(id);
      message.success('收货确认完成');
      loadOrder();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const addException = async (values) => {
    try {
      await orderAPI.addException(id, {
        exception_type: values.exception_type,
        description: values.description,
        reported_by: 'staff_001',
      });
      message.success('异常上报成功');
      setExceptionModalVisible(false);
      exceptionForm.resetFields();
      loadOrder();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStepIndex = () => {
    const steps = ['pending_approval', 'approved', 'shipped', 'completed'];
    const idx = steps.indexOf(order?.status);
    return order?.status === 'rejected' ? 0 : idx;
  };

  if (!order) return <div style={{ padding: 24 }}>加载中...</div>;

  const statusInfo = statusLabels[order.status] || { text: order.status, color: 'default' };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/orders')}
        style={{ marginBottom: 16 }}
      >
        返回订单列表
      </Button>

      <Card title="订单详情" style={{ marginBottom: 16 }} loading={loading}>
        <Space style={{ marginBottom: 16, width: '100%' }}>
          <h3 style={{ margin: 0 }}>{order.order_no}</h3>
          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          {order.batch_no && <Tag>批次: {order.batch_no}</Tag>}
        </Space>

        <Steps current={getStepIndex()} status={order.status === 'rejected' ? 'error' : 'process'} style={{ marginBottom: 24 }}>
          <Step title="创建订单" />
          <Step title="审批" />
          <Step title="发货" />
          <Step title="完成" />
        </Steps>

        <Descriptions column={3}>
          <Descriptions.Item label="客户">
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{order.customer_name?.[0]}</Avatar>
              {order.customer_name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="公司">{order.company}</Descriptions.Item>
          <Descriptions.Item label="电话">{order.phone}</Descriptions.Item>
          <Descriptions.Item label="产品">{order.product_name}</Descriptions.Item>
          <Descriptions.Item label="规格">{order.spec}</Descriptions.Item>
          <Descriptions.Item label="数量">{order.quantity}</Descriptions.Item>
          <Descriptions.Item label="单价">¥{order.unit_price?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="折扣">{(order.discount_rate * 100).toFixed(0)}%</Descriptions.Item>
          <Descriptions.Item label="实付金额" span={3}>
            <span style={{ fontSize: 20, color: '#fa8c16', fontWeight: 'bold' }}>¥{order.final_amount?.toFixed(2)}</span>
          </Descriptions.Item>
          <Descriptions.Item label="发货仓库">{order.warehouse}</Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>{order.delivery_address}</Descriptions.Item>
        </Descriptions>

        {order.status === 'pending_approval' && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRejectModalVisible(true)} icon={<CloseCircleOutlined />}>驳回</Button>
              <Button type="primary" onClick={() => setApproveModalVisible(true)} icon={<CheckCircleOutlined />}>通过</Button>
            </Space>
          </div>
        )}

        {order.status === 'approved' && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={() => setShipModalVisible(true)} icon={<TruckOutlined />}>确认发货</Button>
          </div>
        )}

        {order.status === 'shipped' && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={handleReceive} icon={<CheckCircleOutlined />}>确认收货</Button>
          </div>
        )}
      </Card>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          title="审批记录"
          extra={order.approvals?.length === 0 && <Tag color="orange">待审批</Tag>}
        >
          {order.approvals?.length > 0 ? (
            <Timeline>
              {order.approvals.map(a => (
                <Timeline.Item
                  key={a.id}
                  color={a.action === 'approve' ? 'green' : 'red'}
                >
                  <div>
                    <Space>
                      <strong>{a.approver_name}</strong>
                      <Tag color={a.action === 'approve' ? 'green' : 'red'}>
                        {a.action === 'approve' ? '通过' : '驳回'}
                      </Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>
                        {dayjs(a.created_at).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </Space>
                    {a.reason && <div style={{ marginTop: 4, color: '#666' }}>原因：{a.reason}</div>}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无审批记录</div>
          )}
        </Card>

        <Card
          title="异常记录"
          extra={
            <Button
              type="primary"
              size="small"
              icon={<WarningOutlined />}
              onClick={() => setExceptionModalVisible(true)}
            >
              上报异常
            </Button>
          }
        >
          {order.exceptions?.length > 0 ? (
            <List
              dataSource={order.exceptions}
              renderItem={item => (
                <List.Item className={`exception-card ${item.status === 'resolved' ? 'resolved' : ''}`}>
                  <List.Item.Meta
                    avatar={<WarningOutlined style={{ color: item.status === 'resolved' ? '#52c41a' : '#ff4d4f', fontSize: 20 }} />}
                    title={
                      <Space>
                        <Tag color={item.status === 'resolved' ? 'green' : 'red'}>
                          {exceptionTypeLabels[item.exception_type] || item.exception_type}
                        </Tag>
                        <Tag color={item.status === 'resolved' ? 'green' : 'orange'}>
                          {item.status === 'resolved' ? '已解决' : '待处理'}
                        </Tag>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          上报人：{item.reporter_name}
                        </span>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>{item.description}</div>
                        {item.resolution && (
                          <div style={{ padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                            <strong>处理结果：</strong>{item.resolution}
                            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                              处理人：{item.handler_name} · {dayjs(item.handled_at).format('MM-DD HH:mm')}
                            </div>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>暂无异常记录</div>
          )}
        </Card>

        <Card
          title="订单备注"
          extra={
            <Form form={form} layout="inline" onFinish={addRemark} style={{ margin: 0 }}>
              <Space>
                <Form.Item name="content" rules={[{ required: true, message: '请输入备注内容' }]} style={{ marginBottom: 0 }}>
                  <Input placeholder="添加备注..." style={{ width: 300 }} />
                </Form.Item>
                <Form.Item name="is_supplement" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Checkbox>补录</Checkbox>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>添加</Button>
                </Form.Item>
              </Space>
            </Form>
          }
        >
          <List
            dataSource={order.remarks}
            renderItem={item => (
              <div className={`remark-item ${item.is_supplement ? 'supplement' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.content}</span>
                  <Space>
                    {item.is_supplement && <Tag color="orange" size="small">补录</Tag>}
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {item.creator_name} · {dayjs(item.created_at).format('MM-DD HH:mm')}
                    </span>
                  </Space>
                </div>
              </div>
            )}
          />
        </Card>
      </Space>

      <Modal
        title="审批通过"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        okText="确认通过"
      >
        <p>确认通过此订单的审批？</p>
      </Modal>

      <Modal
        title="驳回订单"
        open={rejectModalVisible}
        footer={null}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form layout="vertical" onFinish={handleReject}>
          <Form.Item
            label="驳回原因"
            name="reason"
            rules={[{ required: true, message: '请填写驳回原因' }]}
          >
            <TextArea rows={4} placeholder="请详细说明驳回原因..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setRejectModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" danger>确认驳回</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认发货"
        open={shipModalVisible}
        footer={null}
        onCancel={() => setShipModalVisible(false)}
      >
        <Form layout="vertical" onFinish={handleShip}>
          <Form.Item
            label="批次号"
            name="batch_no"
            rules={[{ required: true, message: '请填写批次号' }]}
          >
            <Input placeholder="请输入产品批次号" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShipModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认发货</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上报异常"
        open={exceptionModalVisible}
        footer={null}
        onCancel={() => setExceptionModalVisible(false)}
      >
        <Form form={exceptionForm} layout="vertical" onFinish={addException}>
          <Form.Item
            label="异常类型"
            name="exception_type"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select placeholder="选择异常类型">
              <Option value="batch_mix">批次混发</Option>
              <Option value="price_confusion">价格口径</Option>
              <Option value="damage">货物破损</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="异常描述"
            name="description"
            rules={[{ required: true, message: '请描述异常情况' }]}
          >
            <TextArea rows={4} placeholder="请详细描述异常情况..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setExceptionModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderDetail;
