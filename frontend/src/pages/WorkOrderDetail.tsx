import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Button,
  Space,
  Tabs,
  Table,
  message,
  Divider,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Steps,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { workOrderApi, sparePartApi, userApi } from '../services/api';
import {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderStatusLabels,
  AbnormalTypeLabels,
  PartUsage,
  PartRequestStatus,
  PartRequestStatusLabels,
  ReviewLevelLabels,
  PartRequestStatusEnum,
  ReviewLevelEnum,
  RoleLabels,
} from '../types/index';
import type { Dayjs } from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

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

const workflowSteps = [
  { status: WorkOrderStatus.ABNORMAL_REPORTED, title: '异常上报' },
  { status: WorkOrderStatus.DOWNTIME_CONFIRMED, title: '停机确认' },
  { status: WorkOrderStatus.PART_REQUESTED, title: '备件申请' },
  { status: WorkOrderStatus.PART_APPROVED, title: '备件审批' },
  { status: WorkOrderStatus.PART_RECEIVED, title: '备件签收' },
  { status: WorkOrderStatus.REPAIR_COMPLETED, title: '维修完成' },
  { status: WorkOrderStatus.REVIEW_SUBMITTED, title: '复盘提交' },
  { status: WorkOrderStatus.CLOSED, title: '工单关闭' },
];

const WorkOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [spareParts, setSpareParts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadDetail();
      loadSpareParts();
      loadUsers();
    }
  }, [id]);

  const loadUsers = async () => {
    try {
      const res = await userApi.getList({ page: 1, limit: 100 });
      setUsers(res.data.data || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await workOrderApi.getDetail(id!);
      setWorkOrder(res.data);
    } catch (error: any) {
      console.error('加载详情失败:', error);
      message.error(error.response?.data?.message || '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSpareParts = async () => {
    try {
      const res = await sparePartApi.getList({ page: 1, limit: 100 });
      setSpareParts(res.data.data || []);
    } catch (error) {
      console.error('加载备件列表失败:', error);
    }
  };

  const getCurrentStep = () => {
    return workflowSteps.findIndex((step) => step.status === workOrder?.status);
  };

  const getAvailableActions = () => {
    if (!workOrder) return [];
    const actions: Array<{ key: string; label: string; type?: string }> = [];

    switch (workOrder.status) {
      case WorkOrderStatus.ABNORMAL_REPORTED:
        actions.push({ key: 'confirmDowntime', label: '确认停机', type: 'primary' });
        break;
      case WorkOrderStatus.DOWNTIME_CONFIRMED:
        actions.push({ key: 'requestPart', label: '申请备件', type: 'primary' });
        actions.push({ key: 'completeRepair', label: '直接完成维修', type: 'default' });
        break;
      case WorkOrderStatus.PART_REQUESTED:
        actions.push({ key: 'approvePart', label: '审批备件', type: 'primary' });
        break;
      case WorkOrderStatus.PART_APPROVED:
        actions.push({ key: 'receivePart', label: '签收备件', type: 'primary' });
        break;
      case WorkOrderStatus.PART_RECEIVED:
        actions.push({ key: 'completeRepair', label: '完成维修', type: 'primary' });
        break;
      case WorkOrderStatus.REPAIR_COMPLETED:
        actions.push({ key: 'submitReview', label: '提交复盘', type: 'primary' });
        break;
      case WorkOrderStatus.REVIEW_SUBMITTED:
        actions.push({ key: 'verifyReview', label: '验证复盘', type: 'primary' });
        break;
      case WorkOrderStatus.CLOSED:
        break;
    }

    return actions;
  };

  const handleAction = (actionKey: string) => {
    setCurrentAction(actionKey);
    form.resetFields();
    setModalVisible(true);
  };

  const handleActionSubmit = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      let apiCall: any;

      switch (currentAction) {
        case 'confirmDowntime':
          apiCall = workOrderApi.confirmDowntime(id!, {
            operatorId: values.operatorId,
            startTime: values.startTime.toDate(),
            endTime: values.endTime?.toDate(),
            reason: values.reason,
            remark: values.remark,
          });
          break;
        case 'requestPart':
          apiCall = workOrderApi.requestPart(id!, {
            operatorId: values.operatorId,
            sparePartId: values.sparePartId,
            quantity: values.quantity,
            requestReason: values.requestReason,
          });
          break;
        case 'approvePart':
          const pendingPart = workOrder?.partUsages?.find(
            (p: PartUsage) => p.status === PartRequestStatus.PENDING
          );
          apiCall = workOrderApi.approvePart(id!, {
            operatorId: values.operatorId,
            partUsageId: pendingPart?.id,
            status: values.status,
            approvalRemark: values.approvalRemark,
          });
          break;
        case 'receivePart':
          const approvedPart = workOrder?.partUsages?.find(
            (p: PartUsage) => p.status === PartRequestStatus.APPROVED
          );
          apiCall = workOrderApi.receivePart(id!, {
            operatorId: values.operatorId,
            partUsageId: approvedPart?.id,
          });
          break;
        case 'completeRepair':
          apiCall = workOrderApi.completeRepair(id!, {
            operatorId: values.operatorId,
            remark: values.remark,
          });
          break;
        case 'submitReview':
          apiCall = workOrderApi.submitReview(id!, {
            operatorId: values.operatorId,
            level: values.level,
            rootCause: values.rootCause,
            repairProcess: values.repairProcess,
            improvementMeasures: values.improvementMeasures,
            lessonsLearned: values.lessonsLearned,
            actualDowntimeMinutes: values.actualDowntimeMinutes,
            actualPowerLoss: values.actualPowerLoss,
            actualPartCost: values.actualPartCost,
            actualLaborCost: values.actualLaborCost,
          });
          break;
        case 'verifyReview':
          apiCall = workOrderApi.verifyReview(id!, {
            operatorId: values.operatorId,
            remark: values.remark,
          });
          break;
      }

      const res = await apiCall;
      setWorkOrder(res.data);
      setModalVisible(false);
      message.success('操作成功');
    } catch (error: any) {
      console.error('操作失败:', error);
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionTitle = () => {
    const titles: Record<string, string> = {
      confirmDowntime: '确认停机',
      requestPart: '申请备件',
      approvePart: '审批备件',
      receivePart: '签收备件',
      completeRepair: '完成维修',
      submitReview: '提交复盘',
      verifyReview: '验证复盘',
    };
    return titles[currentAction] || '';
  };

  const renderOperatorSelector = () => (
    <Form.Item name="operatorId" label="操作者" rules={[{ required: true, message: '请选择操作者' }]}>
      <Select placeholder="请选择当前操作用户">
        {users.map((user) => (
          <Option key={user.id} value={user.id}>
            {user.name} ({RoleLabels[user.role] || user.role})
          </Option>
        ))}
      </Select>
    </Form.Item>
  );

  const renderActionForm = () => {
    switch (currentAction) {
      case 'confirmDowntime':
        return (
          <>
            {renderOperatorSelector()}
            <Form.Item name="startTime" label="停机开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endTime" label="停机结束时间">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reason" label="停机原因">
              <TextArea rows={3} placeholder="请输入停机原因" />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
          </>
        );
      case 'requestPart':
        return (
          <>
            {renderOperatorSelector()}
            <Form.Item name="sparePartId" label="选择备件" rules={[{ required: true, message: '请选择备件' }]}>
              <Select placeholder="请选择备件">
                {spareParts.map((part) => (
                  <Option key={part.id} value={part.id}>
                    {part.partCode} - {part.name} (库存: {part.stockQuantity})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="quantity" label="申请数量" rules={[{ required: true, message: '请输入数量' }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="requestReason" label="申请原因">
              <TextArea rows={3} placeholder="请输入申请原因" />
            </Form.Item>
          </>
        );
      case 'approvePart':
        const pendingPart = workOrder?.partUsages?.find(
          (p: PartUsage) => p.status === PartRequestStatus.PENDING
        );
        return (
          <>
            {renderOperatorSelector()}
            <Alert
              message={`待审批备件: ${pendingPart?.sparePart?.name} x ${pendingPart?.quantity}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item name="status" label="审批结果" rules={[{ required: true, message: '请选择审批结果' }]}>
              <Select placeholder="请选择">
                <Option value={PartRequestStatusEnum.APPROVED}>通过</Option>
                <Option value={PartRequestStatusEnum.REJECTED}>驳回</Option>
              </Select>
            </Form.Item>
            <Form.Item name="approvalRemark" label="审批意见">
              <TextArea rows={3} placeholder="请输入审批意见" />
            </Form.Item>
          </>
        );
      case 'receivePart':
        const approvedPart = workOrder?.partUsages?.find(
          (p: PartUsage) => p.status === PartRequestStatus.APPROVED
        );
        return (
          <>
            {renderOperatorSelector()}
            <Alert
              message={`确认签收备件: ${approvedPart?.sparePart?.name} x ${approvedPart?.quantity}`}
              type="info"
              showIcon
            />
          </>
        );
      case 'completeRepair':
        return (
          <>
            {renderOperatorSelector()}
            <Form.Item name="remark" label="维修说明">
              <TextArea rows={3} placeholder="请输入维修完成说明" />
            </Form.Item>
          </>
        );
      case 'submitReview':
        return (
          <>
            {renderOperatorSelector()}
            <Form.Item name="level" label="故障级别">
              <Select placeholder="请选择">
                <Option value={ReviewLevelEnum.MINOR}>轻微</Option>
                <Option value={ReviewLevelEnum.MEDIUM}>一般</Option>
                <Option value={ReviewLevelEnum.MAJOR}>严重</Option>
                <Option value={ReviewLevelEnum.CRITICAL}>致命</Option>
              </Select>
            </Form.Item>
            <Form.Item name="rootCause" label="根本原因">
              <TextArea rows={3} placeholder="请输入根本原因分析" />
            </Form.Item>
            <Form.Item name="repairProcess" label="维修过程">
              <TextArea rows={3} placeholder="请描述维修过程" />
            </Form.Item>
            <Form.Item name="improvementMeasures" label="改进措施">
              <TextArea rows={3} placeholder="请输入改进措施" />
            </Form.Item>
            <Form.Item name="lessonsLearned" label="经验教训">
              <TextArea rows={3} placeholder="请输入经验教训" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="actualDowntimeMinutes" label="实际停机(分钟)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualPowerLoss" label="发电量损失(kWh)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="actualPartCost" label="备件成本(元)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualLaborCost" label="人工成本(元)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </>
        );
      case 'verifyReview':
        const review = workOrder?.reviewRecords?.[0];
        return (
          <>
            {renderOperatorSelector()}
            <Alert
              message={`复盘记录: ${review?.rootCause || '无'}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form.Item name="remark" label="验证意见">
              <TextArea rows={3} placeholder="请输入验证意见" />
            </Form.Item>
          </>
        );
      default:
        return null;
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
      render: (date?: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
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
        <Tag color={confirmed ? 'green' : 'orange'}>{confirmed ? '已确认' : '待确认'}</Tag>
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
      render: (price?: number) => (price ? `¥${price}` : '-'),
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (price?: number) => (price ? `¥${price}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: PartRequestStatus) => (
        <Tag color={partStatusColors[status]}>{PartRequestStatusLabels[status]}</Tag>
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
      render: (cost?: number) => (cost ? `¥${cost}` : '-'),
    },
    {
      title: '人工成本',
      dataIndex: 'actualLaborCost',
      key: 'actualLaborCost',
      render: (cost?: number) => (cost ? `¥${cost}` : '-'),
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost?: number) => (cost ? `¥${cost}` : '-'),
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
        <Tag color={verified ? 'green' : 'orange'}>{verified ? '已验证' : '待验证'}</Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'downtime',
      label: '停机记录',
      children: (
        <Table columns={downtimeColumns} dataSource={workOrder?.downtimeRecords || []} rowKey="id" pagination={false} />
      ),
    },
    {
      key: 'parts',
      label: '备件领用',
      children: (
        <Table columns={partColumns} dataSource={workOrder?.partUsages || []} rowKey="id" pagination={false} />
      ),
    },
    {
      key: 'review',
      label: '复盘记录',
      children: (
        <Table columns={reviewColumns} dataSource={workOrder?.reviewRecords || []} rowKey="id" pagination={false} />
      ),
    },
    {
      key: 'timeline',
      label: '状态流转',
      children: (
        <div style={{ padding: '24px 0' }}>
          <Timeline
            items={workOrder?.statusHistories
              ?.slice()
              .reverse()
              .map((history) => ({
                color: statusColors[history.toStatus],
                children: (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{WorkOrderStatusLabels[history.toStatus]}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>{history.remark}</div>
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

  const availableActions = getAvailableActions();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/work-orders')}>
          返回列表
        </Button>
      </div>

      <Card loading={loading}>
        <Card.Meta
          title={
            <Space>
              <span>{workOrder?.orderNo}</span>
              <Tag color={statusColors[workOrder?.status as WorkOrderStatus]}>
                {WorkOrderStatusLabels[workOrder?.status as WorkOrderStatus]}
              </Tag>
            </Space>
          }
          description={workOrder?.title}
        />

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <Steps current={getCurrentStep()} size="small">
            {workflowSteps.map((step) => (
              <Steps.Step key={step.status} title={step.title} />
            ))}
          </Steps>
        </div>

        {availableActions.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <Space>
              <span style={{ fontWeight: 'bold' }}>待办操作:</span>
              {availableActions.map((action) => (
                <Button
                  key={action.key}
                  type={action.type as any}
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAction(action.key)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </div>
        )}

        <Descriptions column={2} bordered size="small">
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
            <Card size="small">
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
            <Card size="small">
              <Statistic
                title="发电量损失"
                value={workOrder?.powerLoss || 0}
                suffix="kWh"
                prefix={<ThunderboltOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
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

      <Modal
        title={getActionTitle()}
        open={modalVisible}
        onOk={handleActionSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={actionLoading}
        width={600}
      >
        <Form form={form} layout="vertical">
          {renderActionForm()}
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderDetail;
