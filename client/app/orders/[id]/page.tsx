'use client'

import ContinuousReviewPanel from '@/components/ContinuousReviewPanel'
import TimelineView from '@/components/TimelineView'
import {
    api,
    type Installation,
    type Order,
    type OrderConfig,
    type ReplacementPart,
    type SampleLending,
    type User as UserType
} from '@/lib/api'
import {
    ARRIVAL_STATUS_MAP,
    cn,
    INSTALL_STATUS_MAP,
    ITEM_STATUS_MAP,
    REPLACEMENT_STATUS_MAP,
    SAMPLE_STATUS_MAP,
    STATUS_MAP
} from '@/lib/utils'
import {
    AlertTriangle,
    ArrowLeft,
    Box,
    Calendar,
    CheckCheck,
    CheckCircle, Clock,
    Edit3,
    FileText,
    Plus,
    PlusCircle,
    Save,
    Settings,
    Trash2,
    Truck, Wrench,
    X
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Tab = 'overview' | 'configs' | 'arrivals' | 'installations' | 'samples' | 'replacements'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = Number(params.id)

  const [order, setOrder] = useState<Order | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Record<string, any>>({})

  const loadOrder = useCallback(async () => {
    try {
      const [orderRes, usersRes] = await Promise.all([
        api.getOrder(orderId),
        api.getUsers(),
      ])
      setOrder(orderRes)
      setUsers(usersRes)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [orderId])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const userName = (id: number | null) =>
    users.find(u => u.id === id)?.display_name || '-'

  const handleSaveEdit = async () => {
    if (!order) return
    try {
      const payload: any = {}
      for (const [key, value] of Object.entries(editData)) {
        payload[key] = value
      }
      const updated = await api.updateOrder(orderId, payload)
      setOrder(updated)
      setEditing(false)
      setEditData({})
    } catch (e: any) {
      alert(e.message)
    }
  }

  const setEditField = (key: string, value: any) => {
    setEditData(prev => ({ ...prev, [key]: value }))
  }

  const getEditValue = (key: string, orderVal: any, transform?: (v: any) => string) => {
    if (key in editData) {
      const val = editData[key]
      if (val === null || val === undefined || val === '') return ''
      return transform ? transform(val) : String(val)
    }
    if (orderVal === null || orderVal === undefined || orderVal === '') return ''
    return transform ? transform(orderVal) : String(orderVal)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">加载中...</div>
  }
  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">订单不存在</div>
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: '概览', icon: <FileText className="w-4 h-4" /> },
    { key: 'configs', label: '定制配置', icon: <Settings className="w-4 h-4" />, badge: order.configs.length },
    { key: 'arrivals', label: '到货跟踪', icon: <Truck className="w-4 h-4" />, badge: order.arrivals.length },
    { key: 'installations', label: '安装预约', icon: <Calendar className="w-4 h-4" />, badge: order.installations.length },
    { key: 'samples', label: '样品借出', icon: <Box className="w-4 h-4" />, badge: order.sample_lendings.length },
    { key: 'replacements', label: '补件确认', icon: <PlusCircle className="w-4 h-4" />, badge: order.replacement_parts.length },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-sm">
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Link>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-900">{order.order_no}</h1>
                <span className={cn(
                  'inline-flex px-2.5 py-0.5 text-xs font-medium rounded-md border',
                  STATUS_MAP[order.status]?.color
                )}>
                  {STATUS_MAP[order.status]?.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.customer_name} · {order.customer_phone}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.status !== 'after_sales' && order.status !== 'completed' && order.status !== 'cancelled' && (
              <button
                onClick={async () => {
                  if (confirm('确认将此订单进入售后流程？')) {
                    await api.raiseAfterSales(orderId)
                    loadOrder()
                  }
                }}
                className="px-3 py-2 text-sm border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-4 h-4" />
                进入售后
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-[1fr_400px] gap-6">
        <div>
          <div className="bg-white rounded-xl border border-slate-200 mb-4">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserBadge name={order.customer_name} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.customer_phone}</p>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => { setEditing(true); setEditData({}) }} className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <Edit3 className="w-4 h-4" /> 编辑
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveEdit} className="text-sm text-green-600 flex items-center gap-1">
                    <Save className="w-4 h-4" /> 保存
                  </button>
                  <button onClick={() => { setEditing(false); setEditData({}) }} className="text-sm text-slate-500 flex items-center gap-1">
                    <X className="w-4 h-4" /> 取消
                  </button>
                </div>
              )}
            </div>
            <div className="px-5 py-4 grid grid-cols-3 gap-4">
              {editing ? (
                <>
                  <EditRow label="客户姓名" value={getEditValue('customer_name', order.customer_name)} onChange={v => setEditField('customer_name', v)} />
                  <EditRow label="客户电话" value={getEditValue('customer_phone', order.customer_phone)} onChange={v => setEditField('customer_phone', v)} />
                  <EditRow
                    label="状态"
                    value={getEditValue('status', order.status)}
                    onChange={v => setEditField('status', v)}
                    type="select"
                    options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
                  />
                  <EditRow label="收货地址" value={getEditValue('customer_address', order.customer_address)} onChange={v => setEditField('customer_address', v)} full />
                  <EditRow label="总金额" value={getEditValue('total_amount', order.total_amount)} onChange={v => setEditField('total_amount', Number(v) || 0)} type="number" />
                  <EditRow label="定金" value={getEditValue('deposit_amount', order.deposit_amount)} onChange={v => setEditField('deposit_amount', Number(v) || 0)} type="number" />
                  <EditRow
                    label="预计交付"
                    value={getEditValue('expected_delivery_date', order.expected_delivery_date, (v) => new Date(v).toISOString().slice(0, 10))}
                    onChange={v => setEditField('expected_delivery_date', v ? new Date(v).toISOString() : null)}
                    type="date"
                  />
                  <EditRow
                    label="销售顾问"
                    value={getEditValue('sales_consultant_id', order.sales_consultant_id)}
                    onChange={v => setEditField('sales_consultant_id', v ? Number(v) : null)}
                    type="select"
                    options={users.filter(u => u.role === 'sales').map(u => ({ value: u.id.toString(), label: u.display_name }))}
                  />
                  <EditRow
                    label="展厅经理"
                    value={getEditValue('showroom_manager_id', order.showroom_manager_id)}
                    onChange={v => setEditField('showroom_manager_id', v ? Number(v) : null)}
                    type="select"
                    options={users.filter(u => u.role === 'manager').map(u => ({ value: u.id.toString(), label: u.display_name }))}
                  />
                  <EditRow label="备注" value={getEditValue('remarks', order.remarks || '')} onChange={v => setEditField('remarks', v)} full textarea />
                </>
              ) : (
                <>
                  <InfoRow label="订单号" value={order.order_no} mono />
                  <InfoRow label="总金额" value={`¥${order.total_amount.toLocaleString()}`} />
                  <InfoRow label="定金" value={`¥${order.deposit_amount.toLocaleString()}`} />
                  <InfoRow label="收货地址" value={order.customer_address} full />
                  <InfoRow
                    label="预计交付"
                    value={order.expected_delivery_date
                      ? new Date(order.expected_delivery_date).toLocaleDateString('zh-CN')
                      : '-'}
                  />
                  <InfoRow label="销售顾问" value={userName(order.sales_consultant_id)} />
                  <InfoRow label="展厅经理" value={userName(order.showroom_manager_id)} />
                  <InfoRow label="备注" value={order.remarks || '-'} full />
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 flex">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition',
                    activeTab === tab.key
                      ? 'border-brand-600 text-brand-700 font-medium'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {activeTab === 'overview' && <OverviewTab order={order} onUpdate={loadOrder} />}
              {activeTab === 'configs' && <ConfigsTab order={order} onUpdate={loadOrder} />}
              {activeTab === 'arrivals' && <ArrivalsTab order={order} onUpdate={loadOrder} />}
              {activeTab === 'installations' && <InstallationsTab order={order} onUpdate={loadOrder} />}
              {activeTab === 'samples' && <SamplesTab order={order} onUpdate={loadOrder} />}
              {activeTab === 'replacements' && <ReplacementsTab order={order} onUpdate={loadOrder} />}
            </div>
          </div>
        </div>

        <div>
          <ContinuousReviewPanel orderId={orderId} />
          <div className="mt-4">
            <TimelineView order={order} />
          </div>
        </div>
      </div>
    </div>
  )
}

function UserBadge({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-medium">
      {name.charAt(0)}
    </div>
  )
}

function InfoRow({ label, value, full, mono }: { label: string; value: string; full?: boolean; mono?: boolean }) {
  return (
    <div className={cn(full && 'col-span-3')}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn('text-sm text-slate-900', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  )
}

function EditRow({
  label, value, onChange, full, type = 'text', options, textarea
}: {
  label: string
  value: string
  onChange: (v: string) => void
  full?: boolean
  type?: 'text' | 'number' | 'date' | 'select'
  options?: { value: string; label: string }[]
  textarea?: boolean
}) {
  const baseCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500'
  return (
    <div className={cn(full && 'col-span-3')}>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={baseCls} />
      ) : type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={baseCls}>
          <option value="">请选择</option>
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} className={baseCls} />
      )}
    </div>
  )
}

function OverviewTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [newItem, setNewItem] = useState({ product_name: '', product_code: '', quantity: 1, unit_price: 0, remarks: '' })
  const [editItem, setEditItem] = useState({ product_name: '', product_code: '', quantity: 1, unit_price: 0, status: '', remarks: '' })

  const handleAdd = async () => {
    if (!newItem.product_name || !newItem.product_code || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      alert('请填写完整商品信息')
      return
    }
    try {
      await api.addItem(order.id, newItem)
      setAdding(false)
      setNewItem({ product_name: '', product_code: '', quantity: 1, unit_price: 0, remarks: '' })
      onUpdate()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleEdit = (item: any) => {
    setEditingItemId(item.id)
    setEditItem({
      product_name: item.product_name,
      product_code: item.product_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      status: item.status,
      remarks: item.remarks || '',
    })
  }

  const handleSaveEdit = async (itemId: number) => {
    try {
      await api.updateItem(order.id, itemId, editItem)
      setEditingItemId(null)
      onUpdate()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDelete = async (itemId: number) => {
    if (!confirm('确认删除此商品？')) return
    try {
      await api.deleteItem(order.id, itemId)
      onUpdate()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">商品清单</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" /> {adding ? '取消' : '添加商品'}
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-12 gap-2">
            <input
              placeholder="商品名称"
              value={newItem.product_name}
              onChange={e => setNewItem({ ...newItem, product_name: e.target.value })}
              className="col-span-4 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              placeholder="商品编码"
              value={newItem.product_code}
              onChange={e => setNewItem({ ...newItem, product_code: e.target.value })}
              className="col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="number" placeholder="数量" min={1}
              value={newItem.quantity}
              onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
              className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="number" placeholder="单价" min={0}
              value={newItem.unit_price || ''}
              onChange={e => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
              className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={handleAdd}
              className="col-span-1 px-3 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <input
            placeholder="备注（可选）"
            value={newItem.remarks}
            onChange={e => setNewItem({ ...newItem, remarks: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      <div className="space-y-2">
        {order.items.map(item => (
          <div key={item.id} className="px-4 py-3 bg-slate-50 rounded-lg">
            {editingItemId === item.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2">
                  <input
                    value={editItem.product_name}
                    onChange={e => setEditItem({ ...editItem, product_name: e.target.value })}
                    className="col-span-4 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                  <input
                    value={editItem.product_code}
                    onChange={e => setEditItem({ ...editItem, product_code: e.target.value })}
                    className="col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                  <input
                    type="number" min={1}
                    value={editItem.quantity}
                    onChange={e => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
                    className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                  <input
                    type="number" min={0}
                    value={editItem.unit_price}
                    onChange={e => setEditItem({ ...editItem, unit_price: Number(e.target.value) })}
                    className="col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <input
                  placeholder="备注"
                  value={editItem.remarks}
                  onChange={e => setEditItem({ ...editItem, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={editItem.status}
                    onChange={e => setEditItem({ ...editItem, status: e.target.value })}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2"
                  >
                    {Object.entries(ITEM_STATUS_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItemId(null)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md">取消</button>
                    <button onClick={() => handleSaveEdit(item.id)} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">保存</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{item.product_code} · 数量 {item.quantity} × ¥{item.unit_price.toLocaleString()}</p>
                  {item.remarks && <p className="text-xs text-slate-400 mt-1">{item.remarks}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-slate-900">¥{item.subtotal.toLocaleString()}</p>
                    <span className={cn(
                      'inline-block mt-1 px-2 py-0.5 text-xs rounded',
                      ITEM_STATUS_MAP[item.status]?.color
                    )}>
                      {ITEM_STATUS_MAP[item.status]?.label}
                    </span>
                  </div>
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-brand-600 p-1">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <MiniStat icon={<Settings className="w-4 h-4" />} label="配置项" value={order.configs.length} />
        <MiniStat icon={<Truck className="w-4 h-4" />} label="到货次数" value={order.arrivals.length} />
        <MiniStat icon={<Calendar className="w-4 h-4" />} label="安装预约" value={order.installations.length} />
        <MiniStat icon={<Box className="w-4 h-4" />} label="样品借出" value={order.sample_lendings.length} />
      </div>

      {order.replacement_parts.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            异常处理 · {order.replacement_parts.length} 条补件记录
          </div>
          <div className="space-y-1">
            {order.replacement_parts.map(r => (
              <p key={r.id} className="text-xs text-amber-800">
                · {r.part_name} ×{r.quantity}（{r.reason}）
                <span className="ml-2 text-amber-600">[{REPLACEMENT_STATUS_MAP[r.status]?.label}]</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-lg">
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function ConfigsTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ config_type: '', config_key: '', config_value: '', config_description: '' })

  const handleAdd = async () => {
    if (!form.config_type || !form.config_key || !form.config_value) return
    await api.addConfig(order.id, form)
    setForm({ config_type: '', config_key: '', config_value: '', config_description: '' })
    setAdding(false)
    onUpdate()
  }

  const handleConfirm = async (cfg: OrderConfig) => {
    await api.updateConfig(order.id, cfg.id, { confirmed: !cfg.confirmed })
    onUpdate()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除此配置？')) return
    await api.deleteConfig(order.id, id)
    onUpdate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">定制配置</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" /> 添加配置
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="类型(颜色/材质/尺寸)"
              value={form.config_type}
              onChange={e => setForm({ ...form, config_type: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              placeholder="配置项"
              value={form.config_key}
              onChange={e => setForm({ ...form, config_key: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              placeholder="配置值"
              value={form.config_value}
              onChange={e => setForm({ ...form, config_value: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <input
            placeholder="描述(可选)"
            value={form.config_description}
            onChange={e => setForm({ ...form, config_description: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md">取消</button>
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">确认添加</button>
          </div>
        </div>
      )}

      {order.configs.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">暂无配置</p>
      ) : (
        <div className="space-y-2">
          {order.configs.map(cfg => (
            <div key={cfg.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs bg-brand-100 text-brand-700 rounded">{cfg.config_type}</span>
                  <span className="text-sm font-medium text-slate-900">{cfg.config_key}</span>
                  <span className="text-sm text-slate-600">=</span>
                  <span className="text-sm text-slate-900">{cfg.config_value}</span>
                </div>
                {cfg.config_description && <p className="text-xs text-slate-500 mt-1">{cfg.config_description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleConfirm(cfg)}
                  className={cn(
                    'text-xs px-2 py-1 rounded flex items-center gap-1',
                    cfg.confirmed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  )}
                >
                  {cfg.confirmed ? <><CheckCircle className="w-3 h-3" /> 已确认</> : <><Clock className="w-3 h-3" /> 待确认</>}
                </button>
                <button onClick={() => handleDelete(cfg.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArrivalsTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    item_id: '', arrival_date: '', quantity: 1, tracking_no: '',
    warehouse_location: '', is_partial: false, damaged_qty: 0, missing_qty: 0, remarks: ''
  })

  const handleAdd = async () => {
    if (!form.arrival_date || !form.quantity) return
    await api.addArrival(order.id, {
      ...form,
      item_id: form.item_id ? Number(form.item_id) : null,
      arrival_date: new Date(form.arrival_date).toISOString(),
    })
    setForm({ item_id: '', arrival_date: '', quantity: 1, tracking_no: '', warehouse_location: '', is_partial: false, damaged_qty: 0, missing_qty: 0, remarks: '' })
    setAdding(false)
    onUpdate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">到货跟踪</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" /> 登记到货
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <select
              value={form.item_id}
              onChange={e => setForm({ ...form, item_id: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">关联商品</option>
              {order.items.map(item => (
                <option key={item.id} value={item.id}>{item.product_name}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.arrival_date}
              onChange={e => setForm({ ...form, arrival_date: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="number" placeholder="数量" min={1}
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              placeholder="物流单号"
              value={form.tracking_no}
              onChange={e => setForm({ ...form, tracking_no: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="库位"
              value={form.warehouse_location}
              onChange={e => setForm({ ...form, warehouse_location: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="number" placeholder="损坏数量" min={0}
              value={form.damaged_qty}
              onChange={e => setForm({ ...form, damaged_qty: Number(e.target.value) })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="number" placeholder="缺失数量" min={0}
              value={form.missing_qty}
              onChange={e => setForm({ ...form, missing_qty: Number(e.target.value) })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <textarea
            placeholder="备注"
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.is_partial}
                onChange={e => setForm({ ...form, is_partial: e.target.checked })}
              />
              部分到货
            </label>
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md">取消</button>
              <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">确认登记</button>
            </div>
          </div>
        </div>
      )}

      {order.arrivals.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">暂无到货记录</p>
      ) : (
        <div className="space-y-2">
          {order.arrivals.map(arr => {
            const item = order.items.find(i => i.id === arr.item_id)
            return (
              <div key={arr.id} className="px-4 py-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      arr.status === 'damaged' ? 'bg-red-100 text-red-600' :
                      arr.status === 'partial' ? 'bg-amber-100 text-amber-600' :
                        'bg-teal-100 text-teal-600'
                    )}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item?.product_name || '未关联商品'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(arr.arrival_date).toLocaleString('zh-CN')} · 数量 {arr.quantity}
                        {arr.tracking_no && ` · 单号 ${arr.tracking_no}`}
                        {arr.warehouse_location && ` · 库位 ${arr.warehouse_location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(arr.damaged_qty > 0 || arr.missing_qty > 0) && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        {arr.damaged_qty > 0 && `损${arr.damaged_qty}`}
                        {arr.missing_qty > 0 && `缺${arr.missing_qty}`}
                      </span>
                    )}
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      ARRIVAL_STATUS_MAP[arr.status]?.color
                    )}>
                      {ARRIVAL_STATUS_MAP[arr.status]?.label}
                    </span>
                  </div>
                </div>
                {arr.remarks && <p className="text-xs text-slate-500 mt-2">{arr.remarks}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InstallationsTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    item_id: '', scheduled_date: '', installer: '', contact_name: '', contact_phone: '', remarks: ''
  })

  const handleAdd = async () => {
    if (!form.scheduled_date || !form.installer || !form.contact_name || !form.contact_phone) return
    await api.addInstallation(order.id, {
      ...form,
      item_id: form.item_id ? Number(form.item_id) : null,
      scheduled_date: new Date(form.scheduled_date).toISOString(),
    })
    setForm({ item_id: '', scheduled_date: '', installer: '', contact_name: '', contact_phone: '', remarks: '' })
    setAdding(false)
    onUpdate()
  }

  const handleStatusChange = async (inst: Installation, status: string) => {
    await api.updateInstallation(order.id, inst.id, { status })
    onUpdate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">安装预约</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" /> 新建预约
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <select
              value={form.item_id}
              onChange={e => setForm({ ...form, item_id: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">关联商品</option>
              {order.items.map(item => (
                <option key={item.id} value={item.id}>{item.product_name}</option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={form.scheduled_date}
              onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              placeholder="安装师"
              value={form.installer}
              onChange={e => setForm({ ...form, installer: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="联系人"
              value={form.contact_name}
              onChange={e => setForm({ ...form, contact_name: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              placeholder="联系电话"
              value={form.contact_phone}
              onChange={e => setForm({ ...form, contact_phone: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <input
            placeholder="备注"
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md">取消</button>
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">确认预约</button>
          </div>
        </div>
      )}

      {order.installations.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">暂无安装预约</p>
      ) : (
        <div className="space-y-2">
          {order.installations.map(inst => {
            const item = order.items.find(i => i.id === inst.item_id)
            return (
              <div key={inst.id} className="px-4 py-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item?.product_name || '未关联商品'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(inst.scheduled_date).toLocaleString('zh-CN')}
                        {' · '}安装师 {inst.installer}
                        {' · '}联系 {inst.contact_name}({inst.contact_phone})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['scheduled', 'confirmed', 'completed', 'problem', 'cancelled'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(inst, s)}
                        className={cn(
                          'text-xs px-2 py-1 rounded',
                          inst.status === s
                            ? INSTALL_STATUS_MAP[s]?.color + ' ring-2 ring-offset-1'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {INSTALL_STATUS_MAP[s]?.label}
                      </button>
                    ))}
                  </div>
                </div>
                {inst.reschedule_count > 0 && (
                  <p className="text-xs text-amber-600 mt-2">已改期 {inst.reschedule_count} 次</p>
                )}
                {inst.problem_description && (
                  <p className="text-xs text-red-600 mt-2">问题: {inst.problem_description}</p>
                )}
                {inst.remarks && <p className="text-xs text-slate-500 mt-2">{inst.remarks}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SamplesTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    sample_name: '', sample_code: '', lent_to: '', due_date: '', remarks: ''
  })

  const handleAdd = async () => {
    if (!form.sample_name || !form.lent_to || !form.due_date) return
    await api.addSample(order.id, {
      ...form,
      due_date: new Date(form.due_date).toISOString(),
    })
    setForm({ sample_name: '', sample_code: '', lent_to: '', due_date: '', remarks: '' })
    setAdding(false)
    onUpdate()
  }

  const handleReturn = async (sample: SampleLending) => {
    await api.updateSample(order.id, sample.id, { status: 'returned', condition: '完好' })
    onUpdate()
  }

  const handleMarkLost = async (sample: SampleLending) => {
    if (!confirm(`确认将样品"${sample.sample_name}"标记为丢失？此操作无法撤销。`)) return
    await api.updateSample(order.id, sample.id, { status: 'lost' })
    onUpdate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">样品借出</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" /> 借出登记
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input
              placeholder="样品名称"
              value={form.sample_name}
              onChange={e => setForm({ ...form, sample_name: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              placeholder="样品编号"
              value={form.sample_code}
              onChange={e => setForm({ ...form, sample_code: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              placeholder="借给"
              value={form.lent_to}
              onChange={e => setForm({ ...form, lent_to: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <input
            placeholder="备注"
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md">取消</button>
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">确认借出</button>
          </div>
        </div>
      )}

      {order.sample_lendings.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">暂无样品借出记录</p>
      ) : (
        <div className="space-y-2">
          {order.sample_lendings.map(sample => (
            <div key={sample.id} className="px-4 py-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sample.sample_name}</p>
                    <p className="text-xs text-slate-500">
                      借给 {sample.lent_to}
                      {sample.sample_code && ` · 编号 ${sample.sample_code}`}
                      {' · '}应还 {new Date(sample.due_date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sample.status === 'lent' || sample.status === 'overdue' ? (
                    <>
                      <button
                        onClick={() => handleReturn(sample)}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" /> 归还
                      </button>
                      <button
                        onClick={() => handleMarkLost(sample)}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> 丢失
                      </button>
                    </>
                  ) : null}
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    SAMPLE_STATUS_MAP[sample.status]?.color
                  )}>
                    {SAMPLE_STATUS_MAP[sample.status]?.label}
                  </span>
                </div>
              </div>
              {sample.condition && sample.status === 'returned' && (
                <p className="text-xs text-green-600 mt-2">归还状态: {sample.condition}</p>
              )}
              {sample.remarks && <p className="text-xs text-slate-500 mt-2">{sample.remarks}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReplacementsTab({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    item_id: '', part_name: '', part_code: '', quantity: 1, reason: '', remarks: ''
  })

  const handleAdd = async () => {
    if (!form.part_name || !form.reason) return
    await api.addReplacement(order.id, {
      ...form,
      item_id: form.item_id ? Number(form.item_id) : null,
    })
    setForm({ item_id: '', part_name: '', part_code: '', quantity: 1, reason: '', remarks: '' })
    setAdding(false)
    onUpdate()
  }

  const handleStatusChange = async (rep: ReplacementPart, status: string) => {
    await api.updateReplacement(order.id, rep.id, { status })
    onUpdate()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-900">补件确认</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <PlusCircle className="w-4 h-4" /> 申请补件
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <select
              value={form.item_id}
              onChange={e => setForm({ ...form, item_id: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              <option value="">关联商品</option>
              {order.items.map(item => (
                <option key={item.id} value={item.id}>{item.product_name}</option>
              ))}
            </select>
            <input
              placeholder="配件名称"
              value={form.part_name}
              onChange={e => setForm({ ...form, part_name: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              placeholder="配件编号"
              value={form.part_code}
              onChange={e => setForm({ ...form, part_code: e.target.value })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="number" placeholder="数量" min={1}
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <textarea
            placeholder="原因说明"
            value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            placeholder="备注"
            value={form.remarks}
            onChange={e => setForm({ ...form, remarks: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-md">取消</button>
            <button onClick={handleAdd} className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded-md hover:bg-brand-700">确认申请</button>
          </div>
        </div>
      )}

      {order.replacement_parts.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">暂无补件记录</p>
      ) : (
        <div className="space-y-2">
          {order.replacement_parts.map(rep => {
            const item = order.items.find(i => i.id === rep.item_id)
            return (
              <div key={rep.id} className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rep.part_name} ×{rep.quantity}</p>
                      <p className="text-xs text-slate-500">
                        {item?.product_name && `关联: ${item.product_name}`}
                        {rep.part_code && ` · 编号 ${rep.part_code}`}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">原因: {rep.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap max-w-xs justify-end">
                    {(['pending', 'ordered', 'arrived', 'installed', 'confirmed'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(rep, s)}
                        className={cn(
                          'text-xs px-2 py-1 rounded',
                          rep.status === s
                            ? REPLACEMENT_STATUS_MAP[s]?.color + ' ring-2 ring-offset-1'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {REPLACEMENT_STATUS_MAP[s]?.label}
                      </button>
                    ))}
                  </div>
                </div>
                {rep.remarks && <p className="text-xs text-slate-500 mt-2">{rep.remarks}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}