import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  message,
  Card,
  Drawer,
  Descriptions,
  List,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { memberAPI } from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;

interface Member {
  id: string;
  memberNo: string;
  realName: string;
  phone: string;
  gender?: string;
  birthday?: string;
  level: string;
  totalConsumption: number;
  points: number;
  remark?: string;
  workOrders?: any[];
  followUps?: any[];
}

const MemberList: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, keyword, levelFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await memberAPI.getList({
        page,
        limit: pageSize,
        keyword,
        level: levelFilter,
      });
      setData(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getLevelTag = (level: string) => {
    const levelMap: Record<string, { color: string; text: string }> = {
      normal: { color: 'default', text: '普通' },
      silver: { color: 'blue', text: '银卡' },
      gold: { color: 'gold', text: '金卡' },
      platinum: { color: 'purple', text: '铂金' },
      diamond: { color: 'cyan', text: '钻石' },
    };
    const info = levelMap[level] || { color: 'default', text: level };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleCreate = async (values: any) => {
    try {
      await memberAPI.create({
        ...values,
        birthday: values.birthday ? values.birthday.format('YYYY-MM-DD') : undefined,
      });
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const viewDetail = async (record: Member) => {
    try {
      const res = await memberAPI.getById(record.id);
      setCurrentMember(res.data);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const columns = [
    {
      title: '会员编号',
      dataIndex: 'memberNo',
      key: 'memberNo',
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => gender || '-',
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => getLevelTag(level),
    },
    {
      title: '累计消费',
      dataIndex: 'totalConsumption',
      key: 'totalConsumption',
      render: (amount: number) => `¥${amount?.toFixed(2) || 0}`,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>会员管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
          新增会员
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索会员（姓名/手机号/编号）"
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
          />
          <Select
            placeholder="等级筛选"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setLevelFilter(value || '')}
          >
            <Option value="normal">普通</Option>
            <Option value="silver">银卡</Option>
            <Option value="gold">金卡</Option>
            <Option value="platinum">铂金</Option>
            <Option value="diamond">钻石</Option>
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
        title="新增会员"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="姓名"
            name="realName"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            label="手机号"
            name="phone"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="性别" name="gender">
            <Select placeholder="请选择">
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item label="生日" name="birthday">
            <DatePicker style={{ width: '100%' }} placeholder="选择生日" />
          </Form.Item>
          <Form.Item label="会员等级" name="level" initialValue="normal">
            <Select placeholder="请选择">
              <Option value="normal">普通</Option>
              <Option value="silver">银卡</Option>
              <Option value="gold">金卡</Option>
              <Option value="platinum">铂金</Option>
              <Option value="diamond">钻石</Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="会员详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentMember && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="会员编号">{currentMember.memberNo}</Descriptions.Item>
              <Descriptions.Item label="姓名">{currentMember.realName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentMember.phone}</Descriptions.Item>
              <Descriptions.Item label="性别">{currentMember.gender || '-'}</Descriptions.Item>
              <Descriptions.Item label="生日">
                {currentMember.birthday ? dayjs(currentMember.birthday).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="会员等级">{getLevelTag(currentMember.level)}</Descriptions.Item>
              <Descriptions.Item label="累计消费">¥{currentMember.totalConsumption?.toFixed(2) || 0}</Descriptions.Item>
              <Descriptions.Item label="积分">{currentMember.points || 0}</Descriptions.Item>
              <Descriptions.Item label="备注">{currentMember.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 24, marginBottom: 16 }}>工单记录</h4>
            <List
              dataSource={currentMember.workOrders || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.orderNo}
                    description={`${item.type} - ${item.status} - ${dayjs(item.createdAt).format('YYYY-MM-DD')}`}
                  />
                </List.Item>
              )}
            />

            <h4 style={{ marginTop: 24, marginBottom: 16 }}>回访记录</h4>
            <List
              dataSource={currentMember.followUps || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.followUpNo}
                    description={`${item.type} - ${item.status} - ${dayjs(item.plannedAt).format('YYYY-MM-DD')}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MemberList;
