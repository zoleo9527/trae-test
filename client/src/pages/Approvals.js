import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Avatar, Modal, Form, Input, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { approvalAPI, orderAPI } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusLabels = {
  pending_approval: { text: '待审批', color: 'gold' },
  approved: { text: '已审批', color: 'blue' },
  rejected: { text: '已驳回', color: 'red' },
  shipped: { text: '已发货', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
};

function Approvals() {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [approvalsData, ordersData] = await Promise.all([
        approvalAPI.getAll(),
        orderAPI.getAll({ status: 'pending_approval' }),
      ]);
      setApprovals(approvalsData);
      setPendingOrders(ordersData);
    } catch (error) {
      console.error('加载审批数据失败', error);
    }
    setLoading(false);
  };

  const handleApprove = async (orderId) => {
    try {
      await approvalAPI.approve(orderId, { approver_id: 'staff_001' });
      message.success('审批通过');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReject = async (values) => {
    try {
      await approvalAPI.reject(rejectingOrderId, { 
        approver_id: 'staff_001', 
        reason: values.reason 
      });
      message.success('已驳回');
      setRejectModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const pendingColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '客户',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{record.customer_name?.[0]}</Avatar>
          <span>{record.customer_name}</span>
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
              {(record.discount_rate * 100).toFixed(0)}%折扣
            </div>
          )}
        </div>
      ),
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
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/orders/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="text"
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setRejectingOrderId(record.id);
              setRejectModalVisible(true);
            }}
          >
            驳回
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApprove(record.id)}
          >
            通过
          </Button>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/orders/${record.order_id}`)}>{text}</Button>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '产品',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '金额',
      dataIndex: 'final_amount',
      key: 'final_amount',
      render: val => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{val?.toFixed(2)}</span>,
    },
    {
      title: '审批动作',
      dataIndex: 'action',
      key: 'action',
      render: action => (
        <Tag color={action === 'approve' ? 'green' : 'red'}>
          {action === 'approve' ? '通过' : '驳回'}
        </Tag>
      ),
    },
    {
      title: '审批人',
      dataIndex: 'approver_name',
      key: 'approver_name',
    },
    {
      title: '审批时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: val => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '驳回原因',
      dataIndex: 'reason',
      key: 'reason',
      render: val => val || '-',
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title="待审批订单"
        extra={<Tag color="gold">{pendingOrders.length} 条待处理</Tag>}
      >
        <Table
          columns={pendingColumns}
          dataSource={pendingOrders}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Card title="审批历史">
        <Table
          columns={historyColumns}
          dataSource={approvals}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="驳回订单"
        open={rejectModalVisible}
        footer={null}
        onCancel={() => setRejectModalVisible(false)}
      >
        <Form form={form} layout="vertical" onFinish={handleReject}>
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
    </Space>
  );
}

export default Approvals;
