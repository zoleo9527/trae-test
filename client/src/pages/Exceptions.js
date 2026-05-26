import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Select, Input, message, Badge } from 'antd';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, approvalAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const exceptionTypeLabels = {
  batch_mix: { text: '批次混发', color: 'red' },
  price_confusion: { text: '价格口径', color: 'orange' },
  damage: { text: '货物破损', color: 'red' },
  other: { text: '其他', color: 'default' },
};

const statusLabels = {
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
};

function Exceptions() {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [handlingException, setHandlingException] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadExceptions();
  }, []);

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const data = await dashboardAPI.getExceptions();
      setExceptions(data);
    } catch (error) {
      console.error('加载异常记录失败', error);
    }
    setLoading(false);
  };

  const handleResolve = async (values) => {
    try {
      await approvalAPI.updateException(handlingException.id, {
        status: 'resolved',
        handled_by: 'staff_001',
        resolution: values.resolution,
      });
      message.success('处理完成');
      setModalVisible(false);
      form.resetFields();
      loadExceptions();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      render: type => {
        const info = exceptionTypeLabels[type] || { text: type, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
      filters: [
        { text: '批次混发', value: 'batch_mix' },
        { text: '价格口径', value: 'price_confusion' },
        { text: '货物破损', value: 'damage' },
        { text: '其他', value: 'other' },
      ],
      onFilter: (value, record) => record.exception_type === value,
    },
    {
      title: '关联单号',
      dataIndex: 'related_no',
      key: 'related_no',
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => record.related_type === 'order' && navigate(`/orders/${record.related_id}`)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: '异常描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 250,
    },
    {
      title: '上报人',
      dataIndex: 'reporter_name',
      key: 'reporter_name',
    },
    {
      title: '上报时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: val => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => {
        const info = statusLabels[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '处理中', value: 'processing' },
        { text: '已解决', value: 'resolved' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      render: val => val || '-',
    },
    {
      title: '处理结果',
      dataIndex: 'resolution',
      key: 'resolution',
      ellipsis: true,
      width: 200,
      render: val => val || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status !== 'resolved' ? (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setHandlingException(record);
              setModalVisible(true);
            }}
          >
            处理
          </Button>
        ) : null
      ),
    },
  ];

  const pendingCount = exceptions.filter(e => e.status === 'pending').length;

  return (
    <Card
      title="异常处理中心"
      extra={
        <Badge count={pendingCount} size="small">
          <Tag color="orange">待处理 {pendingCount} 条</Tag>
        </Badge>
      }
    >
      <Table
        columns={columns}
        dataSource={exceptions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: record => (
            <div style={{ padding: '0 24px' }}>
              <p style={{ margin: 0 }}><strong>异常描述：</strong>{record.description}</p>
              {record.resolution && (
                <p style={{ margin: '8px 0 0 0' }}><strong>处理结果：</strong>{record.resolution}</p>
              )}
              {record.evidence_urls && (
                <p style={{ margin: '8px 0 0 0' }}><strong>证据：</strong>{record.evidence_urls}</p>
              )}
            </div>
          ),
        }}
      />

      <Modal
        title="处理异常"
        open={modalVisible}
        footer={null}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        {handlingException && (
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Tag color={exceptionTypeLabels[handlingException.exception_type]?.color}>
                  {exceptionTypeLabels[handlingException.exception_type]?.text}
                </Tag>
                <span style={{ marginLeft: 8 }}>{handlingException.related_no}</span>
              </div>
              <div style={{ padding: 12, background: '#fff2f0', borderRadius: 4 }}>
                {handlingException.description}
              </div>
            </Space>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            label="处理结果"
            name="resolution"
            rules={[{ required: true, message: '请填写处理结果' }]}
          >
            <TextArea rows={4} placeholder="请详细描述处理结果..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认处理</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Exceptions;
