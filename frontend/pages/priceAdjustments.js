import { useEffect, useState } from 'react'

const STATUS_LABEL = {
  PENDING: '待处理',
  WEIGHED: '已过磅',
  SORTED: '已分拣入库',
  PRICE_ADJUSTED: '价格已调整',
  SETTLED: '已结算',
  REJECTED: '已驳回',
}

const ADJ_STATUS_LABEL = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
}

export default function PriceAdjustmentsPage() {
  const [orders, setOrders] = useState([])
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ adjustedPrice: '', reason: '' })
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [tab, setTab] = useState('orders')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch {}
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, adjRes] = await Promise.all([
        fetch('/api/collections?pageSize=50', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        }),
        fetch('/api/price-adjustments?pageSize=50', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        }),
      ])
      const ordersData = await ordersRes.json()
      const adjData = await adjRes.json()
      setOrders(ordersData.data || [])
      setAdjustments(adjData.data || [])
    } catch (e) {
      console.error('加载失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      const res = await fetch('/api/price-adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          collectionOrderId: selectedOrder.id,
          adjustedPrice: Number(adjustForm.adjustedPrice),
          reason: adjustForm.reason,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(data.needsApproval ? '调价申请已提交，等待老板审批' : '价格调整成功')
        setShowAdjustModal(false)
        setAdjustForm({ adjustedPrice: '', reason: '' })
        fetchData()
      } else {
        alert(data.error || '价格调整失败')
      }
    } catch {
      alert('网络错误')
    }
  }

  const handleApprove = async (adjId) => {
    try {
      const res = await fetch(`/api/price-adjustments/${adjId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      if (res.ok) {
        alert('审批通过')
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || '审批失败')
      }
    } catch {
      alert('网络错误')
    }
  }

  const handleReject = async (adjId) => {
    const reason = prompt('请输入驳回原因：')
    if (!reason) return
    try {
      const res = await fetch(`/api/price-adjustments/${adjId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        alert('已驳回')
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || '驳回失败')
      }
    } catch {
      alert('网络错误')
    }
  }

  const canAdjust = user && (user.role === 'WEIGHER' || user.role === 'STATION_OWNER')
  const canApprove = user && user.role === 'STATION_OWNER'
  const adjustableOrders = orders.filter((o) =>
    ['PENDING', 'WEIGHED', 'SORTED', 'PRICE_ADJUSTED'].includes(o.status)
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">价格调整</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('orders')}
          className={`px-4 py-2 rounded ${tab === 'orders' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >待调价回收单</button>
        <button
          onClick={() => setTab('adjustments')}
          className={`px-4 py-2 rounded ${tab === 'adjustments' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >调价记录</button>
      </div>

      {tab === 'orders' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium">供应商</th>
                <th className="px-4 py-3 text-left text-sm font-medium">物资类型</th>
                <th className="px-4 py-3 text-right text-sm font-medium">净重</th>
                <th className="px-4 py-3 text-right text-sm font-medium">当前单价</th>
                <th className="px-4 py-3 text-right text-sm font-medium">金额</th>
                <th className="px-4 py-3 text-center text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {adjustableOrders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{o.orderNo}</td>
                  <td className="px-4 py-3 text-sm">{o.supplierName}</td>
                  <td className="px-4 py-3 text-sm">{o.materialType}</td>
                  <td className="px-4 py-3 text-sm text-right">{Number(o.netWeight).toFixed(2)} kg</td>
                  <td className="px-4 py-3 text-sm text-right">¥{Number(o.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">¥{Number(o.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-sm">{STATUS_LABEL[o.status]}</td>
                  <td className="px-4 py-3 text-center">
                    {canAdjust && (
                      <button
                        onClick={() => { setSelectedOrder(o); setShowAdjustModal(true) }}
                        className="text-green-600 hover:underline text-sm"
                      >申请调价</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'adjustments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">单号</th>
                <th className="px-4 py-3 text-right text-sm font-medium">原价</th>
                <th className="px-4 py-3 text-right text-sm font-medium">调整价</th>
                <th className="px-4 py-3 text-left text-sm font-medium">原因</th>
                <th className="px-4 py-3 text-center text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{a.order?.orderNo}</td>
                  <td className="px-4 py-3 text-sm text-right">¥{Number(a.originalPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">¥{Number(a.adjustedPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{a.reason}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${a.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : a.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {ADJ_STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    {canApprove && a.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleApprove(a.id)} className="text-green-600 text-sm hover:underline">通过</button>
                        <button onClick={() => handleReject(a.id)} className="text-red-600 text-sm hover:underline">驳回</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdjustModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAdjustModal(false)}>
          <form onSubmit={handleAdjust} className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">价格调整</h2>
            <p className="text-sm text-gray-600 mb-4">
              单号：{selectedOrder.orderNo} | 净重：{Number(selectedOrder.netWeight).toFixed(2)} kg
            </p>

            <div className="mb-3">
              <label className="block text-sm mb-1">当前单价</label>
              <input readOnly value={`¥${Number(selectedOrder.unitPrice).toFixed(2)}`} className="w-full border rounded px-3 py-2 bg-gray-100" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">调整后单价</label>
              <input
                required
                type="number"
                step="0.01"
                value={adjustForm.adjustedPrice}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustedPrice: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">预估新金额</label>
              <input
                readOnly
                value={adjustForm.adjustedPrice ? `¥${(Number(selectedOrder.netWeight) * Number(adjustForm.adjustedPrice)).toFixed(2)}` : ''}
                className="w-full border rounded px-3 py-2 bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">调整原因</label>
              <textarea
                required
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="如：市场价格上涨"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdjustModal(false)} className="px-4 py-2 border rounded">取消</button>
              <button type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded">
                {canApprove ? '确认调整' : '提交申请'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
