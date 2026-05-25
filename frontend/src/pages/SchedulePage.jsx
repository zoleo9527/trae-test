import { useState, useEffect } from 'react'
import { Plus, Clock, MapPin, ClipboardList } from 'lucide-react'
import { scheduleAPI, userAPI } from '../utils/api'

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    volunteer_id: '',
    date: '',
    shift_start: '',
    shift_end: '',
    location: '',
    task_description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [schedulesRes, volunteersRes] = await Promise.all([
        scheduleAPI.getAll(),
        userAPI.getVolunteers(),
      ])
      setSchedules(schedulesRes.data)
      setVolunteers(volunteersRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dateTime = new Date(formData.date)
      await scheduleAPI.create({
        ...formData,
        volunteer_id: parseInt(formData.volunteer_id),
        date: dateTime.toISOString(),
        shift_start: new Date(`${formData.date}T${formData.shift_start}`).toISOString(),
        shift_end: new Date(`${formData.date}T${formData.shift_end}`).toISOString(),
      })
      setShowModal(false)
      fetchData()
      setFormData({
        volunteer_id: '',
        date: '',
        shift_start: '',
        shift_end: '',
        location: '',
        task_description: '',
      })
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await scheduleAPI.update(id, { status })
      fetchData()
    } catch (error) {
      console.error('Failed to update schedule:', error)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { class: 'status-pending', label: '待确认' },
      confirmed: { class: 'status-confirmed', label: '已确认' },
      cancelled: { class: 'status-rejected', label: '已取消' },
      completed: { class: 'status-resolved', label: '已完成' },
    }
    const info = statusMap[status] || statusMap.pending
    return <span className={`status-badge ${info.class}`}>{info.label}</span>
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getVolunteerName = (id) => {
    const volunteer = volunteers.find((v) => v.id === id)
    return volunteer?.name || '未知'
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
          <h1 className="text-2xl font-bold text-gray-900">志愿者排班</h1>
          <p className="text-gray-500 mt-1">管理志愿者的排班和出勤</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增排班
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{getVolunteerName(schedule.volunteer_id)}</h3>
                    {getStatusBadge(schedule.status)}
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{formatDate(schedule.date)} {formatTime(schedule.shift_start)} - {formatTime(schedule.shift_end)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{schedule.location || '未指定'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} />
                      <span>{schedule.task_description || '未指定'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {schedule.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(schedule.id, 'confirmed')}
                        className="btn btn-primary text-sm"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(schedule.id, 'cancelled')}
                        className="btn btn-danger text-sm"
                      >
                        取消
                      </button>
                    </>
                  )}
                  {schedule.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(schedule.id, 'completed')}
                      className="btn btn-primary text-sm"
                    >
                      完成
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新增排班</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">志愿者</label>
                <select
                  className="input"
                  value={formData.volunteer_id}
                  onChange={(e) => setFormData({ ...formData, volunteer_id: e.target.value })}
                  required
                >
                  <option value="">选择志愿者</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">日期</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">开始时间</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.shift_start}
                    onChange={(e) => setFormData({ ...formData, shift_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">结束时间</label>
                  <input
                    type="time"
                    className="input"
                    value={formData.shift_end}
                    onChange={(e) => setFormData({ ...formData, shift_end: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">工作地点</label>
                <input
                  type="text"
                  className="input"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="如：主展厅A区"
                />
              </div>
              <div>
                <label className="label">工作内容</label>
                <textarea
                  className="input"
                  value={formData.task_description}
                  onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                  rows="2"
                  placeholder="如：导览讲解"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
