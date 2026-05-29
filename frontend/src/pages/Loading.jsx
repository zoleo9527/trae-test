import { useState, useEffect } from 'react';
import {
  Table, Tabs, Button, Modal, Form, Select, Input,
  InputNumber, Space, Descriptions, message, Tag
} from 'antd';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import StatusTag from '../components/StatusTag';
import ExceptionDrawer from '../components/ExceptionDrawer';
import api from '../api';

const statusTabs = [
  { key: '全部', label: '全部' },
  { key: '待装车', label: '待装车' },
  { key: '装车中', label: '装车中' },
  { key: '已复核', label: '已复核' },
  { key: '异常', label: '异常' },
];

export default function Loading() {
  const [loadingList, setLoadingList] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('全部');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fillModalOpen, setFillModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [exceptionDrawerOpen, setExceptionDrawerOpen] = useState(false);
  const [currentException, setCurrentException] = useState(null);
  const [createForm] = Form.useForm();
  const [fillForm] = Form.useForm();
  const { user } = useAuth();

  const fetchLoadingList = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== '全部') params.status = activeTab;
      const res = await api.get('/loading', { params });
      setLoadingList(res.data);
    } catch (err) {
      console.error(err);
      message.error('获取装车记录失败');
    }
    setLoading(false);
  };

  const fetchCompletedOrders = async () => {
    try {
      const res = await api.get('/orders', { params: { status: '已完成' } });
      setCompletedOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLoadingList();
  }, [activeTab]);

  useEffect(() => {
    fetchCompletedOrders();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setConfirmLoading(true);
      const selectedOrder = completedOrders.find(o => o.id === values.order_id);
      await api.post('/loading', {
        order_id: values.order_id,
        checker_id: user?.id,
        planned_qty: selectedOrder?.requested_count || values.planned_qty,
        vehicle_no: values.vehicle_no || '',
        driver_name: values.driver_name || '',
        remark: values.remark || '',
      });
      message.success('装车记录创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchLoadingList();
    } catch (err) {
      if (err.response) {
        console.error(err);
        message.error('创建装车记录失败');
      }
    }
    setConfirmLoading(false);
  };

  const handleOrderChange = (orderId) => {
    const selectedOrder = completedOrders.find(o => o.id === orderId);
    createForm.setFieldsValue({ planned_qty: selectedOrder?.requested_count || 0 });
  };

  const handleOpenFill = (record) => {
    setCurrentRecord(record);
    fillForm.setFieldsValue({
      actual_qty: record.actual_qty,
      vehicle_no: record.vehicle_no,
      driver_name: record.driver_name,
    });
    setFillModalOpen(true);
  };

  const handleFillSubmit = async () => {
    try {
      const values = await fillForm.validateFields();
      await api.put(`/loading/${currentRecord.id}`, {
        actual_qty: values.actual_qty,
        vehicle_no: values.vehicle_no,
        driver_name: values.driver_name,
      });
      message.success('已填写实装数量');
      setFillModalOpen(false);
      fillForm.resetFields();
      fetchLoadingList();
    } catch (err) {
      if (err.response) {
        console.error(err);
        message.error('更新失败');
      }
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/loading/${id}/verify`);
      message.success('复核确认成功');
      fetchLoadingList();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      message.error(detail || '复核确认失败');
    }
  };

  const handleViewException = async (record) => {
    try {
      const res = await api.get('/exceptions', {
        params: { source_type: '装车', source_id: record.id },
      });
      setCurrentException(res.data?.[0] || null);
      setExceptionDrawerOpen(true);
    } catch (err) {
      console.error(err);
      message.error('获取异常信息失败');
    }
  };

  const filteredList = activeTab === '全部'
    ? loadingList
    : loadingList.filter(item => item.status === activeTab);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '关联排单',
      key: 'order_no',
      render: (_, record) => record.order ? (
        <Tag color="blue">{record.order.order_no}</Tag>
      ) : `#${record.order_id}`,
    },
    {
      title: '品种',
      key: 'seedling_type',
      render: (_, record) => record.order?.seedling_type || '-',
    },
    {
      title: '计划数量',
      dataIndex: 'planned_qty',
      key: 'planned_qty',
    },
    {
      title: '实际数量',
      dataIndex: 'actual_qty',
      key: 'actual_qty',
      render: (v, record) => {
        if (v == null) return <span style={{ color: '#999' }}>未填</span>;
        const diff = v - record.planned_qty;
        if (diff !== 0) {
          return <span style={{ color: diff > 0 ? '#52c41a' : '#f5222d' }}>{v}（{diff > 0 ? '+' : ''}{diff}）</span>;
        }
        return v;
      },
    },
    {
      title: '车牌号',
      dataIndex: 'vehicle_no',
      key: 'vehicle_no',
      render: (v) => v || '-',
    },
    {
      title: '司机',
      dataIndex: 'driver_name',
      key: 'driver_name',
      render: (v) => v || '-',
    },
    {
      title: '复核人',
      key: 'checker',
      render: (_, record) => record.checker?.display_name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} type="loading" />,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === '待装车' && (
            <>
              <Button type="link" size="small" onClick={() => handleOpenFill(record)}>填写实装</Button>
              <Button type="link" size="small" onClick={() => handleVerify(record.id)} disabled={!record.actual_qty}>
                复核确认
              </Button>
            </>
          )}
          {record.status === '装车中' && (
            <Button type="link" size="small" onClick={() => handleVerify(record.id)}>复核确认</Button>
          )}
          {record.status === '异常' && (
            <Button type="link" size="small" danger onClick={() => handleViewException(record)}>查看异常</Button>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => {
    const diff = record.actual_qty != null ? record.actual_qty - record.planned_qty : null;
    return (
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
        <Descriptions.Item label="关联排单">{record.order?.order_no || record.order_id}</Descriptions.Item>
        <Descriptions.Item label="品种">{record.order?.seedling_type || '-'}</Descriptions.Item>
        <Descriptions.Item label="地块">{record.order?.plot?.plot_code || '-'} {record.order?.plot?.location || ''}</Descriptions.Item>
        <Descriptions.Item label="计划数量">{record.planned_qty}</Descriptions.Item>
        <Descriptions.Item label="实际数量">{record.actual_qty ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="差异说明" span={2}>
          {diff != null && diff !== 0 ? (
            <span style={{ color: '#f5222d', fontWeight: 500 }}>
              实际与计划差 {diff > 0 ? '+' : ''}{diff} 株
            </span>
          ) : diff === 0 ? (
            <span style={{ color: '#52c41a' }}>无差异</span>
          ) : '尚未填写实装数量'}
        </Descriptions.Item>
        <Descriptions.Item label="车牌号">{record.vehicle_no || '-'}</Descriptions.Item>
        <Descriptions.Item label="司机">{record.driver_name || '-'}</Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>{record.remark || '-'}</Descriptions.Item>
        {record.loaded_at && (
          <Descriptions.Item label="装车时间" span={2}>{dayjs(record.loaded_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        )}
      </Descriptions>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={statusTabs}
          style={{ marginBottom: 0 }}
        />
        <Button type="primary" onClick={() => setCreateModalOpen(true)}>新建装车记录</Button>
      </div>

      <Table
        dataSource={filteredList}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建装车记录"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); createForm.resetFields(); }}
        confirmLoading={confirmLoading}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="order_id" label="关联排单" rules={[{ required: true, message: '请选择关联排单' }]}>
            <Select placeholder="请选择已完成排单" onChange={handleOrderChange}>
              {completedOrders.map(o => (
                <Select.Option key={o.id} value={o.id}>
                  {o.order_no} - {o.seedling_type} x{o.requested_count}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="planned_qty" label="计划数量">
            <InputNumber disabled style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vehicle_no" label="车牌号">
            <Input placeholder="如：沪A12345" />
          </Form.Item>
          <Form.Item name="driver_name" label="司机姓名">
            <Input placeholder="请输入司机姓名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="填写实装信息"
        open={fillModalOpen}
        onOk={handleFillSubmit}
        onCancel={() => { setFillModalOpen(false); fillForm.resetFields(); }}
      >
        <Form form={fillForm} layout="vertical">
          <Form.Item name="actual_qty" label="实际数量" rules={[{ required: true, message: '请输入实际数量' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入实际装车数量" />
          </Form.Item>
          <Form.Item name="vehicle_no" label="车牌号">
            <Input placeholder="如：沪A12345" />
          </Form.Item>
          <Form.Item name="driver_name" label="司机姓名">
            <Input placeholder="请输入司机姓名" />
          </Form.Item>
        </Form>
      </Modal>

      <ExceptionDrawer
        open={exceptionDrawerOpen}
        onClose={() => setExceptionDrawerOpen(false)}
        record={currentException}
        onRefresh={fetchLoadingList}
      />
    </div>
  );
}
