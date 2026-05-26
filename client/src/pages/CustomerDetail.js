import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, List, Input, Form, message, Timeline, Avatar, Checkbox } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { customerAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const levelLabels = {
  vip: { text: 'VIP客户', color: 'gold' },
  regular: { text: '普通客户', color: 'blue' },
  potential: { text: '潜在客户', color: 'default' },
};

const orderStatusLabels = {
  pending_approval: { text: '待审批', color: 'gold' },
  approved: { text: '已审批', color: 'blue' },
  rejected: { text: '已驳回', color: 'red' },
  shipped: { text: '已发货', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
};

function CustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    setLoading(true);
    try {
      const data = await customerAPI.getById(id);
      setCustomer(data);
    } catch (error) {
      message.error('加载客户信息失败');
    }
    setLoading(false);
  };

  const addRemark = async (values) => {
    try {
      await customerAPI.addRemark(id, {
        content: values.content,
        created_by: 'staff_001',
        is_supplement: values.is_supplement ? 1 : 0,
      });
      message.success('备注添加成功');
      form.resetFields();
      loadCustomer();
    } catch (error) {
      message.error('添加失败');
    }
  };

  if (!customer) return <div style={{ padding: 24 }}>加载中...</div>;

  const levelInfo = levelLabels[customer.level] || { text: customer.level, color: 'default' };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/customers')}
        style={{ marginBottom: 16 }}
      >
        返回客户列表
      </Button>

      <Card title="客户信息" style={{ marginBottom: 16 }} loading={loading}>
        <Descriptions column={3}>
          <Descriptions.Item label="客户名称">
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{customer.name?.[0]}</Avatar>
              {customer.name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="公司名称">{customer.company}</Descriptions.Item>
          <Descriptions.Item label="客户级别">
            <Tag color={levelInfo.color}>{levelInfo.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">{customer.phone}</Descriptions.Item>
          <Descriptions.Item label="地址">{customer.address}</Descriptions.Item>
          <Descriptions.Item label="客户来源">{customer.source}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="试饮记录">
          <List
            dataSource={customer.trials}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.product_name}</span>
                      <Tag color={item.status === 'completed' ? 'green' : 'blue'}>
                        {item.status === 'completed' ? '已完成' : item.status === 'in_progress' ? '进行中' : '待处理'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>试饮数量：{item.trial_quantity}份 | 试饮日期：{item.trial_date}</div>
                      {item.feedback && <div style={{ color: '#666', marginTop: 4 }}>反馈：{item.feedback}</div>}
                    </div>
                  }
                />
                <Button type="link" size="small" onClick={() => navigate(`/trials/${item.id}`)}>查看</Button>
              </List.Item>
            )}
          />
        </Card>

        <Card title="历史订单">
          <List
            dataSource={customer.orders}
            renderItem={item => {
              const statusInfo = orderStatusLabels[item.status] || { text: item.status, color: 'default' };
              return (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.order_no}</span>
                        <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.product_name} x {item.quantity}</div>
                        <div style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{item.final_amount?.toFixed(2)}</div>
                      </div>
                    }
                  />
                  <Button type="link" size="small" onClick={() => navigate(`/orders/${item.id}`)}>查看</Button>
                </List.Item>
              );
            }}
          />
        </Card>

        <Card
          title="客户备注"
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
            dataSource={customer.remarks}
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
    </div>
  );
}

export default CustomerDetail;
