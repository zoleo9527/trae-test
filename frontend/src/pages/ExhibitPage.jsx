import { useState, useEffect } from 'react'
import { Plus, MapPin, Check, ArrowRight, Package } from 'lucide-react'
import { exhibitAPI, transferAPI } from '../utils/api'

export default function ExhibitPage() {
  const [exhibits, setExhibits] = useState([])
  const [transfers, setTransfers] = useState([])
  const [showExhibitModal, setShowExhibitModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedExhibit, setSelectedExhibit] = useState(null)
  const [exhibitForm, setExhibitForm] = useState({
    name: '',
    code: '',
    artist: '',
    year: '',
    description: '',
    location: '',
    status: 'in_storage',
  })
  const [transferForm, setTransferForm] = useState({
    from_location: '',
    to_location: '',
    transfer_type: '',
    handler_name: '',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [exhibitsRes, transfersRes] = await Promise.all([
        exhibitAPI.getAll(),
        transferAPI.getAll(),
      ])
      setExhibits(exhibitsRes.data)
      setTransfers(transfersRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateExhibit = async (e) => {
    e.preventDefault()
    try {
      await exhibitAPI.create(exhibitForm)
      setShowExhibitModal(false)
      fetchData()
      setExhibitForm({
        name: '',
        code: '',
        artist: '',
        year: '',
        description: '',
        location: '',
        status: 'in_storage',
      })
    } catch (error) {
      console.error('Failed to create exhibit:', error)
    }
  }

  const handleCreateTransfer = async (e) => {
    e.preventDefault()
    if (!selectedExhibit) return
    try {
      await transferAPI.create({
        ...transferForm,
        exhibit_id: selectedExhibit.id,
      })
      setShowTransferModal(false)
      fetchData()
      setSelectedExhibit(null)
      setTransferForm({
        from_location: '',
        to_location: '',
        transfer_type: '',
        handler_name: '',
        notes: '',
      })
    } catch (error) {
      console.error('Failed to create transfer:', error)
    }
  }

  const handleConfirmTransfer = async (id) => {
    try {
      await transferAPI.confirm(id)
      fetchData()
    } catch (error) {
      console.error('Failed to confirm transfer:', error)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      in_storage: { class: 'bg-gray-100 text-gray-800', label: '库藏' },
      on_display: { class: 'bg-green-100 text-green-800', label: '展出中' },
      on_loan: { class: 'bg-blue-100 text-blue-800', label: '外借中' },
      in_transit: { class: 'bg-yellow-100 text-yellow-800', label: '运输中' },
      maintenance: { class: 'bg-orange-100 text-orange-800', label: '维护中' },
    }
    const info = statusMap[status] || statusMap.in_storage
    return <span className={`status-badge ${info.class}`}>{info.label}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">展品流转</h1>
          <p className="text-gray-500 mt-1">管理展品和流转记录</p>
        </div>
        <button
          onClick={() => setShowExhibitModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          新增展品
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">待确认流转</h2>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {transfers.filter((t) => !t.confirmed).length > 0 ? (
              transfers.filter((t) => !t.confirmed).map((transfer) => {
                const exhibit = exhibits.find((e) => e.id === transfer.exhibit_id)
                return (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="text-yellow-600" size={20} />
                      <div>
                        <p className="font-medium">{exhibit?.name || '未知展品'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          {transfer.from_location}
                          <ArrowRight size={14} />
                          {transfer.to_location}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfirmTransfer(transfer.id)}
                      className="btn btn-primary text-sm flex items-center gap-1"
                    >
                      <Check size={14} />
                      确认
                    </button>
                  </div>
                )
              })
            ) : (
              <p className="text-center text-gray-500 py-4">暂无待确认流转</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exhibits.map((exhibit) => (
          <div key={exhibit.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{exhibit.name}</h3>
                  <p className="text-sm text-gray-500">{exhibit.code}</p>
                </div>
                {getStatusBadge(exhibit.status)}
              </div>
              {exhibit.artist && (
                <p className="mt-2 text-sm text-gray-600">艺术家: {exhibit.artist}</p>
              )}
              {exhibit.year && (
                <p className="text-sm text-gray-600">年代: {exhibit.year}</p>
              )}
              <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <MapPin size={14} />
                <span>{exhibit.location || '未指定'}</span>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedExhibit(exhibit)
                    setTransferForm({ ...transferForm, from_location: exhibit.location || '' })
                    setShowTransferModal(true)
                  }}
                  className="btn btn-secondary text-sm w-full"
                >
                  发起流转
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showExhibitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新增展品</h2>
            <form onSubmit={handleCreateExhibit} className="space-y-4">
              <div>
                <label className="label">展品名称</label>
                <input
                  type="text"
                  className="input"
                  value={exhibitForm.name}
                  onChange={(e) => setExhibitForm({ ...exhibitForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">展品编号</label>
                <input
                  type="text"
                  className="input"
                  value={exhibitForm.code}
                  onChange={(e) => setExhibitForm({ ...exhibitForm, code: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">艺术家</label>
                  <input
                    type="text"
                    className="input"
                    value={exhibitForm.artist}
                    onChange={(e) => setExhibitForm({ ...exhibitForm, artist: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">年代</label>
                  <input
                    type="text"
                    className="input"
                    value={exhibitForm.year}
                    onChange={(e) => setExhibitForm({ ...exhibitForm, year: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">位置</label>
                <input
                  type="text"
                  className="input"
                  value={exhibitForm.location}
                  onChange={(e) => setExhibitForm({ ...exhibitForm, location: e.target.value })}
                />
              </div>
              <div>
                <label className="label">状态</label>
                <select
                  className="input"
                  value={exhibitForm.status}
                  onChange={(e) => setExhibitForm({ ...exhibitForm, status: e.target.value })}
                >
                  <option value="in_storage">库藏</option>
                  <option value="on_display">展出中</option>
                  <option value="on_loan">外借中</option>
                  <option value="maintenance">维护中</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowExhibitModal(false)}
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

      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">发起流转 - {selectedExhibit?.name}</h2>
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">源位置</label>
                  <input
                    type="text"
                    className="input"
                    value={transferForm.from_location}
                    onChange={(e) => setTransferForm({ ...transferForm, from_location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">目标位置</label>
                  <input
                    type="text"
                    className="input"
                    value={transferForm.to_location}
                    onChange={(e) => setTransferForm({ ...transferForm, to_location: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">流转类型</label>
                <input
                  type="text"
                  className="input"
                  value={transferForm.transfer_type}
                  onChange={(e) => setTransferForm({ ...transferForm, transfer_type: e.target.value })}
                  placeholder="如：布展、撤展"
                />
              </div>
              <div>
                <label className="label">经办人</label>
                <input
                  type="text"
                  className="input"
                  value={transferForm.handler_name}
                  onChange={(e) => setTransferForm({ ...transferForm, handler_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">备注</label>
                <textarea
                  className="input"
                  rows="2"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  发起流转
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
