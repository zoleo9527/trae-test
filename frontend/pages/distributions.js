import { useEffect, useState } from 'react'

const STATUS_LABEL = {
  PENDING: '待处理',
  WEIGHED: '已过磅',
  SORTED: '已分拣入库',
  PRICE_ADJUSTED: '价格已调整',
  SETTLED: '已结算',
  REJECTED: '已驳回',
}

const STATUS_COLOR = {
  PENDING: 'bg-gray-100 text-gray-700',
  WEIGHED: 'bg-blue-100 text-blue-700',
  SORTED: 'bg-green-100 text-green-700',
  PRICE_ADJUSTED: 'bg-yellow-100 text-yellow-700',
  SETTLED: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function DistributionsPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', materialType: '', supplierName: '' })
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [sortingForm, setSortingForm] = useState({ sortedMaterialType: '', sortedWeight: '', binLocation: '', notes: '' })
  const [showSortingModal, setShowSortingModal] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser(payload)
      } catch {}
    }
    fetchOrders()
  }, [filter, page])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, pageSize, ...filter })
      const res = await fetch(`/api/collections?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      const data = await res.json()
      setOrders(data.data || [])
      setTotalPages(data.totalPages || 1)
    } catch (e) {
      console.error('加载回收单失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSorting = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return
    try {
      const res = await fetch('/api/sortings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          collectionOrderId: selectedOrder.id,
          ...sortingForm,
          sortedWeight: Number(sortingForm.sortedWeight),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        alert('分拣入库成功')
        setShowSortingModal(false)
        setSortingForm({ sortedMaterialType: '', sortedWeight: '', binLocation: '', notes: '' })
        fetchOrders()
      } else {
        alert(data.error || '分拣入库失败')
      }
    } catch (e) {
      alert('网络错误')
    }
  }

  const canSort = user && (user.role === 'WEIGHER' || user.role === 'STATION_OWNER')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">分拣入库</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">状态</label>
            <select
              value={filter.status}
              onChange={(e) => { setFilter({ ...filter, status: e.target.value }); setPage(1) }}
              className="border rounded px-3 py-2"
            >
              <option value="">全部</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">物资类型</label>
            <input
              value={filter.materialType}
              onChange={(e) => { setFilter({ ...filter, materialType: e.target.value }); setPage(1) }}
              className="border rounded px-3 py-2"
              placeholder="如：废铁"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">供应商</label>
            <input
              value={filter.supplierName}
              onChange={(e) => { setFilter({ ...filter, supplierName: e.target.value }); setPage(1) }}
              className="border rounded px-3 py-2"
              placeholder="如：王建军"
            />
          </div>
          <div className="self-end">
            <button onClick={fetchOrders} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              查询
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium">供应商</th>
                <th className="px-4 py-3 text-left text-sm font-medium">物资类型</th>
                <th className="px-4 py-3 text-right text-sm font-medium">净重(kg)</th>
                <th className="px-4 py-3 text-right text-sm font-medium">金额(元)</th>
                <th className="px-4 py-3 text-center text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium">分拣次数</th>
                <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{o.orderNo}</td>
                  <td className="px-4 py-3 text-sm">{o.supplierName}</td>
                  <td className="px-4 py-3 text-sm">{o.materialType}</td>
                  <td className="px-4 py-3 text-sm text-right">{Number(o.netWeight).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">{Number(o.totalAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{o.sortingRecords?.length || 0}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      详情
                    </button>
                    {canSort && ['PENDING', 'WEIGHED', 'SORTED'].includes(o.status) && (
                      <button
                        onClick={() => { setSelectedOrder(o); setShowSortingModal(true) }}
                        className="text-green-600 hover:underline text-sm"
                      >
                        分拣
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center mt-6 gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >上一页</button>
        <span className="px-3 py-1">第 {page} / {totalPages} 页</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >下一页</button>
      </div>

      {selectedOrder && !showSortingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">回收单详情</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><span className="text-gray-600">单号：</span>{selectedOrder.orderNo}</div>
              <div><span className="text-gray-600">供应商：</span>{selectedOrder.supplierName}</div>
              <div><span className="text-gray-600">物资类型：</span>{selectedOrder.materialType}</div>
              <div><span className="text-gray-600">状态：</span><span className={`px-2 py-1 rounded text-xs ${STATUS_COLOR[selectedOrder.status]}`}>{STATUS_LABEL[selectedOrder.status]}</span></div>
              <div><span className="text-gray-600">毛重：</span>{Number(selectedOrder.grossWeight).toFixed(2)} kg</div>
              <div><span className="text-gray-600">皮重：</span>{Number(selectedOrder.tareWeight).toFixed(2)} kg</div>
              <div><span className="text-gray-600">净重：</span>{Number(selectedOrder.netWeight).toFixed(2)} kg</div>
              <div><span className="text-gray-600">单价：</span>¥{Number(selectedOrder.unitPrice).toFixed(2)}</div>
              <div><span className="text-gray-600">金额：</span>¥{Number(selectedOrder.totalAmount).toFixed(2)}</div>
              <div><span className="text-gray-600">建单人：</span>{selectedOrder.createdBy?.realName}</div>
            </div>

            {selectedOrder.sortingRecords?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">分拣记录</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">类型</th>
                      <th className="px-2 py-1 text-right">重量</th>
                      <th className="px-2 py-1 text-left">位置</th>
                      <th className="px-2 py-1 text-left">操作人</th>
                      <th className="px-2 py-1 text-left">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.sortingRecords.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="px-2 py-1">{s.sortedMaterialType}</td>
                        <td className="px-2 py-1 text-right">{Number(s.sortedWeight).toFixed(2)}</td>
                        <td className="px-2 py-1">{s.binLocation || '-'}</td>
                        <td className="px-2 py-1">{s.sorter?.realName}</td>
                        <td className="px-2 py-1">{s.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedOrder.priceAdjustments?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">价格调整记录</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">原价</th>
                      <th className="px-2 py-1 text-left">调整后</th>
                      <th className="px-2 py-1 text-left">原因</th>
                      <th className="px-2 py-1 text-left">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.priceAdjustments.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="px-2 py-1">¥{Number(a.originalPrice).toFixed(2)}</td>
                        <td className="px-2 py-1">¥{Number(a.adjustedPrice).toFixed(2)}</td>
                        <td className="px-2 py-1">{a.reason}</td>
                        <td className="px-2 py-1">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedOrder.rejectionNotes?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">驳回原因</h3>
                <div className="space-y-2">
                  {selectedOrder.rejectionNotes.map((r) => (
                    <div key={r.id} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                      <p>{r.reason}</p>
                      <p className="text-gray-500 text-xs mt-1">{r.createdBy?.realName} · {new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedOrder.supplementalNotes?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">补录说明 / 历史备注</h3>
                <div className="space-y-2">
                  {selectedOrder.supplementalNotes.map((n) => (
                    <div key={n.id} className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                      <p>{n.content}</p>
                      <p className="text-gray-500 text-xs mt-1">{n.createdBy?.realName} · {new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 border rounded">关闭</button>
            </div>
          </div>
        </div>
      )}

      {showSortingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSortingModal(false)}>
          <form onSubmit={handleSorting} className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">分拣入库</h2>
            <p className="text-sm text-gray-600 mb-4">单号：{selectedOrder.orderNo} | 净重：{Number(selectedOrder.netWeight).toFixed(2)} kg</p>

            <div className="mb-3">
              <label className="block text-sm mb-1">分拣后物资类型</label>
              <input
                required
                value={sortingForm.sortedMaterialType}
                onChange={(e) => setSortingForm({ ...sortingForm, sortedMaterialType: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="如：废铁-纯净"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">分拣重量(kg)</label>
              <input
                required
                type="number"
                step="0.001"
                value={sortingForm.sortedWeight}
                onChange={(e) => setSortingForm({ ...sortingForm, sortedWeight: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">入库位置</label>
              <input
                value={sortingForm.binLocation}
                onChange={(e) => setSortingForm({ ...sortingForm, binLocation: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="如：A区-01"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">备注</label>
              <textarea
                value={sortingForm.notes}
                onChange={(e) => setSortingForm({ ...sortingForm, notes: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSortingModal(false)} className="px-4 py-2 border rounded">取消</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">确认分拣</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
