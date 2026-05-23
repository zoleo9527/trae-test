import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, message, Card, Typography, Descriptions, Steps, Timeline,
  InputNumber, Input, Select, Row, Col, Statistic, Popover
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, EditOutlined, WarningOutlined, DownOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { INVENTORY_STATUS, DIFFERENCE_TYPE, DISPOSITION_TYPE, COMPENSATION_STATUS } from '../utils/constants';
import useAuthStore from '../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Inventory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [dispositionModalVisible, setDispositionModalVisible] = useState(false);
  const [transfers, setTransfers] = useState([]);
  const [form] = Form.useForm();
  const [dispositionForm] = Form.useForm();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadData();
    loadTransfers();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await request.get('/inventory');
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const result = await request.get('/transfers');
      setTransfers(result.data || []);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    }
  };

  const handleCreate = async () => {
    try {
      await request.post('/inventory', {
        store_id: user.store_id,
        check_date: dayjs().format('YYYY-MM-DD')
      });
      message.success('盘点单创建成功');
      loadData();
    } catch (error) {
      console.error('Failed to create inventory:', error);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await request.get(`/inventory/${record.id}`);
      setSelectedInventory(detail);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to load inventory detail:', error);
    }
  };

  const handleSubmit = async (id) => {
    try {
      await request.post(`/inventory/${id}/submit`);
      message.success('盘点已提交');
      loadData();
      if (selectedInventory) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  };

  const handleReview = async (id) => {
    try {
      await request.post(`/inventory/${id}/review`);
      message.success('已开始复核');
      loadData();
      if (selectedInventory) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to review:', error);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await request.post(`/inventory/${id}/confirm`);
      message.success('盘点已确认');
      loadData();
      if (selectedInventory) {
        handleViewDetail({ id });
      }
    } catch (error) {
      console.error('Failed to confirm:', error);
    }
  };

  const handleResolve = async (id) => {
    Modal.confirm({
      title: '确认结案',
      content: '所有差异处理都已确认了吗？结案后将无法修改。',
      okText: '确认结案',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.post(`/inventory/${id}/resolve`);
          message.success('盘点差异已全部处理，结案成功');
          loadData();
          if (selectedInventory) {
            handleViewDetail({ id });
          }
        } catch (error) {
          console.error('Failed to resolve:', error);
        }
      }
    });
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      actual_quantity: item.actual_quantity,
      remarks: item.remarks
    });
    setModalVisible(true);
  };

  const handleSaveItem = async (values) => {
    try {
      const newItems = selectedInventory.items.map(item => 
        item.id === editingItem.id 
          ? { ...item, actual_quantity: values.actual_quantity, remarks: values.remarks,
              difference: values.actual_quantity - item.expected_quantity,
              difference_type: values.actual_quantity > item.expected_quantity ? 'surplus' : 
                              values.actual_quantity < item.expected_quantity ? 'shortage' : 'none'
            }
          : item
      );
      
      await request.put(`/inventory/${selectedInventory.id}/items`, { items: newItems });
      message.success('更新成功');
      setModalVisible(false);
      handleViewDetail({ id: selectedInventory.id });
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const handleCreateDisposition = (item) => {
    setEditingItem(item);
    dispositionForm.resetFields();
    setDispositionModalVisible(true);
  };

  const handleSaveDisposition = async (values) => {
    try {
      await request.post('/dispositions', {
        inventory_item_id: editingItem.id,
        ...values
      });
      message.success('差异处理创建成功');
      setDispositionModalVisible(false);
      handleViewDetail({ id: selectedInventory.id });
    } catch (error) {
      console.error('Failed to create disposition:', error);
    }
  };

  const handleConfirmDisposition = async (dispositionId) => {
    Modal.confirm({
      title: '确认责任归属',
      content: '确认后将无法修改，确定继续吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await request.post(`/dispositions/${dispositionId}/confirm`);
          message.success('责任已确认');
          handleViewDetail({ id: selectedInventory.id });
        } catch (error) {
          console.error('Failed to confirm disposition:', error);
        }
      }
    });
  };

  const handleUpdateCompensationStatus = async (dispositionId, status) => {
    try {
      await request.post(`/dispositions/${dispositionId}/compensation-status`, { status });
      message.success('赔付状态已更新');
      handleViewDetail({ id: selectedInventory.id });
    } catch (error) {
      console.error('Failed to update compensation status:', error);
    }
  };

  const canCreateInventory = ['sales_associate', 'store_manager', 'after_sales'].includes(user.role);
  const canSubmitInventory = (record) => record.status === 'draft' && record.checked_by === user.id;
  const canReviewInventory = (record) => ['submitted', 'reviewing'].includes(record.status) && ['after_sales', 'store_manager'].includes(user.role);
  const canConfirmInventory = (record) => record.status === 'reviewing' && record.store_id === user.store_id && user.role === 'store_manager';
  const canResolveInventory = (record) => record.status === 'confirmed' && user.role === 'store_manager';

  const columns = [
    {
      title: '盘点单号',
      dataIndex: 'check_no',
      key: 'check_no',
      width: 160,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 140
    },
    {
      title: '盘点日期',
      dataIndex: 'check_date',
      key: 'check_date',
      width: 120
    },
    {
      title: '盘点人',
      dataIndex: 'checker_name',
      key: 'checker_name',
      width: 100
    },
    {
      title: '应盘数',
      dataIndex: 'total_expected',
      key: 'total_expected',
      width: 80
    },
    {
      title: '实盘数',
      dataIndex: 'total_actual',
      key: 'total_actual',
      width: 80
    },
    {
      title: '差异数',
      dataIndex: 'total_difference',
      key: 'total_difference',
      width: 80,
      render: (val) => val > 0 ? <Tag color="red">{val}</Tag> : <Tag color="green">0</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = INVENTORY_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {canSubmitInventory(record) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleSubmit(record.id)}>
              提交
            </Button>
          )}
          {canReviewInventory(record) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleReview(record.id)}>
              复核
            </Button>
          )}
          {canConfirmInventory(record) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
              确认
            </Button>
          )}
          {canResolveInventory(record) && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleResolve(record.id)}>
              结案
            </Button>
          )}
        </Space>
      )
    }
  ];

  const expandedRowRender = (record) => {
    if (!record.dispositions || record.dispositions.length === 0) {
      return <Text type="secondary" style={{ padding: '8px 16px' }}>暂无差异处理记录</Text>;
    }

    return (
      <div style={{ padding: '8px 16px', background: '#fafafa' }}>
        <Text strong>差异处理记录：</Text>
        {record.dispositions.map((disp) => (
          <Card key={disp.id} size="small" style={{ marginTop: 8, marginBottom: 8 }}>
            <Descriptions size="small" column={4}>
              <Descriptions.Item label="处理类型">{DISPOSITION_TYPE[disp.disposition_type]}</Descriptions.Item>
              <Descriptions.Item label="关联调货">{disp.related_transfer_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="责任人">{disp.responsible_person_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="责任确认">
                {disp.responsibility_confirmed ? (
                  <Tag color="green">已确认 ({disp.confirmer_name})</Tag>
                ) : (
                  <Tag color="orange">待确认</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="赔付金额">
                {disp.compensation_amount > 0 ? `¥${disp.compensation_amount}` : (
                  <Tag color="blue">¥0 - 免赔</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="赔付状态">
                <Space>
                  <Tag color={COMPENSATION_STATUS[disp.compensation_status]?.color}>
                    {COMPENSATION_STATUS[disp.compensation_status]?.label}
                  </Tag>
                  {disp.compensation_amount === 0 && disp.compensation_status === 'waived' && (
                    <Tag color="blue">系统自动免赔</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{disp.remarks || '-'}</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 8 }}>
              {!disp.responsibility_confirmed && user.role === 'store_manager' && ['reviewing', 'confirmed'].includes(selectedInventory.status) && (
                <Button type="primary" size="small" onClick={() => handleConfirmDisposition(disp.id)}>
                  确认责任
                </Button>
              )}
              {disp.responsibility_confirmed && user.role === 'after_sales' && selectedInventory.status !== 'resolved' && (
                <Select 
                  size="small" 
                  style={{ width: 120 }}
                  value={disp.compensation_status}
                  onChange={(val) => handleUpdateCompensationStatus(disp.id, val)}
                >
                  {Object.entries(COMPENSATION_STATUS).map(([key, val]) => (
                    <Option key={key} value={key}>{val.label}</Option>
                  ))}
                </Select>
              )}
              {disp.responsibility_confirmed && user.role !== 'after_sales' && selectedInventory.status !== 'resolved' && (
                <Tag color="blue">
                  赔付状态：{COMPENSATION_STATUS[disp.compensation_status]?.label}
                </Tag>
              )}
            </Space>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>盘点管理</Title>
            <Text type="secondary">门店库存盘点与差异处理</Text>
          </div>
          {canCreateInventory && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建盘点
            </Button>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="编辑盘点明细"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveItem}>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="货品">{editingItem?.product_name}</Descriptions.Item>
            <Descriptions.Item label="SKU">{editingItem?.sku}</Descriptions.Item>
            <Descriptions.Item label="账面数量">{editingItem?.expected_quantity}</Descriptions.Item>
          </Descriptions>
          <Form.Item
            name="actual_quantity"
            label="实际数量"
            rules={[{ required: true, message: '请输入实际数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建差异处理"
        open={dispositionModalVisible}
        onCancel={() => setDispositionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={dispositionForm} layout="vertical" onFinish={handleSaveDisposition}>
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="货品">{editingItem?.product_name}</Descriptions.Item>
            <Descriptions.Item label="差异类型">
              <Tag color={DIFFERENCE_TYPE[editingItem?.difference_type]?.color}>
                {DIFFERENCE_TYPE[editingItem?.difference_type]?.label}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
          <Form.Item
            name="disposition_type"
            label="差异原因类型"
            rules={[{ required: true, message: '请选择差异原因' }]}
          >
            <Select placeholder="请选择">
              {Object.entries(DISPOSITION_TYPE).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="related_transfer_id"
            label="关联调货单（如适用）"
          >
            <Select placeholder="选择关联的调货单" allowClear>
              {transfers.map(t => (
                <Option key={t.id} value={t.id}>{t.request_no} - {t.product_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="responsible_person"
            label="责任人"
          >
            <Select placeholder="选择责任人" allowClear>
              <Option value="user_sa_001">李导购</Option>
              <Option value="user_sa_002">王导购</Option>
              <Option value="user_sm_001">张店长</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="compensation_amount"
            label="赔付金额（元）"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remarks" label="处理说明">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setDispositionModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="盘点详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          selectedInventory && canSubmitInventory(selectedInventory) && (
            <Button key="submit" type="primary" onClick={() => handleSubmit(selectedInventory.id)}>
              提交盘点
            </Button>
          ),
          selectedInventory && canReviewInventory(selectedInventory) && (
            <Button key="review" type="primary" onClick={() => handleReview(selectedInventory.id)}>
              开始复核
            </Button>
          ),
          selectedInventory && canConfirmInventory(selectedInventory) && (
            <Button key="confirm" type="primary" onClick={() => handleConfirm(selectedInventory.id)}>
              确认盘点
            </Button>
          ),
          selectedInventory && canResolveInventory(selectedInventory) && (
            <Button key="resolve" type="primary" onClick={() => handleResolve(selectedInventory.id)}>
              结案
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ].filter(Boolean)}
        width={1000}
      >
        {selectedInventory && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="盘点单号" value={selectedInventory.check_no} />
                </Col>
                <Col span={6}>
                  <Statistic title="门店" value={selectedInventory.store_name} />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="应盘/实盘" 
                    value={`${selectedInventory.total_expected}/${selectedInventory.total_actual}`} 
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="差异数" 
                    value={selectedInventory.total_difference}
                    valueStyle={{ color: selectedInventory.total_difference > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="处理流程" size="small">
              <Steps
                direction="vertical"
                current={
                  selectedInventory.status === 'draft' ? 0 :
                  selectedInventory.status === 'submitted' ? 1 :
                  selectedInventory.status === 'reviewing' ? 2 :
                  selectedInventory.status === 'confirmed' ? 3 :
                  selectedInventory.status === 'resolved' ? 4 : 1
                }
              >
                <Steps.Step title="创建盘点" description={`${selectedInventory.checker_name} - ${dayjs(selectedInventory.created_at).format('MM-DD HH:mm')}`} status="finish" />
                <Steps.Step title="提交盘点" description={selectedInventory.status !== 'draft' ? '已提交' : '待提交'} status={selectedInventory.status === 'draft' ? 'process' : 'finish'} />
                <Steps.Step title="复核中" description={selectedInventory.reviewer_name ? `${selectedInventory.reviewer_name} - ${dayjs(selectedInventory.reviewed_at).format('MM-DD HH:mm')}` : '待复核'} status={['reviewing', 'confirmed', 'resolved'].includes(selectedInventory.status) ? 'finish' : 'wait'} />
                <Steps.Step title="店长确认" description={selectedInventory.confirmer_name ? `${selectedInventory.confirmer_name} - ${dayjs(selectedInventory.confirmed_at).format('MM-DD HH:mm')}` : '待确认'} status={['confirmed', 'resolved'].includes(selectedInventory.status) ? 'finish' : 'wait'} />
                <Steps.Step title="差异处理完成" description={selectedInventory.status === 'resolved' ? '已结案' : '处理中'} status={selectedInventory.status === 'resolved' ? 'finish' : 'wait'} />
              </Steps>
            </Card>

            {selectedInventory.items?.filter(i => i.dispositions && i.dispositions.length > 0).length > 0 && (
              <Card title="赔付汇总" size="small">
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic 
                      title="需赔付差异" 
                      value={selectedInventory.items?.filter(i => i.dispositions?.some(d => d.compensation_amount > 0)).length || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="已赔付" 
                      value={selectedInventory.items?.filter(i => i.dispositions?.some(d => d.compensation_amount > 0 && d.compensation_status === 'paid')).length || 0}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="已豁免" 
                      value={selectedInventory.items?.filter(i => i.dispositions?.some(d => d.compensation_status === 'waived')).length || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic 
                      title="赔付总额" 
                      value={selectedInventory.items?.reduce((sum, i) => 
                        sum + (i.dispositions?.reduce((s, d) => s + (d.compensation_amount || 0), 0) || 0), 0) || 0}
                      prefix="¥"
                    />
                  </Col>
                </Row>
              </Card>
            )}

            <Card 
              title="盘点明细" 
              size="small"
              extra={selectedInventory.status === 'draft' && selectedInventory.checked_by === user.id && (
                <Button type="primary" size="small" onClick={() => handleSubmit(selectedInventory.id)}>
                  提交盘点
                </Button>
              )}
            >
              <Table
                dataSource={selectedInventory.items || []}
                rowKey="id"
                size="small"
                pagination={false}
                expandable={{
                  expandedRowRender,
                  rowExpandable: (record) => record.difference_type !== 'none'
                }}
                scroll={{ y: 300 }}
                columns={[
                  { title: 'SKU', dataIndex: 'sku', width: 120 },
                  { title: '货品名称', dataIndex: 'product_name', width: 150 },
                  { title: '品类', dataIndex: 'category', width: 80 },
                  { title: '账面', dataIndex: 'expected_quantity', width: 60, align: 'center' },
                  { title: '实际', dataIndex: 'actual_quantity', width: 60, align: 'center' },
                  { 
                    title: '差异', 
                    dataIndex: 'difference_type', 
                    width: 80,
                    render: (type) => type !== 'none' && (
                      <Tag color={DIFFERENCE_TYPE[type]?.color}>
                        {DIFFERENCE_TYPE[type]?.label}
                      </Tag>
                    )
                  },
                  { 
                    title: '处理状态', 
                    dataIndex: 'dispositions',
                    width: 100,
                    render: (disps, record) => {
                      if (record.difference_type === 'none') return '-';
                      if (!disps || disps.length === 0) return <Tag color="orange">未处理</Tag>;
                      const allConfirmed = disps.every(d => d.responsibility_confirmed);
                      return allConfirmed ? <Tag color="green">已确认</Tag> : <Tag color="blue">处理中</Tag>;
                    }
                  },
                  { title: '备注', dataIndex: 'remarks', width: 100, ellipsis: true },
                  {
                    title: '操作',
                    width: 180,
                    render: (_, record) => (
                      <Space size="small">
                        {selectedInventory.status === 'draft' && selectedInventory.checked_by === user.id && (
                          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditItem(record)}>
                            编辑
                          </Button>
                        )}
                        {record.difference_type !== 'none' && ['reviewing', 'confirmed'].includes(selectedInventory.status) && (
                          <Popover
                            content={
                              <Space direction="vertical" size="small">
                                {(!record.dispositions || record.dispositions.length === 0) && user.role === 'after_sales' && (
                                  <Button type="link" size="small" icon={<WarningOutlined />} onClick={() => handleCreateDisposition(record)}>
                                    创建差异处理
                                  </Button>
                                )}
                                {(!record.dispositions || record.dispositions.length === 0) && user.role !== 'after_sales' && (
                                  <Text type="warning" style={{ fontSize: 12 }}>需售后创建差异处理</Text>
                                )}
                                {record.dispositions && record.dispositions.length > 0 && record.difference_type !== 'none' && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>点击展开行查看/操作</Text>
                                )}
                              </Space>
                            }
                            trigger="click"
                          >
                            <Button type="link" size="small">
                              处理 <DownOutlined />
                            </Button>
                          </Popover>
                        )}
                      </Space>
                    )
                  }
                ]}
              />
            </Card>

            <Card title="操作日志" size="small">
              <Timeline
                style={{ maxHeight: 200, overflow: 'auto' }}
                items={(selectedInventory.logs || []).map(log => ({
                  children: (
                    <div>
                      <Text strong>{log.action}</Text>
                      <div style={{ fontSize: 12 }}>
                        <Text type="secondary">{log.operator_name}</Text>
                        {' · '}
                        <Text type="secondary">{dayjs(log.created_at).format('MM-DD HH:mm')}</Text>
                      </div>
                    </div>
                  )
                }))}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default Inventory;
