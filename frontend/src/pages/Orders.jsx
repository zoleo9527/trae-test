import { useState, useEffect } from 'react';
import {
  Table, Tabs, Button, Modal, Form, Select, Input, InputNumber,
  DatePicker, Space, Descriptions, message, Tag
} from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import StatusTag from '../components/StatusTag';
import ExceptionDrawer from '../components/ExceptionDrawer';
import api from '../api';

const statusTabs = [
  { key: '全部', label: '全部' },
  { key: '待确认', label: '待确认' },
  { key: '已确认', label: '已确认' },
  { key: '起苗中', label: '起苗中' },
  { key: '已完成', label: '已完成' },
  { key: '异常', label: '异常' },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('全部');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [exceptionDrawerOpen, setExceptionDrawerOpen] = useState(false);
  const [currentException, setCurrentException] = useState(null);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionForm] = Form.useForm();
  const [form] = Form.useForm();
  const { user } = useAuth();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== '全部') params.status = activeTab;
      const res = await api.get('/orders', { params });
      setOrders(res.data);
    } catch (err) {
      console.error(err);
      message.error('获取排单列表失败');
    }
    setLoading(false);
  };

  const fetchPlots = async () => {
    try {
      const res = await api.get('/plots');
      setPlots(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    fetchPlots();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      const selectedPlot = plots.find(p => p.id === values.plot_id);
      await api.post('/orders', {
        plot_id: values.plot_id,
        seedling_type: selectedPlot?.seedling_type || '',
        requested_count: values.requested_count,
        requester_id: user?.id,
        assignee_id: values.assignee_id,
        planned_date: values.planned_date?.format('YYYY-MM-DD'),
        remark: values.remark || '',
      });
      message.success('排单创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchOrders();
    } catch (err) {
      if (err.response) {
        console.error(err);
        const errorMsg = err.response.data?.detail || err.response.data?.message || '';
        if (errorMsg.includes('地块已起苗')) {
          message.error('地块已起苗');
        } else if (errorMsg.includes('可用数量不足')) {
          message.error('可用数量不足');
        } else if (errorMsg.includes('已有未完成的排单')) {
          message.error('已有未完成的排单');
        } else {
          message.error('创建排单失败');
        }
      }
    }
    setConfirmLoading(false);
  };

  const handleConfirm = async (id) => {
    try {
      await api.put(`/orders/${id}/confirm`);
      message.success('已确认');
      fetchOrders();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const handleStart = async (id) => {
    try {
      await api.put(`/orders/${id}/start`);
      message.success('已开始起苗');
      fetchOrders();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/orders/${id}/complete`);
      message.success('起苗完成');
      fetchOrders();
    } catch (err) {
      console.error(err);
      message.error('操作失败');
    }
  };

  const handleViewException = async (order) => {
    try {
      const res = await api.get(`/exceptions/by-source?source_type=起苗&source_id=${order.id}`);
      setCurrentException(res.data?.[0] || null);
      setExceptionDrawerOpen(true);
    } catch (err) {
      console.error(err);
      message.error('获取异常信息失败');
    }
  };

  const handlePlotChange = (plotId) => {
    const selectedPlot = plots.find(p => p.id === plotId);
    form.setFieldsValue({ seedling_type: selectedPlot?.seedling_type || '' });
  };

  const handleOpenExceptionReport = (orderId) => {
    exceptionForm.setFieldsValue({
      order_id: orderId,
      exception_type: undefined,
      severity: undefined,
      description: '',
    });
    setExceptionModalOpen(true);
  };

  const handleSubmitException = async () => {
    try {
      const values = await exceptionForm.validateFields();
      setConfirmLoading(true);
      await api.post(`/orders/${values.order_id}/report-exception`, {
        exception_type: values.exception_type,
        severity: values.severity,
        description: values.description,
      });
      message.success('异常上报成功');
      setExceptionModalOpen(false);
      exceptionForm.resetFields();
      fetchOrders();
    } catch (err) {
      if (err.response) {
        console.error(err);
        message.error('异常上报失败');
      }
    }
    setConfirmLoading(false);
  };

  const filteredOrders = activeTab === '全部'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const columns = [
    {
      title: '排单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '地块',
      key: 'plot',
      render: (_, record) => record.plot ? `${record.plot.plot_code} ${record.plot.location || ''}` : '-',
    },
    {
      title: '品种',
      dataIndex: 'seedling_type',
      key: 'seedling_type',
    },
    {
      title: '数量',
      dataIndex: 'requested_count',
      key: 'requested_count',
    },
    {
      title: '申请人',
      key: 'requester',
      render: (_, record) => record.requester?.display_name || '-',
    },
    {
      title: '养护员',
      key: 'assignee',
      render: (_, record) => record.assignee?.display_name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} type="order" />,
    },
    {
      title: '计划日期',
      dataIndex: 'planned_date',
      key: 'planned_date',
      render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === '待确认' && (
            <Button type="link" size="small" onClick={() => handleConfirm(record.id)}>确认</Button>
          )}
          {record.status === '已确认' && (
            <>
              <Button type="link" size="small" onClick={() => handleStart(record.id)}>开始起苗</Button>
              <Button type="link" size="small" danger onClick={() => handleOpenExceptionReport(record.id)}>上报异常</Button>
            </>
          )}
          {record.status === '起苗中' && (
            <>
              <Button type="link" size="small" onClick={() => handleComplete(record.id)}>完成起苗</Button>
              <Button type="link" size="small" danger onClick={() => handleOpenExceptionReport(record.id)}>上报异常</Button>
            </>
          )}
          {record.status === '异常' && (
            <Button type="link" size="small" danger onClick={() => handleViewException(record)}>查看异常</Button>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="排单号">{record.order_no}</Descriptions.Item>
      <Descriptions.Item label="地块">{record.plot?.plot_code} {record.plot?.location}</Descriptions.Item>
      <Descriptions.Item label="品种">{record.seedling_type}</Descriptions.Item>
      <Descriptions.Item label="数量">{record.requested_count}</Descriptions.Item>
      <Descriptions.Item label="申请人">{record.requester?.display_name}</Descriptions.Item>
      <Descriptions.Item label="养护员">{record.assignee?.display_name}</Descriptions.Item>
      <Descriptions.Item label="状态"><StatusTag status={record.status} type="order" /></Descriptions.Item>
      <Descriptions.Item label="计划日期">{record.planned_date ? dayjs(record.planned_date).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
      <Descriptions.Item label="备注" span={2}>{record.remark || '-'}</Descriptions.Item>
      {record.completed_at && (
        <Descriptions.Item label="完成时间" span={2}>{dayjs(record.completed_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      )}
    </Descriptions>
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={statusTabs}
          style={{ marginBottom: 0 }}
        />
        <Button type="primary" onClick={() => setModalOpen(true)}>新建排单</Button>
      </div>

      <Table
        dataSource={filteredOrders}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建排单"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        confirmLoading={confirmLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="plot_id" label="地块选择" rules={[{ required: true, message: '请选择地块' }]}>
            <Select placeholder="请选择地块" onChange={handlePlotChange}>
              {plots.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.plot_code} - {p.seedling_type}（可用{p.available_count}棵）</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="seedling_type" label="苗木品种">
            <Input disabled />
          </Form.Item>
          <Form.Item name="requested_count" label="需求数量" rules={[{ required: true, message: '请输入需求数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="assignee_id" label="指派养护员" rules={[{ required: true, message: '请选择养护员' }]}>
            <Select placeholder="请选择养护员">
              <Select.Option value={2}>李养护</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="planned_date" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常上报"
        open={exceptionModalOpen}
        onOk={handleSubmitException}
        onCancel={() => { setExceptionModalOpen(false); exceptionForm.resetFields(); }}
        confirmLoading={confirmLoading}
      >
        <Form form={exceptionForm} layout="vertical">
          <Form.Item name="order_id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="exception_type" label="异常类型" rules={[{ required: true, message: '请选择异常类型' }]}>
            <Select placeholder="请选择异常类型">
              <Select.Option value="病害">病害</Select.Option>
              <Select.Option value="质量问题">质量问题</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="严重程度" rules={[{ required: true, message: '请选择严重程度' }]}>
            <Select placeholder="请选择严重程度">
              <Select.Option value="一般">一般</Select.Option>
              <Select.Option value="严重">严重</Select.Option>
              <Select.Option value="紧急">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="异常描述" rules={[{ required: true, message: '请输入异常描述' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述异常情况" />
          </Form.Item>
        </Form>
      </Modal>

      <ExceptionDrawer
        open={exceptionDrawerOpen}
        onClose={() => setExceptionDrawerOpen(false)}
        record={currentException}
        onRefresh={fetchOrders}
      />
    </div>
  );
}
