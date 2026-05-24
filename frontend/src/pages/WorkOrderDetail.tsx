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
  Steps,
  Tabs,
  Empty,
  Popconfirm,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  PhoneOutlined,
  InboxOutlined,
  SendOutlined,
  AuditOutlined,
  ToolOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { workOrderAPI, followUpAPI, repairAPI } from '../services/api';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Option } = Select;
const { TabPane } = Tabs;

const WorkOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [histories, setHistories] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [handoverModalVisible, setHandoverModalVisible] = useState(false);
  const [repairModalVisible, setRepairModalVisible] = useState(false);
  const [repairStatusModalVisible, setRepairStatusModalVisible] = useState(false);
  const [addStepModalVisible, setAddStepModalVisible] = useState(false);
  const [stepStatusModalVisible, setStepStatusModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [handoverType, setHandoverType] = useState<'receive' | 'return'>('receive');
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [selectedStep, setSelectedStep] = useState<any>(null);
  const [availableRepairTransitions, setAvailableRepairTransitions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [followUpForm] = Form.useForm();
  const [handoverForm] = Form.useForm();
  const [repairForm] = Form.useForm();
  const [repairStatusForm] = Form.useForm();
  const [addStepForm] = Form.useForm();
  const [stepStatusForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, historyRes, auditRes, repairRes] = await Promise.all([
        workOrderAPI.getById(id!),
        workOrderAPI.getHistories(id!),
        workOrderAPI.getAuditLogs(id!),
        repairAPI.getByWorkOrderId(id!),
      ]);
      setWorkOrder(orderRes.data);
      setHistories(historyRes.data || []);
      setAuditLogs(auditRes.data || []);
      setRepairs(repairRes.data || []);
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

  const canReceiveItem = (item: any) => {
    if (!user) return false;
    if (item.handoverStatus !== 'pending') return false;
    return ['workshop', 'manager', 'admin'].includes(user.role);
  };

  const canReturnItem = (item: any) => {
    if (!user) return false;
    if (!['received'].includes(item.handoverStatus)) return false;
    return ['sales', 'manager', 'admin'].includes(user.role);
  };

  const canChangeStatus = () => {
    if (!user) return false;
    const allowedRoles: Record<string, string[]> = {
      draft: ['sales', 'manager', 'admin'],
      pending_review: ['manager', 'admin'],
      reviewed: ['workshop', 'manager', 'admin'],
      in_progress: ['workshop', 'manager', 'admin'],
      needs_review: ['manager', 'admin'],
      pending_confirm: ['sales', 'manager', 'admin'],
      rejected: ['sales', 'manager', 'admin'],
    };
    return allowedRoles[workOrder?.status]?.includes(user.role) || false;
  };

  const canCreateRepair = () => {
    if (!user) return false;
    return ['workshop', 'manager', 'admin'].includes(user.role);
  };

  const canCompleteFollowUp = () => {
    if (!user) return false;
    return ['customer_service', 'manager', 'admin'].includes(user.role);
  };

  const getAvailableStatuses = () => {
    if (!workOrder || !user) return [];
    const currentStatus = workOrder.status;
    const userRole = user.role;

    const allTransitions: Record<string, Array<{ value: string; label: string; roles: string[] }>> = {
      draft: [
        { value: 'pending_review', label: '提交审核', roles: ['sales', 'manager', 'admin'] },
        { value: 'cancelled', label: '取消工单', roles: ['manager', 'admin'] },
      ],
      pending_review: [
        { value: 'reviewed', label: '审核通过', roles: ['manager', 'admin'] },
        { value: 'rejected', label: '审核驳回', roles: ['manager', 'admin'] },
      ],
      reviewed: [
        { value: 'in_progress', label: '开始处理', roles: ['workshop', 'manager', 'admin'] },
        { value: 'needs_review', label: '需要复核', roles: ['manager', 'admin'] },
      ],
      in_progress: [
        { value: 'pending_confirm', label: '处理完成待确认', roles: ['workshop', 'manager', 'admin'] },
        { value: 'needs_review', label: '需要复核', roles: ['manager', 'admin'] },
      ],
      needs_review: [
        { value: 'in_progress', label: '复核通过继续处理', roles: ['manager', 'admin'] },
        { value: 'rejected', label: '复核不通过', roles: ['manager', 'admin'] },
      ],
      pending_confirm: [
        { value: 'completed', label: '确认完成', roles: ['sales', 'customer_service', 'manager', 'admin'] },
        { value: 'in_progress', label: '返工', roles: ['workshop', 'manager', 'admin'] },
        { value: 'needs_review', label: '需要复核', roles: ['sales', 'manager', 'admin'] },
      ],
      rejected: [
        { value: 'draft', label: '修改后重新提交', roles: ['sales', 'manager', 'admin'] },
        { value: 'cancelled', label: '取消工单', roles: ['manager', 'admin'] },
      ],
    };

    const transitions = allTransitions[currentStatus] || [];
    return transitions.filter(t => t.roles.includes(userRole));
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

  const handleHandover = async (values: any) => {
    try {
      if (handoverType === 'receive') {
        await workOrderAPI.receiveItem(id!, selectedItem.id, values);
        message.success('物品接收成功');
      } else {
        await workOrderAPI.returnItem(id!, selectedItem.id, values);
        message.success('物品返还成功');
      }
      setHandoverModalVisible(false);
      handoverForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const openHandoverModal = (item: any, type: 'receive' | 'return') => {
    setSelectedItem(item);
    setHandoverType(type);
    handoverForm.resetFields();
    setHandoverModalVisible(true);
  };

  const handleCreateRepair = async (values: any) => {
    try {
      await repairAPI.create({
        ...values,
        workOrderId: workOrder.id,
      });
      message.success('返修记录创建成功');
      setRepairModalVisible(false);
      repairForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const openRepairStatusModal = async (repair: any) => {
    setSelectedRepair(repair);
    try {
      const res = await repairAPI.getTransitions(repair.id);
      setAvailableRepairTransitions(res.data || []);
      repairStatusForm.resetFields();
      setRepairStatusModalVisible(true);
    } catch (error) {
      message.error('获取可用状态失败');
    }
  };

  const handleRepairStatusChange = async (values: any) => {
    try {
      await repairAPI.changeStatus(selectedRepair.id, values.status, values.reason);
      message.success('状态更新成功');
      setRepairStatusModalVisible(false);
      repairStatusForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败');
    }
  };

  const openAddStepModal = (repair: any) => {
    setSelectedRepair(repair);
    addStepForm.resetFields();
    setAddStepModalVisible(true);
  };

  const handleAddStep = async (values: any) => {
    try {
      await repairAPI.addStep(selectedRepair.id, values);
      message.success('维修步骤添加成功');
      setAddStepModalVisible(false);
      addStepForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '添加失败');
    }
  };

  const openStepStatusModal = (step: any) => {
    setSelectedStep(step);
    stepStatusForm.resetFields();
    setStepStatusModalVisible(true);
  };

  const handleStepStatusChange = async (values: any) => {
    try {
      await repairAPI.updateStep(selectedStep.id, values);
      message.success('步骤状态更新成功');
      setStepStatusModalVisible(false);
      stepStatusForm.resetFields();
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  const canManageRepairSteps = () => {
    if (!user) return false;
    return ['workshop', 'manager', 'admin'].includes(user.role);
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
    { title: '返还时间', dataIndex: 'returnedAt', key: 'returnedAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {canReceiveItem(record) && (
            <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => openHandoverModal(record, 'receive')}>
            接收
            </Button>
          )}
          {canReturnItem(record) && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => openHandoverModal(record, 'return')}>
            返还
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const repairColumns = [
    { title: '返修编号', dataIndex: 'repairNo', key: 'repairNo' },
    { title: '返修类型', dataIndex: 'repairType', key: 'repairType',
      render: (type: string) => {
        const map: Record<string, string> = {
          polishing: '抛光',
          soldering: '焊接',
          resizing: '改圈',
          stone_replacement: '换石',
          chain_repair: '链条修复',
          clasp_repair: '扣头修复',
          refurbishment: '翻新',
          custom_modification: '定制修改',
          other: '其他',
        };
        return map[type] || type;
      },
    },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待处理' },
          in_progress: { color: 'processing', text: '处理中' },
          needs_quotation: { color: 'orange', text: '待报价' },
          quotation_approved: { color: 'blue', text: '报价已确认' },
          quotation_rejected: { color: 'error', text: '报价未通过' },
          completed: { color: 'success', text: '已完成' },
          cancelled: { color: 'default', text: '已取消' },
        };
        const info = map[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '总费用', dataIndex: 'totalCost', key: 'totalCost',
      render: (cost: number) => `¥${cost || 0}`,
    },
    { title: '技师', dataIndex: 'technician', key: 'technician',
      render: (tech: any) => tech?.realName || '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    { title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => openRepairStatusModal(record)}>
            变更状态
          </Button>
          {canManageRepairSteps() && record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button type="link" size="small" onClick={() => openAddStepModal(record)}>
              添加步骤
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getActionIcon = (action: string) => {
    const map: Record<string, React.ReactNode> = {
      create: <FileTextOutlined />,
      update: <ToolOutlined />,
      status_change: <HistoryOutlined />,
      handover: <InboxOutlined />,
      approve: <CheckOutlined />,
      reject: <CloseOutlined />,
    };
    return map[action] || <FileTextOutlined />;
  };

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
            <Button icon={<ToolOutlined />} onClick={() => setRepairModalVisible(true)} disabled={!canCreateRepair()}>
              创建返修
            </Button>
            <Button icon={<PhoneOutlined />} onClick={() => setFollowUpModalVisible(true)}>
              创建回访
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="basic">
          <TabPane tab="基本信息" key="basic">
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
          </TabPane>

          <TabPane tab="返修记录" key="repair">
            <Table
              columns={repairColumns}
              dataSource={repairs}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty description="暂无返修记录" /> }}
            />

            {repairs.map((repair: any) => (
              <div key={repair.id} style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h5 style={{ margin: 0 }}>{repair.repairNo} - 维修步骤</h5>
                  {canManageRepairSteps() && repair.status !== 'completed' && repair.status !== 'cancelled' && (
                    <Button type="link" size="small" onClick={() => openAddStepModal(repair)}>
                      + 添加步骤
                    </Button>
                  )}
                </div>
                <List
                  size="small"
                  dataSource={repair.steps || []}
                  locale={{ emptyText: '暂无步骤' }}
                  renderItem={(step: any) => (
                    <List.Item
                      actions={canManageRepairSteps() && repair.status !== 'completed' && repair.status !== 'cancelled' ? [
                        <Button type="link" size="small" onClick={() => openStepStatusModal(step)}>
                          更新状态
                        </Button>
                      ] : []}
                    >
                      <List.Item.Meta
                        avatar={
                          step.status === 'completed' ? <CheckOutlined style={{ color: '#52c41a' }} /> :
                          step.status === 'in_progress' ? <ClockCircleOutlined style={{ color: '#1890ff' }} /> :
                          <ClockCircleOutlined style={{ color: '#d9d9d9' }} />
                        }
                        title={
                          <Space>
                            <span>{step.stepOrder}. {step.stepName}</span>
                            <Tag color={
                              step.status === 'completed' ? 'success' :
                              step.status === 'in_progress' ? 'processing' : 'default'
                            } style={{ fontSize: 12 }}>
                              {step.status === 'completed' ? '已完成' : step.status === 'in_progress' ? '进行中' : '待开始'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            {step.stepDescription && <div>{step.stepDescription}</div>}
                            {step.operatorNote && <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>备注: {step.operatorNote}</div>}
                            {step.completedAt && step.operator && (
                              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                                {step.operator.realName} 于 {dayjs(step.completedAt).format('YYYY-MM-DD HH:mm')} 完成
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            ))}
          </TabPane>

          <TabPane tab="状态历史" key="history">
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
          </TabPane>

          <TabPane tab={<span><AuditOutlined /> 审计回查</span>} key="audit">
            {auditLogs.length === 0 ? (
              <Empty description="暂无审计记录" />
            ) : (
              <List
                dataSource={auditLogs}
                renderItem={(log: any) => (
                  <List.Item key={log.id}>
                    <List.Item.Meta
                      avatar={getActionIcon(log.action)}
                      title={
                        <Space>
                          <span>{log.actionDescription}</span>
                          <Tag color="blue">{log.operatorName || '系统'}</Tag>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        </Space>
                      }
                      description={
                        <div>
                          {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                              <strong>变更前:</strong>
                              <pre style={{ background: '#fff1f0', padding: 8, borderRadius: 4, fontSize: 12 }}>
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && Object.keys(log.newValues).length > 0 && (
                            <div>
                              <strong>变更后:</strong>
                              <pre style={{ background: '#f6ffed', padding: 8, borderRadius: 4, fontSize: 12 }}>
                                {JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </TabPane>

          <TabPane tab="回访记录" key="followup">
            {workOrder.followUps?.length === 0 ? (
              <Empty description="暂无回访记录" />
            ) : (
              <List
                dataSource={workOrder.followUps}
                renderItem={(fu: any) => (
                  <List.Item key={fu.id}>
                    <List.Item.Meta
                      avatar={<PhoneOutlined />}
                      title={
                        <Space>
                          <span>{fu.followUpContent}</span>
                          <Tag color={fu.status === 'completed' ? 'success' : 'orange'}>
                            {fu.status === 'completed' ? '已完成' : '待处理'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>回访类型: {fu.type === 'repair_completed' ? '返修完成回访' : fu.type}</div>
                          <div>计划时间: {dayjs(fu.plannedAt).format('YYYY-MM-DD HH:mm')}</div>
                          {fu.actualAt && <div>实际时间: {dayjs(fu.actualAt).format('YYYY-MM-DD HH:mm')}</div>}
                          {fu.customerFeedback && <div>客户反馈: {fu.customerFeedback}</div>}
                        </div>
                      }
                    />
                    {fu.status === 'pending' && canCompleteFollowUp() && (
                      <Button type="link" onClick={() => navigate(`/follow-ups`)}>
                      完成回访
                      </Button>
                    )}
                  </List.Item>
                )}
              />
            )}
          </TabPane>
        </Tabs>
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

      <Modal
        title={handoverType === 'receive' ? '接收物品' : '返还物品'}
        open={handoverModalVisible}
        onCancel={() => setHandoverModalVisible(false)}
        onOk={() => handoverForm.submit()}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>物品名称:</strong> {selectedItem?.itemName}
        </div>
        <Form form={handoverForm} layout="vertical" onFinish={handleHandover}>
          <Form.Item label="物品状态描述" name="conditionAfter">
            <Input.TextArea rows={3} placeholder="请描述物品当前状态" />
          </Form.Item>
          <Form.Item label="交接备注" name="handoverRemark">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建返修记录"
        open={repairModalVisible}
        onCancel={() => setRepairModalVisible(false)}
        onOk={() => repairForm.submit()}
        width={600}
      >
        <Form form={repairForm} layout="vertical" onFinish={handleCreateRepair}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="返修类型"
                name="repairType"
                rules={[{ required: true, message: '请选择返修类型' }]}
              >
                <Select placeholder="请选择">
                  <Option value="polishing">抛光</Option>
                  <Option value="soldering">焊接</Option>
                  <Option value="resizing">改圈</Option>
                  <Option value="stone_replacement">换石</Option>
                  <Option value="chain_repair">链条修复</Option>
                  <Option value="clasp_repair">扣头修复</Option>
                  <Option value="refurbishment">翻新</Option>
                  <Option value="custom_modification">定制修改</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="是否保修" name="isWarranty" valuePropName="checked">
                <Select defaultValue={false}>
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="返修描述"
            name="repairDescription"
            rules={[{ required: true, message: '请输入返修描述' }]}
          >
            <Input.TextArea rows={3} placeholder="请详细描述返修内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="配件费用" name="partsCost">
                <Input type="number" placeholder="配件费用" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="人工费用" name="laborCost">
                <Input type="number" placeholder="人工费用" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="变更返修状态"
        open={repairStatusModalVisible}
        onCancel={() => setRepairStatusModalVisible(false)}
        onOk={() => repairStatusForm.submit()}
      >
        <Form form={repairStatusForm} layout="vertical" onFinish={handleRepairStatusChange}>
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择目标状态' }]}
          >
            <Select placeholder="请选择">
              {availableRepairTransitions.map((t: any) => (
                <Option key={t.action} value={t.to}>{t.description}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="变更原因" name="reason">
            <Input.TextArea rows={3} placeholder="请输入变更原因（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加维修步骤"
        open={addStepModalVisible}
        onCancel={() => setAddStepModalVisible(false)}
        onOk={() => addStepForm.submit()}
      >
        <Form form={addStepForm} layout="vertical" onFinish={handleAddStep}>
          <Form.Item
            label="步骤序号"
            name="stepOrder"
            rules={[{ required: true, message: '请输入步骤序号' }]}
          >
            <Input type="number" placeholder="例如：1, 2, 3" />
          </Form.Item>
          <Form.Item
            label="步骤名称"
            name="stepName"
            rules={[{ required: true, message: '请输入步骤名称' }]}
          >
            <Input placeholder="例如：检测、抛光、焊接等" />
          </Form.Item>
          <Form.Item label="步骤描述" name="stepDescription">
            <Input.TextArea rows={3} placeholder="请详细描述该步骤的操作内容（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新步骤状态"
        open={stepStatusModalVisible}
        onCancel={() => setStepStatusModalVisible(false)}
        onOk={() => stepStatusForm.submit()}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>步骤:</strong> {selectedStep?.stepName}
        </div>
        <Form form={stepStatusForm} layout="vertical" onFinish={handleStepStatusChange}>
          <Form.Item
            label="目标状态"
            name="status"
            rules={[{ required: true, message: '请选择目标状态' }]}
          >
            <Select placeholder="请选择">
              <Option value="pending">待开始</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item label="操作备注" name="operatorNote">
            <Input.TextArea rows={3} placeholder="请输入操作备注（选填）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderDetail;
