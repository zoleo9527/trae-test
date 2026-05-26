import { useEffect, useState } from 'react'

const STATUS_LABEL = {
  PENDING: '待处理',
  WEIGHED: '已过磅',
  SORTED: '已分拣入库',
  PRICE_ADJUSTED: '价格已调整',
  SETTLED: '已结算',
  REJECTED: '已驳回',
}

const METHOD_LABEL = {
  CASH: '现金',
  BANK: '银行转账',
  WECHAT: '微信',
  ALIPAY: '支付宝',
  OTHER: '其他',
}

export default function SettlementsPage() {
  const [orders, setOrders] = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [settleForm, setSettleForm] = useState({ amount: '', paymentMethod: 'CASH', notes: '' })
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [tab, setTab] = useState('pending')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
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
      const [ordersRes, settleRes] = await Promise.all([
        fetch('/api/collections?pageSize=50', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        }),
        fetch('/api/settlements?pageSize=50', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        }),
      ])
      const ordersData = await ordersRes.json()
      const settleData = await settleRes.json()
      setOrders(ordersData.data || [])
      setSettlements(settleData.data || [])
    } catch (e) {
      console.error('加载失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSettle = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      const res = await fetch('/api/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          collectionOrderId: selectedOrder.id,
          amount: Number(settleForm.amount),
          paymentMethod: settleForm.paymentMethod,
          notes: settleForm.notes || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.warning) alert(`结算成功。${data.warning}`)
        else alert('结算成功')
        setShowSettleModal(false)
        setSettleForm({ amount: '', paymentMethod: 'CASH', notes: '' })
        fetchData()
      } else {
        alert(data.error || '结算失败')
      }
    } catch {
      alert('网络错误')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.start) params.set('startDate', dateRange.start)
      if (dateRange.end) params.set('endDate', dateRange.end)
      window.open(`/api/exports/settlements?${params}`, '_blank')
    } catch {
      alert('导出失败')
    }
  }

  const canSettle = user && (user.role === 'FINANCE' || user.role === 'STATION_OWNER')
  const unsettledOrders = orders.filter((o) =>
    ['WEIGHED', 'SORTED', 'PRICE_ADJUSTED'].includes(o.status)
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">结算管理</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded ${tab === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >待结算</button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded ${tab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >结算记录</button>
        {canSettle && tab === 'history' && (
          <button onClick={handleExport} className="ml-auto px-4 py-2 bg-green-600 text-white rounded">导出CSV</button>
        )}
      </div>

      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">起始日期</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>
      )}

      {tab === 'pending' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium">供应商</th>
                <th className="px-4 py-3 text-left text-sm font-medium">物资类型</th>
                <th className="px-4 py-3 text-right text-sm font-medium">净重</th>
                <th className="px-4 py-3 text-right text-sm font-medium">单价</th>
                <th className="px-4 py-3 text-right text-sm font-medium">应收金额</th>
                <th className="px-4 py-3 text-center text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {unsettledOrders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{o.orderNo}</td>
                  <td className="px-4 py-3 text-sm">{o.supplierName}</td>
                  <td className="px-4 py-3 text-sm">{o.materialType}</td>
                  <td className="px-4 py-3 text-sm text-right">{Number(o.netWeight).toFixed(2)} kg</td>
                  <td className="px-4 py-3 text-sm text-right">¥{Number(o.unitPrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">¥{Number(o.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center text-sm">{STATUS_LABEL[o.status]}</td>
                  <td className="px-4 py-3 text-center">
                    {canSettle && (
                      <button
                        onClick={() => {
                          setSelectedOrder(o)
                          setSettleForm({ amount: String(Number(o.totalAmount).toFixed(2)), paymentMethod: 'CASH', notes: '' })
                          setShowSettleModal(true)
                        }}
                        className="text-purple-600 hover:underline text-sm"
                      >结算</button>
                    )}
                  </td>
                </tr>
              ))}
              {unsettledOrders.length === 0 && (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">暂无可结算的单据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium">供应商</th>
                <th className="px-4 py-3 text-right text-sm font-medium">应收</th>
                <th className="px-4 py-3 text-right text-sm font-medium">实结</th>
                <th className="px-4 py-3 text-left text-sm font-medium">支付方式</th>
                <th className="px-4 py-3 text-left text-sm font-medium">结算人</th>
                <th className="px-4 py-3 text-left text-sm font-medium">结算时间</th>
                <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{s.order?.orderNo}</td>
                  <td className="px-4 py-3 text-sm">{s.order?.supplierName}</td>
                  <td className="px-4 py-3 text-sm text-right">¥{Number(s.order?.totalAmount || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-sm text-right ${Number(s.amount) !== Number(s.order?.totalAmount) ? 'text-orange-600 font-medium' : ''}`}>
                    ¥{Number(s.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">{METHOD_LABEL[s.paymentMethod] || s.paymentMethod}</td>
                  <td className="px-4 py-3 text-sm">{s.settledBy?.realName}</td>
                  <td className="px-4 py-3 text-sm">{new Date(s.settledAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedOrder(s.order)}
                      className="text-blue-600 hover:underline text-sm"
                    >详情</button>
                  </td>
                </tr>
              ))}
              {settlements.length === 0 && (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">暂无结算记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showSettleModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSettleModal(false)}>
          <form onSubmit={handleSettle} className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">结算确认</h2>
            <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
              <p><strong>单号：</strong>{selectedOrder.orderNo}</p>
              <p><strong>供应商：</strong>{selectedOrder.supplierName}</p>
              <p><strong>物资类型：</strong>{selectedOrder.materialType}</p>
              <p><strong>净重：</strong>{Number(selectedOrder.netWeight).toFixed(2)} kg</p>
              <p><strong>应收金额：</strong>¥{Number(selectedOrder.totalAmount).toFixed(2)}</p>
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">实结金额</label>
              <input
                required
                type="number"
                step="0.01"
                value={settleForm.amount}
                onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">支付方式</label>
              <select
                value={settleForm.paymentMethod}
                onChange={(e) => setSettleForm({ ...settleForm, paymentMethod: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="CASH">现金</option>
                <option value="BANK">银行转账</option>
                <option value="WECHAT">微信</option>
                <option value="ALIPAY">支付宝</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">备注</label>
              <textarea
                value={settleForm.notes}
                onChange={(e) => setSettleForm({ ...settleForm, notes: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="如有金额偏差请说明原因"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSettleModal(false)} className="px-4 py-2 border rounded">取消</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">确认结算</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
