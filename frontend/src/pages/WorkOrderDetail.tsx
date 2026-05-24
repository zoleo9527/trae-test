import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Table,
  List,
  Timeline,
  Select,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { workOrderAPI, followUpAPI } from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

const WorkOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [histories, setHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [followUpForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, historyRes] = await Promise.all([
        workOrderAPI.getById(id!),
        workOrderAPI.getHistories(id!),
      ]);
      setWorkOrder(orderRes.data);
      setHistories(historyRes.data || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      pending_review: { color: 'orange', text: '待审核' },
      reviewed: { color: 'blue', text: '已审核' },
      in_progress: { color: 'processing', text: '处理中' },
      pending_confirm: { color: 'purple', text: '待确认' },
      completed: { color: 'success', text: '已完成' },
      rejected: { color: 'error', text: '已驳回' },
      cancelled: { color: 'default', text: '已取消' },
      needs_review: { color: 'warning', text: '需复核' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { color: string; text: string }> = {
      low: { color: 'default', text: '低' },
      normal: { color: 'blue', text: '普通' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' },
    };
    const info = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      repair: '返修',
      custom: '定制',
      transfer: '调货',
      return: '退货',
      exchange: '换货',
      cleaning: '清洗保养',
    };
    return typeMap[type] || type;
  };

  const getAvailableStatuses = () => {
    if (!workOrder || !user) return [];
    const currentStatus = workOrder.status;
    const userRole = user.role;

    const transitions: Record<string, Array<{ value: string; label: string }>> = {
      draft: [
        { value: 'pending_review', label: '提交审核' },
        { value: 'cancelled', label: '取消工单' },
      ],
      pending_review: [
        { value: 'reviewed', label: '审核通过' },
        { value: 'rejected', label: '审核驳回' },
      ],
      reviewed: [
        { value: 'in_progress', label: '开始处理' },
        { value: 'needs_review', label: '需要复核' },
      ],
      in_progress: [
        { value: 'pending_confirm', label: '处理完成待确认' },
        { value: 'needs_review', label: '需要复核' },
      ],
      needs_review: [
        { value: 'in_progress', label: '复核通过继续处理' },
        { value: 'rejected', label: '复核不通过' },
      ],
      pending_confirm: [
        { value: 'completed', label: '确认完成' },
        { value: 'in_progress', label: '返工' },
        { value: 'needs_review', label: '需要复核' },
      ],
      rejected: [
        { value: 'draft', label: '修改后重新提交' },
        { value: 'cancelled', label: '取消工单' },
      ],
    };

    return transitions[currentStatus] || [];
  };

  const handleStatusChange = async (values: { status: string; reason: string }) => {
    try {
      await workOrderAPI.changeStatus(id!, values.status, values.reason);
      message.success('状态更新成功');
      setStatusModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败');
    }
  };

  const handleCreateFollowUp = async (values: any) => {
    try {
      await followUpAPI.create({
        ...values,
        memberId: workOrder.memberId,
        workOrderId: workOrder.id,
        plannedAt: values.plannedAt || new Date(),
      });
      message.success('回访任务创建成功');
      setFollowUpModalVisible(false);
      followUpForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const itemColumns = [
    { title: '物品名称', dataIndex: 'itemName', key: 'itemName' },
    { title: '规格描述', dataIndex: 'itemSpec', key: 'itemSpec' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '交接状态', dataIndex: 'handoverStatus', key: 'handoverStatus',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待接收' },
          received: { color: 'success', text: '已接收' },
          returned: { color: 'blue', text: '已返还' },
          shipped: { color: 'purple', text: '已发货' },
        };
        const info = map[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '接收时间', dataIndex: 'receivedAt', key: 'receivedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
  ];

  if (loading || !workOrder) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-orders')}>
          返回列表
        </Button>
      </div>

      <Card
        title={
          <Space>
            <span>工单详情</span>
            {getStatusTag(workOrder.status)}
            {getPriorityTag(workOrder.priority)}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => setStatusModalVisible(true)}
              disabled={getAvailableStatuses().length === 0}
            >
              变更状态
            </Button>
            <Button icon={<PhoneOutlined />} onClick={() => setFollowUpModalVisible(true)}>
              创建回访
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="工单编号">{workOrder.orderNo}</Descriptions.Item>
          <Descriptions.Item label="工单类型">{getTypeText(workOrder.type)}</Descriptions.Item>
          <Descriptions.Item label="会员姓名">{workOrder.member?.realName}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{workOrder.member?.phone}</Descriptions.Item>
          <Descriptions.Item label="处理人">{workOrder.handler?.realName || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(workOrder.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="预估费用">¥{workOrder.estimatedCost || 0}</Descriptions.Item>
          <Descriptions.Item label="实际费用">¥{workOrder.actualCost || 0}</Descriptions.Item>
          <Descriptions.Item label="问题描述" span={2}>
            {workOrder.problemDescription}
          </Descriptions.Item>
          <Descriptions.Item label="客户要求" span={2}>
            {workOrder.customerRequirement || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="内部备注" span={2}>
            {workOrder.internalNote || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <h4 style={{ marginBottom: 16 }}>物品明细</h4>
        <Table
          columns={itemColumns}
          dataSource={workOrder.items || []}
          rowKey="id"
          pagination={false}
          size="small"
        />

        <Divider />

        <h4 style={{ marginBottom: 16 }}><HistoryOutlined /> 状态变更记录</h4>
        <Timeline>
          {histories.map((h: any) => (
            <Timeline.Item key={h.id}>
              <p>
                <strong>{h.fromStatus} → {h.toStatus}</strong>
                <Tag style={{ marginLeft: 8 }}>{h.operator?.realName || '系统'}</Tag>
                <span style={{ color: '#999', marginLeft: 8 }}>
                  {dayjs(h.createdAt).format('YYYY-MM-DD HH:mm')}
                </span>
              </p>
              {h.changeReason && <p style={{ color: '#666' }}>原因: {h.changeReason}</p>}
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      <Modal
        title="变更工单状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleStatusChange}>
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择目标状态' }]}
          >
            <Select placeholder="请选择">
              {getAvailableStatuses().map((s) => (
                <Option key={s.value} value={s.value}>{s.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="变更原因" name="reason">
            <Input.TextArea rows={3} placeholder="请输入变更原因（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建回访任务"
        open={followUpModalVisible}
        onCancel={() => setFollowUpModalVisible(false)}
        onOk={() => followUpForm.submit()}
        width={600}
      >
        <Form form={followUpForm} layout="vertical" onFinish={handleCreateFollowUp}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="回访类型"
                name="type"
                initialValue="repair_completed"
                rules={[{ required: true, message: '请选择回访类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="after_sales">售后回访</Option>
                  <Option value="repair_completed">返修完成回访</Option>
                  <Option value="member_care">会员关怀</Option>
                  <Option value="birthday">生日祝福</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="回访渠道"
                name="channel"
                initialValue="phone"
                rules={[{ required: true, message: '请选择回访渠道' }]}
              >
                <Select placeholder="请选择">
                  <Option value="phone">电话</Option>
                  <Option value="wechat">微信</Option>
                  <Option value="sms">短信</Option>
                  <Option value="in_person">上门</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="回访内容"
            name="followUpContent"
            rules={[{ required: true, message: '请输入回访内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入回访内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderDetail;
