import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Modal,
  Form,
  message,
  Card,
  Tabs,
  Badge,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { workOrderApi } from '../services/api';
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderStatusLabels,
  AbnormalType,
  AbnormalTypeLabels,
  UserRole,
  RoleLabels,
} from '../types/index';
import { useRole } from '../contexts/RoleContext';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const statusColors: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.ABNORMAL_REPORTED]: 'red',
  [WorkOrderStatus.DOWNTIME_CONFIRMED]: 'orange',
  [WorkOrderStatus.PART_REQUESTED]: 'gold',
  [WorkOrderStatus.PART_APPROVED]: 'cyan',
  [WorkOrderStatus.PART_RECEIVED]: 'blue',
  [WorkOrderStatus.REPAIR_COMPLETED]: 'geekblue',
  [WorkOrderStatus.REVIEW_SUBMITTED]: 'purple',
  [WorkOrderStatus.CLOSED]: 'green',
};

const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentRole, setCurrentRole, roleTodoStatuses, getActionLabel } = useRole();
  const [data, setData] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'all' | 'todo'>('todo');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setFilters({ ...filters, status: statusFromUrl });
      setActiveTab('all');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters, activeTab, roleTodoStatuses]);

  const loadData = async () => {
    setLoading(true);
    try {
      const queryFilters: any = { ...filters };

      if (activeTab === 'todo') {
        if (filters.status) {
          queryFilters.statuses = roleTodoStatuses.includes(filters.status) 
            ? [filters.status] 
            : roleTodoStatuses;
          delete queryFilters.status;
        } else {
          queryFilters.statuses = roleTodoStatuses;
        }
      }

      const res = await workOrderApi.getList({
        page,
        limit: pageSize,
        ...queryFilters,
      });
      setData(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
    setSearchParams({});
  };

  const handleCreate = async (values: any) => {
    try {
      await workOrderApi.create(values);
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('创建失败:', error);
      message.error('创建失败');
    }
  };

  const handleExport = async () => {
    try {
      const queryFilters: any = { ...filters };
      
      if (activeTab === 'todo') {
        if (filters.status) {
          queryFilters.statuses = roleTodoStatuses.includes(filters.status) 
            ? [filters.status] 
            : roleTodoStatuses;
          delete queryFilters.status;
        } else {
          queryFilters.statuses = roleTodoStatuses;
        }
      }
      
      const res = await workOrderApi.export(queryFilters);
      message.success(`导出成功，文件路径: ${res.data.filePath}`);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    }
  };

  const todoCount = useMemo(() => {
    return data.filter((order) => roleTodoStatuses.includes(order.status)).length;
  }, [data, roleTodoStatuses]);

  const columns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 150,
      fixed: 'left',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '异常类型',
      dataIndex: 'abnormalType',
      key: 'abnormalType',
      width: 120,
      render: (type: string) => AbnormalTypeLabels[type as any] || type,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: WorkOrderStatus) => (
        <Tag color={statusColors[status]}>
          {WorkOrderStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '电站',
      dataIndex: 'station',
      key: 'station',
      width: 100,
    },
    {
      title: '停机时长',
      dataIndex: 'totalDowntimeMinutes',
      key: 'totalDowntimeMinutes',
      width: 100,
      sorter: (a: WorkOrder, b: WorkOrder) => (a.totalDowntimeMinutes || 0) - (b.totalDowntimeMinutes || 0),
      render: (minutes?: number) => minutes ? `${minutes}分钟` : '-',
    },
    {
      title: '发电量损失',
      dataIndex: 'powerLoss',
      key: 'powerLoss',
      width: 120,
      render: (loss?: number) => loss ? `${loss}kWh` : '-',
    },
    {
      title: '上报人',
      dataIndex: 'reporter',
      key: 'reporter',
      width: 100,
      render: (reporter: any) => reporter?.name || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '待办动作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: WorkOrder) => {
        const isTodo = roleTodoStatuses.includes(record.status);
        return (
          <Space>
            <Button type="link" size="small" onClick={() => navigate(`/work-orders/${record.id}`)}>
              详情
            </Button>
            {record.status !== WorkOrderStatus.CLOSED && (
              <Button
                type={isTodo ? 'primary' : 'default'}
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => navigate(`/work-orders/${record.id}`)}
              >
                {isTodo ? getActionLabel(record.status) : '查看'}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: 'todo',
      label: (
        <Space>
          我的待办
          <Badge count={total} size="small" />
        </Space>
      ),
    },
    {
      key: 'all',
      label: '全部工单',
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="center">
              <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
              <Text strong>当前视角：</Text>
              <Select
                value={currentRole}
                onChange={(value) => {
                  setCurrentRole(value);
                  setPage(1);
                }}
                style={{ width: 160 }}
              >
                <Option value={UserRole.STATION_MASTER}>{RoleLabels[UserRole.STATION_MASTER]}</Option>
                <Option value={UserRole.INSPECTION_ENGINEER}>{RoleLabels[UserRole.INSPECTION_ENGINEER]}</Option>
                <Option value={UserRole.OPERATION_STAFF}>{RoleLabels[UserRole.OPERATION_STAFF]}</Option>
                <Option value={UserRole.ADMIN}>{RoleLabels[UserRole.ADMIN]}</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Text type="secondary">待办状态：</Text>
              {roleTodoStatuses.map((status) => (
                <Tag key={status} color={statusColors[status]}>
                  {WorkOrderStatusLabels[status]}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="关键词">
                <Input
                  placeholder="搜索工单号、标题"
                  prefix={<SearchOutlined />}
                  onPressEnter={handleSearch}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="状态">
                <Select
                  placeholder={activeTab === 'todo' ? '筛选待办状态' : '选择状态'}
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.status || undefined}
                  onChange={(value) => setFilters({ ...filters, status: value })}
                >
                  {(activeTab === 'todo'
                    ? roleTodoStatuses.map((status) => ({
                        value: status,
                        label: WorkOrderStatusLabels[status],
                      }))
                    : Object.entries(WorkOrderStatusLabels).map(([value, label]) => ({
                        value,
                        label,
                      }))
                  ).map(({ value, label }) => (
                    <Option key={value} value={value}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="异常类型">
                <Select
                  placeholder="选择异常类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.abnormalType || undefined}
                  onChange={(value) => setFilters({ ...filters, abnormalType: value })}
                >
                  {Object.entries(AbnormalTypeLabels).map(([value, label]) => (
                    <Option key={value} value={value}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item label="电站">
                <Select
                  placeholder="选择电站"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.station || undefined}
                  onChange={(value) => setFilters({ ...filters, station: value })}
                >
                  <Option value="光伏A站">光伏A站</Option>
                  <Option value="光伏B站">光伏B站</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={3}>
              <Space>
                <Button type="primary" onClick={handleSearch}>查询</Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key as 'all' | 'todo');
              setPage(1);
            }}
            items={tabItems}
          />
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              新建工单
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>

      <Modal
        title="新建工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item
            name="abnormalType"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select placeholder="请选择异常类型">
              {Object.entries(AbnormalTypeLabels).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="station"
            label="电站"
            rules={[{ required: true, message: '请选择电站' }]}
          >
            <Select placeholder="请选择电站">
              <Option value="光伏A站">光伏A站</Option>
              <Option value="光伏B站">光伏B站</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="equipmentNo"
            label="设备编号"
          >
            <Input placeholder="请输入设备编号" />
          </Form.Item>
          <Form.Item
            name="description"
            label="异常描述"
          >
            <Input.TextArea rows={4} placeholder="请描述异常情况" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderList;
