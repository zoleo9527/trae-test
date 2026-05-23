import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Timeline, Button, Space, Tabs, Table, message, Divider, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, ThunderboltOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { workOrderApi } from '../services/api';
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderStatusLabels,
  AbnormalTypeLabels,
  PartUsage,
  PartRequestStatus,
  PartRequestStatusLabels,
  ReviewLevelLabels,
} from '../types';

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

const partStatusColors: Record<PartRequestStatus, string> = {
  [PartRequestStatus.PENDING]: 'gold',
  [PartRequestStatus.APPROVED]: 'green',
  [PartRequestStatus.REJECTED]: 'red',
  [PartRequestStatus.RECEIVED]: 'blue',
};

const WorkOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await workOrderApi.getDetail(id!);
      setWorkOrder(res.data);
    } catch (error) {
      console.error('加载详情失败:', error);
      message.error('加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const downtimeColumns = [
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (date?: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '时长(分钟)',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      render: (minutes?: number) => minutes || '-',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason?: string) => reason || '-',
    },
    {
      title: '状态',
      dataIndex: 'isConfirmed',
      key: 'isConfirmed',
      render: (confirmed: boolean) => (
        <Tag color={confirmed ? 'green' : 'orange'}>
          {confirmed ? '已确认' : '待确认'}
        </Tag>
      ),
    },
    {
      title: '确认人',
      dataIndex: 'confirmedBy',
      key: 'confirmedBy',
      render: (user: any) => user?.name || '-',
    },
  ];

  const partColumns = [
    {
      title: '备件编码',
      dataIndex: ['sparePart', 'partCode'],
      key: 'partCode',
    },
    {
      title: '备件名称',
      dataIndex: ['sparePart', 'name'],
      key: 'name',
    },
    {
      title: '规格型号',
      dataIndex: ['sparePart', 'specification'],
      key: 'specification',
      render: (spec?: string) => spec || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price?: number) => price ? `¥${price}` : '-',
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price?: number) => price ? `¥${price}` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PartRequestStatus) => (
        <Tag color={partStatusColors[status]}>
          {PartRequestStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '申请人',
      dataIndex: ['requestedBy', 'name'],
      key: 'requestedBy',
      render: (name?: string) => name || '-',
    },
    {
      title: '审批人',
      dataIndex: ['approvedBy', 'name'],
      key: 'approvedBy',
      render: (name?: string) => name || '-',
    },
  ];

  const reviewColumns = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => ReviewLevelLabels[level as any] || level,
    },
    {
      title: '根本原因',
      dataIndex: 'rootCause',
      key: 'rootCause',
      render: (text?: string) => text || '-',
    },
    {
      title: '实际停机(分钟)',
      dataIndex: 'actualDowntimeMinutes',
      key: 'actualDowntimeMinutes',
    },
    {
      title: '备件成本',
      dataIndex: 'actualPartCost',
      key: 'actualPartCost',
      render: (cost?: number) => cost ? `¥${cost}` : '-',
    },
    {
      title: '人工成本',
      dataIndex: 'actualLaborCost',
      key: 'actualLaborCost',
      render: (cost?: number) => cost ? `¥${cost}` : '-',
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost?: number) => cost ? `¥${cost}` : '-',
    },
    {
      title: '提交人',
      dataIndex: ['submittedBy', 'name'],
      key: 'submittedBy',
      render: (name?: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (verified: boolean) => (
        <Tag color={verified ? 'green' : 'orange'}>
          {verified ? '已验证' : '待验证'}
        </Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'downtime',
      label: '停机记录',
      children: (
        <Table
          columns={downtimeColumns}
          dataSource={workOrder?.downtimeRecords || []}
          rowKey="id"
          pagination={false}
        />
      ),
    },
    {
      key: 'parts',
      label: '备件领用',
      children: (
        <Table
          columns={partColumns}
          dataSource={workOrder?.partUsages || []}
          rowKey="id"
          pagination={false}
        />
      ),
    },
    {
      key: 'review',
      label: '复盘记录',
      children: (
        <Table
          columns={reviewColumns}
          dataSource={workOrder?.reviewRecords || []}
          rowKey="id"
          pagination={false}
        />
      ),
    },
    {
      key: 'timeline',
      label: '状态流转',
      children: (
        <div style={{ padding: '24px 0' }}>
          <Timeline
            items={workOrder?.statusHistories?.slice().reverse().map((history) => ({
              color: statusColors[history.toStatus],
              children: (
                <div>
                  <div style={{ fontWeight: 'bold' }}>
                    {WorkOrderStatusLabels[history.toStatus]}
                  </div>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    {history.remark}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {history.operatedBy?.name || '系统'} · {dayjs(history.operatedAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              ),
            })) || []}
          />
        </div>
      ),
    },
  ];

  if (!workOrder && !loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-orders')}>
          返回列表
        </Button>
      </div>

      <Card loading={loading} title={
        <Space>
          <span>{workOrder?.orderNo}</span>
          <Tag color={statusColors[workOrder?.status as WorkOrderStatus]}>
            {WorkOrderStatusLabels[workOrder?.status as WorkOrderStatus]}
          </Tag>
        </Space>
      }>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="标题">{workOrder?.title}</Descriptions.Item>
          <Descriptions.Item label="异常类型">
            {AbnormalTypeLabels[workOrder?.abnormalType as any]}
          </Descriptions.Item>
          <Descriptions.Item label="电站">{workOrder?.station}</Descriptions.Item>
          <Descriptions.Item label="设备编号">{workOrder?.equipmentNo || '-'}</Descriptions.Item>
          <Descriptions.Item label="上报人">{workOrder?.reporter?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="处理人">{workOrder?.handler?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(workOrder?.createdAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="关闭时间">
            {workOrder?.closedAt ? dayjs(workOrder?.closedAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="异常描述" span={2}>
            {workOrder?.description || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="总停机时长"
                value={workOrder?.totalDowntimeMinutes || 0}
                suffix="分钟"
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="发电量损失"
                value={workOrder?.powerLoss || 0}
                suffix="kWh"
                prefix={<ThunderboltOutlined style={{ color: '#eb2f96' }} />
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="备件领用数"
                value={workOrder?.partUsages?.length || 0}
                prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Tabs items={tabItems} />
      </Card>
    </div>
  );
};

export default WorkOrderDetail;
