import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Form,
  Modal,
  Card,
  message,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { workOrderAPI, memberAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

interface WorkOrder {
  id: string;
  orderNo: string;
  type: string;
  status: string;
  priority: string;
  member: { realName: string; phone: string };
  problemDescription: string;
  createdAt: string;
  handler?: { realName: string };
}

const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await workOrderAPI.getList({
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

  const searchMember = async (keyword: string) => {
    if (keyword.length >= 1) {
      try {
        const res = await memberAPI.getList({ keyword });
        setMembers(res.data.data || []);
      } catch (error) {
        console.error('Search member failed:', error);
      }
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await workOrderAPI.create({
        ...values,
        items: values.items || [],
      });
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
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

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text: string, record: WorkOrder) => (
        <a onClick={() => navigate(`/work-orders/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          repair: '返修',
          custom: '定制',
          transfer: '调货',
          return: '退货',
          exchange: '换货',
          cleaning: '清洗保养',
        };
        return typeMap[type] || type;
      },
      filters: [
        { text: '返修', value: 'repair' },
        { text: '定制', value: 'custom' },
        { text: '调货', value: 'transfer' },
      ],
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '处理人',
      dataIndex: ['handler', 'realName'],
      key: 'handler',
      render: (name: string) => name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkOrder) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/work-orders/${record.id}`)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>工单管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          新建工单
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
          >
            <Option value="pending_review">待审核</Option>
            <Option value="in_progress">处理中</Option>
            <Option value="needs_review">需复核</Option>
            <Option value="rejected">已驳回</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select
            placeholder="类型筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, type: value || '' })}
          >
            <Option value="repair">返修</Option>
            <Option value="custom">定制</Option>
            <Option value="transfer">调货</Option>
            <Option value="cleaning">清洗保养</Option>
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
        title="新建工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="工单类型"
                name="type"
                rules={[{ required: true, message: '请选择工单类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="repair">返修</Option>
                  <Option value="custom">定制</Option>
                  <Option value="transfer">调货</Option>
                  <Option value="cleaning">清洗保养</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                initialValue="normal"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择">
                  <Option value="low">低</Option>
                  <Option value="normal">普通</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="会员"
            name="memberId"
            rules={[{ required: true, message: '请选择或搜索会员' }]}
          >
            <Select
              placeholder="搜索会员（姓名/手机号）"
              showSearch
              filterOption={false}
              onSearch={searchMember}
              style={{ width: '100%' }}
            >
              {members.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.realName} - {m.phone}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="问题描述"
            name="problemDescription"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述问题情况" />
          </Form.Item>
          <Form.Item label="客户要求" name="customerRequirement">
            <Input.TextArea rows={3} placeholder="客户特殊要求" />
          </Form.Item>
          <Form.Item label="内部备注" name="internalNote">
            <Input.TextArea rows={2} placeholder="内部备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderList;
