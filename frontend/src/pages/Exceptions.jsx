import { useState, useEffect } from 'react';
import {
  Table, Select, Button, Space, Card, Row, Col, Descriptions, message, Badge
} from 'antd';
import dayjs from 'dayjs';
import StatusTag from '../components/StatusTag';
import ExceptionDrawer from '../components/ExceptionDrawer';
import api from '../api';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '待处理', label: '待处理' },
  { value: '处理中', label: '处理中' },
  { value: '已关闭', label: '已关闭' },
];

const severityOptions = [
  { value: '', label: '全部严重程度' },
  { value: '一般', label: '一般' },
  { value: '严重', label: '严重' },
  { value: '紧急', label: '紧急' },
];

const sourceTypeOptions = [
  { value: '', label: '全部来源' },
  { value: '起苗', label: '起苗' },
  { value: '装车', label: '装车' },
  { value: '养护', label: '养护' },
];

export default function Exceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterSourceType, setFilterSourceType] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentException, setCurrentException] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, closed: 0 });

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterSeverity) params.severity = filterSeverity;
      if (filterSourceType) params.source_type = filterSourceType;
      const res = await api.get('/exceptions', { params });
      setExceptions(res.data);
      const total = res.data.length;
      const pending = res.data.filter(e => e.status === '待处理').length;
      const processing = res.data.filter(e => e.status === '处理中').length;
      const closed = res.data.filter(e => e.status === '已关闭').length;
      setStats({ total, pending, processing, closed });
    } catch (err) {
      console.error(err);
      message.error('获取异常列表失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExceptions();
  }, [filterStatus, filterSeverity, filterSourceType]);

  const handleAction = (record) => {
    setCurrentException(record);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '来源',
      key: 'source',
      width: 100,
      render: (_, record) => `${record.source_type} #${record.source_id}`,
    },
    {
      title: '异常类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      width: 100,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => <StatusTag type="severity" status={severity} />,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '处理人',
      key: 'handler',
      width: 80,
      render: (_, record) => record.handler?.display_name || <span style={{ color: '#999' }}>未指派</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => <StatusTag type="exception" status={status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (v) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          {record.status === '待处理' && (
            <Button type="link" size="small" onClick={() => handleAction(record)}>处理</Button>
          )}
          {record.status === '处理中' && (
            <Button type="link" size="small" onClick={() => handleAction(record)}>继续处理</Button>
          )}
          {record.status === '已关闭' && (
            <Button type="link" size="small" onClick={() => handleAction(record)}>查看</Button>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="来源">{record.source_type} #{record.source_id}</Descriptions.Item>
      <Descriptions.Item label="异常类型">{record.exception_type}</Descriptions.Item>
      <Descriptions.Item label="严重程度"><StatusTag type="severity" status={record.severity} /></Descriptions.Item>
      <Descriptions.Item label="状态"><StatusTag type="exception" status={record.status} /></Descriptions.Item>
      <Descriptions.Item label="完整描述" span={2}>{record.description}</Descriptions.Item>
      <Descriptions.Item label="处理方案" span={2}>{record.resolution || <span style={{ color: '#999' }}>暂无</span>}</Descriptions.Item>
      <Descriptions.Item label="处理人">{record.handler?.display_name || '未指派'}</Descriptions.Item>
      <Descriptions.Item label="创建时间">{record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
      {record.handled_at && (
        <Descriptions.Item label="处理时间">{dayjs(record.handled_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      )}
      {record.closed_at && (
        <Descriptions.Item label="关闭时间">{dayjs(record.closed_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
      )}
    </Descriptions>
  );

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>总数</span>
              <Badge count={stats.total} showZero color="blue" style={{ marginLeft: 8 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#f5222d' }}>待处理</span>
              <Badge count={stats.pending} showZero color="#f5222d" style={{ marginLeft: 8 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fa8c16' }}>处理中</span>
              <Badge count={stats.processing} showZero color="#fa8c16" style={{ marginLeft: 8 }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#52c41a' }}>已关闭</span>
              <Badge count={stats.closed} showZero color="#52c41a" style={{ marginLeft: 8 }} />
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
          style={{ width: 150 }}
        />
        <Select
          value={filterSeverity}
          onChange={setFilterSeverity}
          options={severityOptions}
          style={{ width: 150 }}
        />
        <Select
          value={filterSourceType}
          onChange={setFilterSourceType}
          options={sourceTypeOptions}
          style={{ width: 150 }}
        />
      </div>

      <Table
        dataSource={exceptions}
        columns={columns}
        rowKey="id"
        loading={loading}
        expandable={{ expandedRowRender }}
        pagination={{ pageSize: 10 }}
      />

      <ExceptionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={currentException}
        onRefresh={fetchExceptions}
      />
    </div>
  );
}
