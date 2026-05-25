import { useState, useEffect } from 'react'
import { Plus, Clock, MapPin, Users, Ticket, Check, X } from 'lucide-react'
import { activityAPI, ticketAPI } from '../utils/api'

export default function ActivityPage() {
  const [activities, setActivities] = useState([])
  const [tickets, setTickets] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activityForm, setActivityForm] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
  })
  const [ticketForm, setTicketForm] = useState({
    ticket_code: '',
    visitor_name: '',
    visitor_phone: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [activitiesRes, ticketsRes] = await Promise.all([
        activityAPI.getAll(),
        ticketAPI.getAll(),
      ])
      setActivities(activitiesRes.data)
      setTickets(ticketsRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateActivity = async (e) => {
    e.preventDefault()
    try {
      await activityAPI.create({
        ...activityForm,
        start_time: new Date(activityForm.start_time).toISOString(),
        end_time: new Date(activityForm.end_time).toISOString(),
        max_participants: activityForm.max_participants ? parseInt(activityForm.max_participants) : null,
      })
      setShowActivityModal(false)
      fetchData()
      setActivityForm({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        max_participants: '',
      })
    } catch (error) {
      console.error('Failed to create activity:', error)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!selectedActivity) return
    try {
      await ticketAPI.create({
        ...ticketForm,
        activity_id: selectedActivity.id,
      })
      setShowTicketModal(false)
      fetchData()
      setSelectedActivity(null)
      setTicketForm({
        ticket_code: '',
        visitor_name: '',
        visitor_phone: '',
      })
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  const handleVerifyTicket = async (id) => {
    try {
      await ticketAPI.verify(id, '管理员')
      fetchData()
    } catch (error) {
      console.error('Failed to verify ticket:', error)
    }
  }

  const handleRejectTicket = async (id) => {
    try {
      await ticketAPI.reject(id, '管理员')
      fetchData()
    } catch (error) {
      console.error('Failed to reject ticket:', error)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { class: 'bg-gray-100 text-gray-800', label: '草稿' },
      published: { class: 'bg-blue-100 text-blue-800', label: '已发布' },
      ongoing: { class: 'bg-green-100 text-green-800', label: '进行中' },
      completed: { class: 'bg-purple-100 text-purple-800', label: '已完成' },
      cancelled: { class: 'bg-red-100 text-red-800', label: '已取消' },
    }
    const info = statusMap[status] || statusMap.draft
    return <span className={`status-badge ${info.class}`}>{info.label}</span>
  }

  const getTicketStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', label: '待核销' },
      verified: { class: 'status-confirmed', label: '已核销' },
      rejected: { class: 'status-rejected', label: '已驳回' },
    }
    const info = statusMap[status] || statusMap.pending
    return <span className={`status-badge ${info.class}`}>{info.label}</span>
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">活动核销</h1>
          <p className="text-gray-500 mt-1">管理活动和门票核销</p>
        </div>
        <button
          onClick={() => setShowActivityModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增活动
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activities.map((activity) => {
          const activityTickets = tickets.filter((t) => t.activity_id === activity.id)
          const pendingTickets = activityTickets.filter((t) => t.verification_status === 'pending')
          return (
            <div key={activity.id} className="card">
              <div className="card-header">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{activity.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDate(activity.start_time)} {formatTime(activity.start_time)} - {formatTime(activity.end_time)}</span>
                      </div>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <MapPin size={14} />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(activity.status)}
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Ticket size={14} />
                      <span>{activityTickets.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-body">
                {activity.description && (
                  <p className="text-gray-600 text-sm mb-4">{activity.description}</p>
                )}
                
                {pendingTickets.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">待核销门票 ({pendingTickets.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pendingTickets.slice(0, 5).map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{ticket.ticket_code}</p>
                            <p className="text-xs text-gray-500">{ticket.visitor_name || '匿名'}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleVerifyTicket(ticket.id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleRejectTicket(ticket.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedActivity(activity)
                    setTicketForm({ ...ticketForm, ticket_code: `TKT${activity.id}-${activityTickets.length + 1}` })
                    setShowTicketModal(true)
                  }}
                  className="btn btn-secondary text-sm w-full"
                >
                  新增门票
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新增活动</h2>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <label className="label">活动名称</label>
                <input
                  type="text"
                  className="input"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">活动描述</label>
                <textarea
                  className="input"
                  rows="2"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">开始时间</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={activityForm.start_time}
                    onChange={(e) => setActivityForm({ ...activityForm, start_time: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">结束时间</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={activityForm.end_time}
                    onChange={(e) => setActivityForm({ ...activityForm, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">地点</label>
                  <input
                    type="text"
                    className="input"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">最大参与人数</label>
                  <input
                    type="number"
                    className="input"
                    value={activityForm.max_participants}
                    onChange={(e) => setActivityForm({ ...activityForm, max_participants: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新增门票 - {selectedActivity?.name}</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="label">票号</label>
                <input
                  type="text"
                  className="input"
                  value={ticketForm.ticket_code}
                  onChange={(e) => setTicketForm({ ...ticketForm, ticket_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">访客姓名</label>
                <input
                  type="text"
                  className="input"
                  value={ticketForm.visitor_name}
                  onChange={(e) => setTicketForm({ ...ticketForm, visitor_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">联系电话</label>
                <input
                  type="text"
                  className="input"
                  value={ticketForm.visitor_phone}
                  onChange={(e) => setTicketForm({ ...ticketForm, visitor_phone: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
