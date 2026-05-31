import { useState, useEffect } from 'react'
import { 
  Tabs, Table, Button, Space, Tag, Checkbox, Modal, Input, 
  Select, message, Row, Col, Card, Avatar, Tooltip, Divider
} from 'antd'
import {
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined
} from '@ant-design/icons'
import { 
  checkinsAPI, 
  inspectionsAPI, 
  suppliesAPI, 
  statusHistoryAPI,
  renewalsAPI
} from '../services/api'
import useAuthStore from '../stores/useAuthStore'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

function ReviewPanel() {
  const [activeTab, setActiveTab] = useState('checkins')
  const [selectedRows, setSelectedRows] = useState([])
  const [missedCheckins, setMissedCheckins] = useState([])
  const [pendingRectifications, setPendingRectifications] = useState([])
  const [lowStockSupplies, setLowStockSupplies] = useState([])
  const [supplyRequests, setSupplyRequests] = useState([])
  const [pendingFollowups, setPendingFollowups] = useState([])
  const [processModal, setProcessModal] = useState({ visible: false, type: '', data: [] })
  const [remark, setRemark] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [detailModal, setDetailModal] = useState({ visible: false, type: '', data: null })
  const [comments, setComments] = useState([])
  const [statusHistory, setStatusHistory] = useState([])
  const [newComment, setNewComment] = useState('')
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      const [missedRes, rectRes, suppliesRes, requestsRes, followupsRes] = await Promise.all([
        checkinsAPI.getMissedCheckins(14),
        inspectionsAPI.getPendingRectifications(),
        suppliesAPI.getLowStock(),
        suppliesAPI.getRequests({ status: 'pending' }),
        renewalsAPI.getPendingFollowups()
      ])
      setMissedCheckins(missedRes.data)
      setPendingRectifications(rectRes.data)
      setLowStockSupplies(suppliesRes.data)
      setSupplyRequests(requestsRes.data)
      setPendingFollowups(followupsRes.data)
    } catch (err) {
      message.error('加载数据失败')
    }
  }

  const handleBatchProcess = (type, items) => {
    setProcessModal({
      visible: true,
      type,
      data: items
    })
    setRemark('')
    if (type === 'checkins') {
      setNewStatus('verified')
    } else if (type === 'rectifications') {
      setNewStatus('completed')
    } else if (type === 'supplies') {
      setNewStatus('approved')
    }
  }

  const confirmBatchProcess = async () => {
    if (!newStatus) {
      message.warning('请选择处理结果')
      return
    }
    setLoading(true)
    try {
      const ids = processModal.data.map(item => item.id)
      if (processModal.type === 'checkins') {
        await checkinsAPI.batchProcess({
          ids,
          status: newStatus,
          remark,
          processed_by: user.id
        })
      } else if (processModal.type === 'rectifications') {
        await inspectionsAPI.batchRectification({
          ids,
          status: newStatus,
          remark,
          processed_by: user.id
        })
      } else if (processModal.type === 'supplies') {
        await suppliesAPI.batchProcessRequests({
          ids,
          status: newStatus,
          remark,
          processed_by: user.id
        })
      }
      message.success('批量处理成功')
      setProcessModal({ visible: false, type: '', data: [] })
      setSelectedRows([])
      loadAllData()
    } catch (err) {
      message.error('处理失败')
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (type, record) => {
    setDetailModal({ visible: true, type, data: record })
    try {
      let commentsRes
      if (type === 'checkin') {
        commentsRes = await checkinsAPI.getComments(record.id)
      } else if (type === 'inspection') {
        commentsRes = await inspectionsAPI.getComments(record.id)
      } else if (type === 'renewal') {
        commentsRes = await renewalsAPI.getComments(record.id)
      }
      if (commentsRes) setComments(commentsRes.data)

      const historyRes = await statusHistoryAPI.getHistory({
        related_type: type,
        related_id: record.id
      })
      setStatusHistory(historyRes.data)
    } catch (err) {
      console.error('加载详情失败')
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) {
      message.warning('请输入评论内容')
      return
    }
    try {
      if (detailModal.type === 'checkin') {
        await checkinsAPI.addComment(detailModal.data.id, {
          content: newComment,
          created_by: user.id
        })
        const res = await checkinsAPI.getComments(detailModal.data.id)
        setComments(res.data)
      } else if (detailModal.type === 'inspection') {
        await inspectionsAPI.addComment(detailModal.data.id, {
          content: newComment,
          created_by: user.id
        })
        const res = await inspectionsAPI.getComments(detailModal.data.id)
        setComments(res.data)
      } else if (detailModal.type === 'renewal') {
        await renewalsAPI.addComment(detailModal.data.id, {
          content: newComment,
          created_by: user.id
        })
        const res = await renewalsAPI.getComments(detailModal.data.id)
        setComments(res.data)
      }
      setNewComment('')
      message.success('评论添加成功')
    } catch (err) {
      message.error('添加失败')
    }
  }

  const checkinColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '清洁员',
      dataIndex: 'cleaner_name',
      key: 'cleaner_name'
    },
    {
      title: '日期',
      dataIndex: 'schedule_date',
      key: 'schedule_date'
    },
    {
      title: '班次',
      dataIndex: 'shift_type',
      key: 'shift_type',
      render: (val) => val === 'day' ? '白班' : '夜班'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="red">漏打卡</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openDetail('checkin', record)}>
            详情
          </Button>
        </Space>
      )
    }
  ]

  const rectificationColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '质检日期',
      dataIndex: 'inspection_date',
      key: 'inspection_date'
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      render: (val) => <span style={{ color: val < 85 ? '#ff4d4f' : '#fa8c16' }}>{val}分</span>
    },
    {
      title: '问题',
      dataIndex: 'issues',
      key: 'issues',
      ellipsis: true
    },
    {
      title: '整改截止',
      dataIndex: 'rectification_deadline',
      key: 'rectification_deadline',
      render: (val) => {
        const isOverdue = dayjs(val).isBefore(dayjs(), 'day')
        return <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>{val}</span>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openDetail('inspection', record)}>
            详情
          </Button>
        </Space>
      )
    }
  ]

  const supplyRequestColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '耗材名称',
      dataIndex: 'supply_name',
      key: 'supply_name'
    },
    {
      title: '申请数量',
      dataIndex: 'requested_quantity',
      key: 'requested_quantity',
      render: (val, record) => `${val}${record.unit}`
    },
    {
      title: '申请人',
      dataIndex: 'requester_name',
      key: 'requester_name'
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true
    }
  ]

  const followupColumns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '客户',
      dataIndex: 'client_name',
      key: 'client_name'
    },
    {
      title: '满意度',
      dataIndex: 'satisfaction_score',
      key: 'satisfaction_score',
      render: (val) => `${val}星`
    },
    {
      title: '续约意向',
      dataIndex: 'renewal_intention',
      key: 'renewal_intention',
      render: (val) => {
        const colors = { high: 'green', medium: 'orange', low: 'red' }
        const labels = { high: '高', medium: '中', low: '低' }
        return <Tag color={colors[val]}>{labels[val]}</Tag>
      }
    },
    {
      title: '下次跟进',
      dataIndex: 'next_followup_date',
      key: 'next_followup_date'
    },
    {
      title: '合同到期',
      dataIndex: 'contract_end_date',
      key: 'contract_end_date'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openDetail('renewal', record)}>
            详情
          </Button>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys: selectedRows.map(r => r.id),
    onChange: (_, rows) => setSelectedRows(rows)
  }

  const tabItems = [
    {
      key: 'checkins',
      label: (
        <Space>
          <WarningOutlined style={{ color: '#ff4d4f' }} />
          漏打卡处理
          <Tag color="red" size="small">{missedCheckins.length}</Tag>
        </Space>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < missedCheckins.length}
                    checked={selectedRows.length > 0 && selectedRows.length === missedCheckins.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(missedCheckins)
                      } else {
                        setSelectedRows([])
                      }
                    }}
                  >
                    全选
                  </Checkbox>
                  <span>已选 {selectedRows.length} 项</span>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />}
                    disabled={selectedRows.length === 0}
                    onClick={() => handleBatchProcess('checkins', selectedRows)}
                  >
                    批量确认
                  </Button>
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    disabled={selectedRows.length === 0}
                    onClick={() => {
                      setNewStatus('rejected')
                      handleBatchProcess('checkins', selectedRows)
                    }}
                  >
                    批量驳回
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
          <Table
            rowKey="id"
            columns={checkinColumns}
            dataSource={missedCheckins}
            rowSelection={rowSelection}
            pagination={{ pageSize: 10 }}
          />
        </>
      )
    },
    {
      key: 'rectifications',
      label: (
        <Space>
          <ClockCircleOutlined style={{ color: '#fa8c16' }} />
          整改追踪
          <Tag color="orange" size="small">{pendingRectifications.length}</Tag>
        </Space>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < pendingRectifications.length}
                    checked={selectedRows.length > 0 && selectedRows.length === pendingRectifications.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(pendingRectifications)
                      } else {
                        setSelectedRows([])
                      }
                    }}
                  >
                    全选
                  </Checkbox>
                  <span>已选 {selectedRows.length} 项</span>
                </Space>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  disabled={selectedRows.length === 0}
                  onClick={() => handleBatchProcess('rectifications', selectedRows)}
                >
                  标记整改完成
                </Button>
              </Col>
            </Row>
          </Card>
          <Table
            rowKey="id"
            columns={rectificationColumns}
            dataSource={pendingRectifications}
            rowSelection={rowSelection}
            pagination={{ pageSize: 10 }}
          />
        </>
      )
    },
    {
      key: 'supplies',
      label: (
        <Space>
          <InboxOutlined style={{ color: '#faad14' }} />
          耗材审批
          <Tag color="orange" size="small">{supplyRequests.length}</Tag>
        </Space>
      ),
      children: (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Checkbox
                    indeterminate={selectedRows.length > 0 && selectedRows.length < supplyRequests.length}
                    checked={selectedRows.length > 0 && selectedRows.length === supplyRequests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(supplyRequests)
                      } else {
                        setSelectedRows([])
                      }
                    }}
                  >
                    全选
                  </Checkbox>
                  <span>已选 {selectedRows.length} 项</span>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<CheckCircleOutlined />}
                    disabled={selectedRows.length === 0}
                    onClick={() => {
                      setNewStatus('approved')
                      handleBatchProcess('supplies', selectedRows)
                    }}
                  >
                    批量通过
                  </Button>
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    disabled={selectedRows.length === 0}
                    onClick={() => {
                      setNewStatus('rejected')
                      handleBatchProcess('supplies', selectedRows)
                    }}
                  >
                    批量驳回
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
          <Table
            rowKey="id"
            columns={supplyRequestColumns}
            dataSource={supplyRequests}
            rowSelection={rowSelection}
            pagination={{ pageSize: 10 }}
          />
        </>
      )
    },
    {
      key: 'followups',
      label: (
        <Space>
          <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
          续约跟进
          <Tag color="blue" size="small">{pendingFollowups.length}</Tag>
        </Space>
      ),
      children: (
        <Table
          rowKey="id"
          columns={followupColumns}
          dataSource={pendingFollowups}
          pagination={{ pageSize: 10 }}
        />
      )
    }
  ]

  return (
    <div>
      <Card 
        title="批量复核面板" 
        extra={
          <Button type="primary" onClick={loadAllData}>
            刷新数据
          </Button>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => {
            setActiveTab(key)
            setSelectedRows([])
          }}
          items={tabItems}
        />
      </Card>

      <Modal
        title={`批量处理 - ${processModal.type === 'checkins' ? '漏打卡' : processModal.type === 'rectifications' ? '整改' : '耗材申请'}`}
        open={processModal.visible}
        onOk={confirmBatchProcess}
        onCancel={() => setProcessModal({ visible: false, type: '', data: [] })}
        confirmLoading={loading}
        width={600}
      >
        <p>已选择 <strong>{processModal.data.length}</strong> 条记录进行处理：</p>
        <div style={{ maxHeight: 150, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 16 }}>
          {processModal.data.map(item => (
            <div key={item.id}>
              • {item.project_name || item.supply_name || item.client_name}
            </div>
          ))}
        </div>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>处理结果：</label>
            <Select 
              value={newStatus} 
              onChange={setNewStatus}
              style={{ width: 200, marginLeft: 8 }}
            >
              {processModal.type === 'checkins' && (
                <>
                  <Option value="verified">确认属实</Option>
                  <Option value="rejected">已补卡/驳回</Option>
                </>
              )}
              {processModal.type === 'rectifications' && (
                <>
                  <Option value="completed">整改完成</Option>
                  <Option value="extended">申请延期</Option>
                </>
              )}
              {processModal.type === 'supplies' && (
                <>
                  <Option value="approved">通过</Option>
                  <Option value="rejected">驳回</Option>
                </>
              )}
            </Select>
          </div>
          <div>
            <label>备注说明：</label>
            <TextArea 
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder="请输入处理备注（可选）"
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      <Modal
        title="详情查看"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, type: '', data: null })}
        footer={null}
        width={700}
      >
        {detailModal.data && (
          <>
            <Card size="small" title="基本信息">
              {Object.entries(detailModal.data).slice(0, 8).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 8 }}>
                  <strong>{key}：</strong>{String(value || '-')}
                </div>
              ))}
            </Card>

            <Divider />

            <Card size="small" title="状态变更历史">
              {statusHistory.length > 0 ? (
                statusHistory.map((h, idx) => (
                  <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                    <Space>
                      <Tag>{h.old_status} → {h.new_status}</Tag>
                      <span>{h.changer_name}</span>
                      <span style={{ color: '#999' }}>{dayjs(h.created_at).format('YYYY-MM-DD HH:mm')}</span>
                    </Space>
                    {h.remark && <div style={{ marginTop: 4, color: '#666' }}>备注：{h.remark}</div>}
                  </div>
                ))
              ) : (
                <div style={{ color: '#999' }}>暂无变更记录</div>
              )}
            </Card>

            <Divider />

            <Card size="small" title="备注交流">
              <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                <Input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="添加备注..."
                  onPressEnter={addComment}
                />
                <Button type="primary" onClick={addComment}>发送</Button>
              </Space.Compact>
              {comments.length > 0 ? (
                comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <Space align="start">
                      <Avatar size="small">{c.creator_name?.[0]}</Avatar>
                      <div style={{ flex: 1 }}>
                        <div>
                          <strong>{c.creator_name}</strong>
                          <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                            {dayjs(c.created_at).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </div>
                        <div style={{ marginTop: 4 }}>{c.content}</div>
                      </div>
                    </Space>
                  </div>
                ))
              ) : (
                <div style={{ color: '#999' }}>暂无备注</div>
              )}
            </Card>
          </>
        )}
      </Modal>
    </div>
  )
}

export default ReviewPanel
