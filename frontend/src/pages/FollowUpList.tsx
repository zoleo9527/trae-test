import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  Input,
  message,
  Card,
  Rate,
} from 'antd';
import { PhoneOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { followUpAPI, memberAPI } from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

interface FollowUp {
  id: string;
  followUpNo: string;
  type: string;
  channel: string;
  status: string;
  result?: string;
  member: { realName: string; phone: string };
  followUpContent: string;
  plannedAt: string;
  assignee?: { realName: string };
}

const FollowUpList: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [currentFollowUp, setCurrentFollowUp] = useState<FollowUp | null>(null);
  const [form] = Form.useForm();

  const canCompleteFollowUp = () => {
    if (!user) return false;
    return ['customer_service', 'manager', 'admin'].includes(user.role);
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await followUpAPI.getList({
        page,
        limit: pageSize,
        ...filters,
      });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      after_sales: '售后回访',
      repair_completed: '返修完成',
      birthday: '生日祝福',
      member_care: '会员关怀',
      complaint: '投诉处理',
      other: '其他',
    };
    return typeMap[type] || type;
  };

  const getChannelText = (channel: string) => {
    const channelMap: Record<string, string> = {
      phone: '电话',
      wechat: '微信',
      sms: '短信',
      email: '邮件',
      in_person: '上门',
    };
    return channelMap[channel] || channel;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待回访' },
      in_progress: { color: 'processing', text: '回访中' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getResultText = (result: string) => {
    const resultMap: Record<string, string> = {
      satisfied: '满意',
      partially_satisfied: '一般',
      dissatisfied: '不满意',
      no_answer: '无人接听',
      call_back_later: '稍后再拨',
    };
    return resultMap[result] || result;
  };

  const handleComplete = async (values: any) => {
    if (!currentFollowUp) return;
    try {
      await followUpAPI.complete(currentFollowUp.id, values);
      message.success('回访完成');
      setCompleteModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const openCompleteModal = (record: FollowUp) => {
    setCurrentFollowUp(record);
    setCompleteModalVisible(true);
  };

  const columns = [
    {
      title: '回访编号',
      dataIndex: 'followUpNo',
      key: 'followUpNo',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeText(type),
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => getChannelText(channel),
    },
    {
      title: '会员',
      dataIndex: ['member', 'realName'],
      key: 'member',
    },
    {
      title: '联系电话',
      dataIndex: ['member', 'phone'],
      key: 'phone',
    },
    {
      title: '回访内容',
      dataIndex: 'followUpContent',
      key: 'followUpContent',
      ellipsis: true,
    },
    {
      title: '计划时间',
      dataIndex: 'plannedAt',
      key: 'plannedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => result ? getResultText(result) : '-',
    },
    {
      title: '负责人',
      dataIndex: ['assignee', 'realName'],
      key: 'assignee',
      render: (name: string) => name || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FollowUp) => (
        <Space>
          {record.status === 'pending' && canCompleteFollowUp() && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openCompleteModal(record)}
            >
              完成回访
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>回访管理</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Option value="pending">待回访</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Select
            placeholder="类型筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, type: value || '' })}
          >
            <Option value="after_sales">售后回访</Option>
            <Option value="repair_completed">返修完成</Option>
            <Option value="member_care">会员关怀</Option>
            <Option value="birthday">生日祝福</Option>
          </Select>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="完成回访"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleComplete}>
          <Form.Item
            label="客户满意度"
            name="result"
            rules={[{ required: true, message: '请选择回访结果' }]}
          >
            <Select placeholder="请选择">
              <Option value="satisfied">满意</Option>
              <Option value="partially_satisfied">一般</Option>
              <Option value="dissatisfied">不满意</Option>
              <Option value="no_answer">无人接听</Option>
              <Option value="call_back_later">稍后再拨</Option>
            </Select>
          </Form.Item>
          <Form.Item label="客户反馈" name="customerFeedback">
            <TextArea rows={4} placeholder="请记录客户反馈内容" />
          </Form.Item>
          <Form.Item label="内部备注" name="internalNote">
            <TextArea rows={2} placeholder="内部备注信息" />
          </Form.Item>
          <Form.Item label="是否需要升级处理" name="needsEscalation" valuePropName="checked">
            <Select>
              <Option value={false}>否</Option>
              <Option value={true}>是</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FollowUpList;
