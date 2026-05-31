import { useState, useEffect, useCallback } from 'react'
import { 
  Tabs, Table, Button, Space, Tag, Checkbox, Modal, Input, 
  Select, message, Row, Col, Card, Avatar, Divider, Badge, Tooltip, DatePicker
} from 'antd'
import {
  WarningOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  InfoCircleOutlined,
  BellOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { 
  checkinsAPI, 
  inspectionsAPI, 
  suppliesAPI, 
  statusHistoryAPI,
  renewalsAPI,
  notificationsAPI
} from '../services/api'
import useAuthStore from '../stores/useAuthStore'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const STATUS_LABEL_MAP = {
  missed: '漏打卡',
  late: '迟到',
  normal: '正常',
  verified: '已核实',
  rejected: '已驳回',
  pending: '待处理',
  approved: '已通过',
  completed: '已完成',
  followup: '待跟进',
  rectification: '需整改',
  passed: '已通过',
  extended: '已延期',
  none: '-'
}

const STATUS_COLOR_MAP = {
  missed: 'red',
  late: 'orange',
  normal: 'green',
  verified: 'blue',
  rejected: 'default',
  pending: 'orange',
  approved: 'green',
  completed: 'green',
  followup: 'blue',
  rectification: 'orange',
  passed: 'green',
  extended: 'orange',
  none: 'default'
}

function ReviewPanel() {
  const [activeTab, setActiveTab] = useState('checkins')
  const [selectedRows, setSelectedRows] = useState([])
  const [missedCheckins, setMissedCheckins] = useState([])
  const [pendingRectifications, setPendingRectifications] = useState([])
  const [lowStockSupplies, setLowStockSupplies] = useState([])
  const [supplyRequests, setSupplyRequests] = useState([])
  const [pendingFollowups, setPendingFollowups] = useState([])
  const [processModal, setProcessModal] = useState({ visible: false, type: '', data: [], presetStatus: '' })
  const [remark, setRemark] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [nextFollowupDate, setNextFollowupDate] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [relatedRequests, setRelatedRequests] = useState([])
  const [detailModal, setDetailModal] = useState({ visible: false, type: '', data: null })
  const [detailTab, setDetailTab] = useState('info')
  const [comments, setComments] = useState([])
  const [statusHistory, setStatusHistory] = useState([])
  const [newComment, setNewComment] = useState('')
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)

  const loadAllData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const handleBatchProcess = (type, items, presetStatus) => {
    setNewStatus(presetStatus)
    setRemark('')
    setNextFollowupDate(null)
    if (type === 'followups' && presetStatus === 'followup' && items.length > 0 && items[0].next_followup_date) {
      setNextFollowupDate(dayjs(items[0].next_followup_date))
    }
    setProcessModal({ visible: true, type, data: items, presetStatus })
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
        await checkinsAPI.batchProcess({ ids, status: newStatus, remark, processed_by: user.id })
      } else if (processModal.type === 'rectifications') {
        await inspectionsAPI.batchRectification({ ids, status: newStatus, remark, processed_by: user.id })
      } else if (processModal.type === 'supplies') {
        await suppliesAPI.batchProcessRequests({ ids, status: newStatus, remark, processed_by: user.id })
      } else if (processModal.type === 'followups') {
        if (newStatus === 'followup' && !nextFollowupDate) {
          message.warning('请选择下次跟进日期')
          setLoading(false)
          return
        }
        for (const id of ids) {
          await renewalsAPI.updateStatus(id, { 
            status: newStatus, 
            remark, 
            changed_by: user.id,
            next_followup_date: nextFollowupDate ? nextFollowupDate.format('YYYY-MM-DD') : null
          })
        }
      } else if (processModal.type === 'lowstock') {
        for (const item of processModal.data) {
          await suppliesAPI.createRequest({
            project_id: item.project_id,
            supply_id: item.id,
            requested_quantity: item.min_threshold * 2 - item.quantity,
            requested_by: user.id,
            remark: remark || '库存不足，自动补货申请'
          })
        }
      }
      message.success('批量处理成功')
      setProcessModal({ visible: false, type: '', data: [], presetStatus: '' })
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
    setComments([])
    setStatusHistory([])
    setNotifications([])
    setRelatedRequests([])
    setDetailTab('info')
    
    try {
      const historyType = type === 'supply_request' ? 'supply_request' : type
      
      if (type === 'supply') {
        const [commentsRes, relatedRes, notifRes] = await Promise.all([
          suppliesAPI.getComments(record.id, type),
          suppliesAPI.getRelatedRequests(record.id),
          notificationsAPI.getByRelated('supply', record.id)
        ])
        
        setComments(commentsRes.data)
        setRelatedRequests(relatedRes.data)
        setNotifications(notifRes.data)
        
        const allHistory = []
        const supplyHistory = await statusHistoryAPI.getHistory({
          related_type: 'supply',
          related_id: record.id
        })
        allHistory.push(...supplyHistory.data.map(h => ({ ...h, _source: '耗材本身' })))
        
        const seenCommentIds = new Set(commentsRes.data.map(c => c.id))
        const seenNotifIds = new Set(notifRes.data.map(n => n.id))
        
        for (const req of relatedRes.data) {
          const [reqComments, reqHistory, reqNotif] = await Promise.all([
            suppliesAPI.getComments(req.id, 'supply_request'),
            statusHistoryAPI.getHistory({ related_type: 'supply_request', related_id: req.id }),
            notificationsAPI.getByRelated('supply_request', req.id)
          ])
          allHistory.push(...reqHistory.data.map(h => ({ ...h, _source: `补货申请#${req.id}` })))
          
          const newComments = reqComments.data.filter(c => !seenCommentIds.has(c.id))
          newComments.forEach(c => seenCommentIds.add(c.id))
          setComments(prev => [...prev, ...newComments.map(c => ({ ...c, _source: `补货申请#${req.id}` }))])
          
          const newNotifs = reqNotif.data.filter(n => !seenNotifIds.has(n.id))
          newNotifs.forEach(n => seenNotifIds.add(n.id))
          setNotifications(prev => [...prev, ...newNotifs.map(n => ({ ...n, _source: `补货申请#${req.id}` }))])
        }
        
        allHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setStatusHistory(allHistory)
        
      } else if (type === 'supply_request') {
        const [commentsRes, historyRes, notifRes] = await Promise.all([
          suppliesAPI.getComments(record.id, type),
          statusHistoryAPI.getHistory({ related_type: 'supply_request', related_id: record.id }),
          notificationsAPI.getByRelated('supply_request', record.id)
        ])
        setComments(commentsRes.data)
        setStatusHistory(historyRes.data)
        setNotifications(notifRes.data)
        
      } else if (type === 'checkin') {
        const [commentsRes, historyRes, notifRes] = await Promise.all([
          checkinsAPI.getComments(record.id),
          statusHistoryAPI.getHistory({ related_type: 'checkin', related_id: record.id }),
          notificationsAPI.getByRelated('checkin', record.id)
        ])
        setComments(commentsRes.data)
        setStatusHistory(historyRes.data)
        setNotifications(notifRes.data)
        
      } else if (type === 'inspection') {
        const [commentsRes, historyRes, notifRes] = await Promise.all([
          inspectionsAPI.getComments(record.id),
          statusHistoryAPI.getHistory({ related_type: 'inspection', related_id: record.id }),
          notificationsAPI.getByRelated('inspection', record.id)
        ])
        setComments(commentsRes.data)
        setStatusHistory(historyRes.data)
        setNotifications(notifRes.data)
        
      } else if (type === 'renewal') {
        const [commentsRes, historyRes, notifRes] = await Promise.all([
          renewalsAPI.getComments(record.id),
          statusHistoryAPI.getHistory({ related_type: 'renewal', related_id: record.id }),
          notificationsAPI.getByRelated('renewal', record.id)
        ])
        setComments(commentsRes.data)
        setStatusHistory(historyRes.data)
        setNotifications(notifRes.data)
      }
    } catch (err) {
      console.error('加载详情失败', err)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) {
      message.warning('请输入备注内容')
      return
    }
    try {
      const typeMap = {
        checkin: checkinsAPI,
        inspection: inspectionsAPI,
        renewal: renewalsAPI,
        supply: suppliesAPI,
        supply_request: suppliesAPI
      }
      const api = typeMap[detailModal.type]
      if (api) {
        if (detailModal.type === 'supply' || detailModal.type === 'supply_request') {
          await api.addComment(detailModal.data.id, detailModal.type, { content: newComment, created_by: user.id })
          const res = await api.getComments(detailModal.data.id, detailModal.type)
          setComments(res.data)
        } else {
          await api.addComment(detailModal.data.id, { content: newComment, created_by: user.id })
          const res = await api.getComments(detailModal.data.id)
          setComments(res.data)
        }
      }
      setNewComment('')
      message.success('备注添加成功')
    } catch (err) {
      message.error('添加失败')
    }
  }

  const checkinColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', render: (t) => <strong>{t}</strong> },
    { title: '清洁员', dataIndex: 'cleaner_name', key: 'cleaner_name' },
    { title: '日期', dataIndex: 'schedule_date', key: 'schedule_date' },
    { title: '班次', dataIndex: 'shift_type', key: 'shift_type', render: (v) => v === 'day' ? '白班' : '夜班' },
    { title: '状态', key: 'status', render: () => <Tag color="red">漏打卡</Tag> },
    { title: '操作', key: 'action', render: (_, r) => <Button type="link" size="small" onClick={() => openDetail('checkin', r)}>详情</Button> }
  ]

  const rectificationColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', render: (t) => <strong>{t}</strong> },
    { title: '质检日期', dataIndex: 'inspection_date', key: 'inspection_date' },
    { title: '得分', dataIndex: 'score', key: 'score', render: (v) => <span style={{ color: v < 85 ? '#ff4d4f' : '#fa8c16' }}>{v}分</span> },
    { title: '问题', dataIndex: 'issues', key: 'issues', ellipsis: true },
    { title: '整改截止', dataIndex: 'rectification_deadline', key: 'rectification_deadline', render: (v) => {
      const isOverdue = dayjs(v).isBefore(dayjs(), 'day')
      return <span style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>{v}</span>
    }},
    { title: '操作', key: 'action', render: (_, r) => <Button type="link" size="small" onClick={() => openDetail('inspection', r)}>详情</Button> }
  ]

  const supplyRequestColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', render: (t) => <strong>{t}</strong> },
    { title: '耗材名称', dataIndex: 'supply_name', key: 'supply_name' },
    { title: '申请数量', dataIndex: 'requested_quantity', key: 'requested_quantity', render: (v, r) => `${v}${r.unit || ''}` },
    { title: '申请人', dataIndex: 'requester_name', key: 'requester_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v) => {
      const colors = { pending: 'orange', approved: 'green', rejected: 'red' }
      const labels = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
      return <Tag color={colors[v]}>{labels[v]}</Tag>
    }},
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '操作', key: 'action', render: (_, r) => <Button type="link" size="small" onClick={() => openDetail('supply_request', r)}>详情</Button> }
  ]

  const followupColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', render: (t) => <strong>{t}</strong> },
    { title: '客户', dataIndex: 'client_name', key: 'client_name' },
    { title: '满意度', dataIndex: 'satisfaction_score', key: 'satisfaction_score', render: (v) => `${v}星` },
    { title: '续约意向', dataIndex: 'renewal_intention', key: 'renewal_intention', render: (v) => {
      const colors = { high: 'green', medium: 'orange', low: 'red' }
      const labels = { high: '高', medium: '中', low: '低' }
      return <Tag color={colors[v]}>{labels[v]}</Tag>
    }},
    { title: '下次跟进', dataIndex: 'next_followup_date', key: 'next_followup_date' },
    { title: '合同到期', dataIndex: 'contract_end_date', key: 'contract_end_date' },
    { title: '操作', key: 'action', render: (_, r) => <Button type="link" size="small" onClick={() => openDetail('renewal', r)}>详情</Button> }
  ]

  const lowStockColumns = [
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name', render: (t) => <strong>{t}</strong> },
    { title: '耗材', dataIndex: 'name', key: 'name' },
    { title: '当前库存', key: 'current', render: (_, r) => (
      <span style={{ color: r.quantity < r.min_threshold ? '#ff4d4f' : 'inherit', fontWeight: 'bold' }}>
        {r.quantity}{r.unit}
      </span>
    )},
    { title: '预警值', key: 'threshold', render: (_, r) => `${r.min_threshold}${r.unit}` },
    { title: '缺口', key: 'gap', render: (_, r) => (
      <Tag color="red">缺 {r.min_threshold - r.quantity}{r.unit}</Tag>
    )},
    { title: '操作', key: 'action', render: (_, r) => <Button type="link" size="small" onClick={() => openDetail('supply', r)}>详情</Button> }
  ]

  const rowSelection = {
    selectedRowKeys: selectedRows.map(r => r.id),
    onChange: (_, rows) => setSelectedRows(rows)
  }

  const renderActionBar = (dataSource, onBatch, batchLabel, onReject, rejectLabel) => (
    <Card style={{ marginBottom: 16 }}>
      <Row align="middle" justify="space-between">
        <Col>
          <Space>
            <Checkbox
              indeterminate={selectedRows.length > 0 && selectedRows.length < dataSource.length}
              checked={selectedRows.length > 0 && selectedRows.length === dataSource.length}
              onChange={(e) => setSelectedRows(e.target.checked ? dataSource : [])}
            >
              全选
            </Checkbox>
            <span>已选 {selectedRows.length} 项</span>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<CheckCircleOutlined />} disabled={selectedRows.length === 0} onClick={() => onBatch()}>
              {batchLabel}
            </Button>
            {onReject && (
              <Button danger icon={<CloseCircleOutlined />} disabled={selectedRows.length === 0} onClick={() => onReject()}>
                {rejectLabel}
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  )

  const typeLabel = (t) => {
    const map = { checkins: '漏打卡', rectifications: '整改', supplies: '耗材申请', followups: '续约跟进', lowstock: '低库存补货' }
    return map[t] || t
  }

  const statusOptions = (type) => {
    if (type === 'checkins') return [<Option key="verified" value="verified">确认属实</Option>, <Option key="rejected" value="rejected">已补卡/驳回</Option>]
    if (type === 'rectifications') return [<Option key="completed" value="completed">整改完成</Option>, <Option key="extended" value="extended">申请延期</Option>]
    if (type === 'supplies') return [<Option key="approved" value="approved">通过</Option>, <Option key="rejected" value="rejected">驳回</Option>]
    if (type === 'followups') return [<Option key="completed" value="completed">已完成跟进</Option>, <Option key="followup" value="followup">更新跟进日期</Option>]
    if (type === 'lowstock') return [<Option key="approved" value="approved">确认并提交补货申请</Option>]
    return []
  }

  const tabItems = [
    {
      key: 'checkins',
      label: <Space><WarningOutlined style={{ color: '#ff4d4f' }} />漏打卡处理<Tag color="red">{missedCheckins.length}</Tag></Space>,
      children: (
        <>
          {renderActionBar(
            missedCheckins,
            () => handleBatchProcess('checkins', selectedRows, 'verified'),
            '批量确认',
            () => handleBatchProcess('checkins', selectedRows, 'rejected'),
            '批量驳回'
          )}
          <Table rowKey="id" columns={checkinColumns} dataSource={missedCheckins} rowSelection={rowSelection} pagination={{ pageSize: 10 }} />
        </>
      )
    },
    {
      key: 'rectifications',
      label: <Space><ClockCircleOutlined style={{ color: '#fa8c16' }} />整改追踪<Tag color="orange">{pendingRectifications.length}</Tag></Space>,
      children: (
        <>
          {renderActionBar(
            pendingRectifications,
            () => handleBatchProcess('rectifications', selectedRows, 'completed'),
            '标记整改完成',
            () => handleBatchProcess('rectifications', selectedRows, 'extended'),
            '申请延期'
          )}
          <Table rowKey="id" columns={rectificationColumns} dataSource={pendingRectifications} rowSelection={rowSelection} pagination={{ pageSize: 10 }} />
        </>
      )
    },
    {
      key: 'supplies',
      label: <Space><ShoppingCartOutlined style={{ color: '#722ed1' }} />耗材审批<Tag color="purple">{supplyRequests.length}</Tag></Space>,
      children: (
        <>
          {renderActionBar(
            supplyRequests,
            () => handleBatchProcess('supplies', selectedRows, 'approved'),
            '批量通过',
            () => handleBatchProcess('supplies', selectedRows, 'rejected'),
            '批量驳回'
          )}
          <Table rowKey="id" columns={supplyRequestColumns} dataSource={supplyRequests} rowSelection={rowSelection} pagination={{ pageSize: 10 }} />
        </>
      )
    },
    {
      key: 'lowstock',
      label: <Space><InboxOutlined style={{ color: '#faad14' }} />低库存补货<Tag color="orange">{lowStockSupplies.length}</Tag></Space>,
      children: (
        <>
          {renderActionBar(
            lowStockSupplies,
            () => handleBatchProcess('lowstock', selectedRows, 'approved'),
            '一键补货申请',
            null,
            null
          )}
          <Table rowKey="id" columns={lowStockColumns} dataSource={lowStockSupplies} rowSelection={rowSelection} pagination={{ pageSize: 10 }} />
        </>
      )
    },
    {
      key: 'followups',
      label: <Space><PhoneOutlined style={{ color: '#1890ff' }} />续约跟进<Tag color="blue">{pendingFollowups.length}</Tag></Space>,
      children: (
        <>
          {renderActionBar(
            pendingFollowups,
            () => handleBatchProcess('followups', selectedRows, 'completed'),
            '标记已完成跟进',
            () => handleBatchProcess('followups', selectedRows, 'followup'),
            '更新跟进日期'
          )}
          <Table rowKey="id" columns={followupColumns} dataSource={pendingFollowups} rowSelection={rowSelection} pagination={{ pageSize: 10 }} />
        </>
      )
    }
  ]

  const detailFieldLabels = {
    project_name: '项目',
    cleaner_name: '清洁员',
    schedule_date: '日期',
    shift_type: '班次',
    checkin_time: '打卡时间',
    checkout_time: '签退时间',
    inspection_date: '质检日期',
    score: '得分',
    issues: '问题',
    rectification_deadline: '整改截止',
    client_name: '客户',
    client_contact: '对接人',
    satisfaction_score: '满意度',
    feedback: '反馈',
    renewal_intention: '续约意向',
    next_followup_date: '下次跟进',
    contract_end_date: '合同到期',
    name: '耗材',
    supply_name: '耗材',
    quantity: '库存',
    unit: '单位',
    min_threshold: '预警值',
    requested_quantity: '申请数量',
    requester_name: '申请人',
    approver_name: '审批人',
    visitor_name: '回访人',
    status: '状态'
  }

  return (
    <div>
      <Card title="批量复核面板" extra={<Button type="primary" onClick={loadAllData}>刷新数据</Button>}>
        <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); setSelectedRows([]) }} items={tabItems} />
      </Card>

      <Modal
        title={`批量处理 - ${typeLabel(processModal.type)}`}
        open={processModal.visible}
        onOk={confirmBatchProcess}
        onCancel={() => setProcessModal({ visible: false, type: '', data: [], presetStatus: '' })}
        confirmLoading={loading}
        width={600}
      >
        <p>已选择 <strong>{processModal.data.length}</strong> 条记录进行处理：</p>
        <div style={{ maxHeight: 150, overflow: 'auto', background: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 16 }}>
          {processModal.data.map(item => (
            <div key={item.id}>• {item.project_name || item.supply_name || item.client_name || item.name}</div>
          ))}
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <label>处理结果：</label>
            <Select value={newStatus} onChange={setNewStatus} style={{ width: 240, marginLeft: 8 }}>
              {statusOptions(processModal.type)}
            </Select>
          </div>
          {processModal.type === 'followups' && newStatus === 'followup' && (
            <div>
              <label style={{ color: '#ff4d4f' }}>* </label>
              <label>下次跟进日期：</label>
              <DatePicker 
                value={nextFollowupDate} 
                onChange={setNextFollowupDate}
                style={{ width: 240, marginLeft: 8 }}
                placeholder="请选择下次跟进日期"
              />
            </div>
          )}
          <div>
            <label>备注说明：</label>
            <TextArea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} placeholder="请输入处理备注（可选）" style={{ marginTop: 8 }} />
          </div>
        </Space>
      </Modal>

      <Modal
        title={`详情与留痕 - ${detailModal.type === 'supply' ? '低库存耗材' : detailModal.type === 'supply_request' ? '补货申请' : detailModal.type === 'checkin' ? '打卡记录' : detailModal.type === 'inspection' ? '质检记录' : '续约回访'}`}
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, type: '', data: null })}
        footer={null}
        width={780}
      >
        {detailModal.data && (
          <Tabs activeKey={detailTab} onChange={setDetailTab} size="small">
            <Tabs.TabPane tab={<Space><InfoCircleOutlined />基本信息</Space>} key="info">
              <Card size="small">
                <Row gutter={[16, 8]}>
                  {Object.entries(detailModal.data).filter(([k]) => detailFieldLabels[k]).slice(0, 12).map(([key, value]) => (
                    <Col span={8} key={key}>
                      <span style={{ color: '#999' }}>{detailFieldLabels[key]}：</span>
                      <strong>{key === 'shift_type' ? (value === 'day' ? '白班' : '夜班') : String(value ?? '-')}</strong>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Tabs.TabPane>

            {detailModal.type === 'supply' && relatedRequests.length > 0 && (
              <Tabs.TabPane tab={<Space><FileTextOutlined />关联补货申请 ({relatedRequests.length})</Space>} key="requests">
                <Card size="small">
                  {relatedRequests.map(req => (
                    <div key={req.id} style={{ marginBottom: 12, padding: 12, background: '#fafafa', borderRadius: 4 }}>
                      <Row gutter={[16, 4]}>
                        <Col span={6}>
                          <span style={{ color: '#999' }}>申请编号：</span>
                          <strong>#{req.id}</strong>
                        </Col>
                        <Col span={6}>
                          <span style={{ color: '#999' }}>申请数量：</span>
                          <strong>{req.requested_quantity}{req.unit}</strong>
                        </Col>
                        <Col span={6}>
                          <span style={{ color: '#999' }}>申请人：</span>
                          <strong>{req.requester_name}</strong>
                        </Col>
                        <Col span={6}>
                          <span style={{ color: '#999' }}>状态：</span>
                          <Tag color={req.status === 'pending' ? 'orange' : req.status === 'approved' ? 'green' : 'red'}>
                            {req.status === 'pending' ? '待审批' : req.status === 'approved' ? '已通过' : '已驳回'}
                          </Tag>
                        </Col>
                        <Col span={24}>
                          <span style={{ color: '#999' }}>申请时间：</span>
                          <span>{dayjs(req.created_at).format('YYYY-MM-DD HH:mm')}</span>
                        </Col>
                        {req.remark && (
                          <Col span={24}>
                            <span style={{ color: '#999' }}>备注：</span>
                            <span>{req.remark}</span>
                          </Col>
                        )}
                      </Row>
                    </div>
                  ))}
                </Card>
              </Tabs.TabPane>
            )}

            <Tabs.TabPane tab={<Space><ClockCircleOutlined />状态历史 ({statusHistory.length})</Space>} key="history">
              <Card size="small">
                {statusHistory.length > 0 ? (
                  statusHistory.map((h, idx) => (
                    <div key={idx} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' }}>
                      <Space wrap>
                        {h._source && <Tag color="purple">{h._source}</Tag>}
                        <Tag color={STATUS_COLOR_MAP[h.old_status] || 'default'}>{STATUS_LABEL_MAP[h.old_status] || h.old_status}</Tag>
                        <span style={{ color: '#999' }}>→</span>
                        <Tag color={STATUS_COLOR_MAP[h.new_status] || 'blue'}>{STATUS_LABEL_MAP[h.new_status] || h.new_status}</Tag>
                        <Badge count={h.changer_name} style={{ backgroundColor: '#1890ff', fontSize: 11 }} />
                        <span style={{ color: '#999', fontSize: 12 }}>{dayjs(h.created_at).format('YYYY-MM-DD HH:mm')}</span>
                      </Space>
                      {h.remark && <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>备注：{h.remark}</div>}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 12 }}>暂无变更记录</div>
                )}
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<Space><CommentOutlined />备注交流 ({comments.length})</Space>} key="comments">
              <Card size="small">
                <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                  <Input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="添加备注..." onPressEnter={addComment} />
                  <Button type="primary" onClick={addComment}>发送</Button>
                </Space.Compact>
                {comments.length > 0 ? (
                  comments.map(c => (
                    <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <Space align="start">
                        <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{c.creator_name?.[0]}</Avatar>
                        <div style={{ flex: 1 }}>
                          <div>
                            <strong>{c.creator_name}</strong>
                            <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>{dayjs(c.created_at).format('YYYY-MM-DD HH:mm')}</span>
                            {c._source && <Tag color="purple" style={{ marginLeft: 8 }}>{c._source}</Tag>}
                          </div>
                          <div style={{ marginTop: 4 }}>{c.content}</div>
                        </div>
                      </Space>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 12 }}>暂无备注</div>
                )}
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab={<Space><BellOutlined />通知提醒 ({notifications.length})</Space>} key="notifications">
              <Card size="small">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <Space align="start">
                        <BellOutlined style={{ color: n.is_read ? '#999' : '#1890ff', marginTop: 4 }} />
                        <div style={{ flex: 1 }}>
                          <div>
                            <strong style={{ fontWeight: n.is_read ? 'normal' : 'bold' }}>{n.title}</strong>
                            {n._source && <Tag color="purple" style={{ marginLeft: 8 }}>{n._source}</Tag>}
                            <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>{dayjs(n.created_at).format('YYYY-MM-DD HH:mm')}</span>
                          </div>
                          <div style={{ marginTop: 4, color: '#666' }}>{n.content}</div>
                        </div>
                      </Space>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 12 }}>暂无通知</div>
                )}
              </Card>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Modal>
    </div>
  )
}

export default ReviewPanel
