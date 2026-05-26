import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Space, List, Input, Form, message, Rate, Avatar, Checkbox } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { trialAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusLabels = {
  pending: { text: '待处理', color: 'orange' },
  in_progress: { text: '进行中', color: 'blue' },
  completed: { text: '已完成', color: 'green' },
};

const followupTypeLabels = {
  phone: { text: '电话回访', icon: <PhoneOutlined /> },
  visit: { text: '上门拜访', icon: <CheckCircleOutlined /> },
  wechat: { text: '微信跟进', icon: <PhoneOutlined /> },
};

function TrialDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [trial, setTrial] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrial();
  }, [id]);

  const loadTrial = async () => {
    setLoading(true);
    try {
      const data = await trialAPI.getById(id);
      setTrial(data);
    } catch (error) {
      message.error('加载试饮详情失败');
    }
    setLoading(false);
  };

  const addRemark = async (values) => {
    try {
      await trialAPI.addRemark(id, {
        content: values.content,
        created_by: 'staff_001',
        is_supplement: values.is_supplement ? 1 : 0,
      });
      message.success('备注添加成功');
      form.resetFields();
      loadTrial();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const completeTrial = async () => {
    try {
      await trialAPI.update(id, {
        status: 'completed',
        feedback: trial.feedback,
        satisfaction_score: trial.satisfaction_score,
      });
      message.success('试饮已完成');
      loadTrial();
    } catch (error) {
      message.error('操作失败');
    }
  };

  if (!trial) return <div style={{ padding: 24 }}>加载中...</div>;

  const statusInfo = statusLabels[trial.status] || { text: trial.status, color: 'default' };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/trials')}
        style={{ marginBottom: 16 }}
      >
        返回试饮列表
      </Button>

      <Card title="试饮详情" style={{ marginBottom: 16 }} loading={loading}>
        <Descriptions column={3}>
          <Descriptions.Item label="客户">
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{trial.customer_name?.[0]}</Avatar>
              {trial.customer_name}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="公司">{trial.company}</Descriptions.Item>
          <Descriptions.Item label="电话">{trial.phone}</Descriptions.Item>
          <Descriptions.Item label="试饮产品">{trial.product_name}</Descriptions.Item>
          <Descriptions.Item label="产品规格">{trial.category} · {trial.spec}</Descriptions.Item>
          <Descriptions.Item label="试饮数量">{trial.trial_quantity}份</Descriptions.Item>
          <Descriptions.Item label="试饮日期">{trial.trial_date}</Descriptions.Item>
          <Descriptions.Item label="负责业务员">{trial.staff_name}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {trial.status === 'completed' && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Descriptions column={2}>
              <Descriptions.Item label="满意度评分">
                <Rate disabled value={trial.satisfaction_score} allowHalf />
              </Descriptions.Item>
              <Descriptions.Item label="客户反馈">{trial.feedback}</Descriptions.Item>
            </Descriptions>
          </div>
        )}

        {trial.status !== 'completed' && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button type="primary" onClick={completeTrial}>标记完成</Button>
          </div>
        )}
      </Card>

      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="回访任务">
          <List
            dataSource={trial.followups}
            renderItem={item => {
              const typeInfo = followupTypeLabels[item.followup_type] || { text: item.followup_type, icon: null };
              return (
                <List.Item
                  actions={[
                    <Tag color={item.status === 'completed' ? 'green' : 'orange'}>
                      {item.status === 'completed' ? '已完成' : '待回访'}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={typeInfo.icon}
                    title={
                      <Space>
                        <span>{typeInfo.text}</span>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {item.scheduled_date} {item.scheduled_time || ''}
                        </span>
                      </Space>
                    }
                    description={
                      <div>
                        {item.result ? (
                          <div>回访结果：{item.result}</div>
                        ) : (
                          <div style={{ color: '#999' }}>待执行</div>
                        )}
                      </div>
                    }
                  />
                  <Button type="link" size="small" onClick={() => navigate('/followups')}>查看</Button>
                </List.Item>
              );
            }}
          />
        </Card>

        <Card
          title="试饮备注"
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
            dataSource={trial.remarks}
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

export default TrialDetail;
