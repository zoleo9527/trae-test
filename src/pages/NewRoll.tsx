import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useRollStore } from '@/stores/rollStore'
import { useAuthStore } from '@/stores/authStore'

const FILM_TYPES = [
  'Kodak Gold 200 彩色负片',
  'Kodak Portra 400 专业负片',
  'Kodak Ektar 100 彩色负片',
  'Fujifilm Superia 400 彩色负片',
  'Fujifilm Acros 100 II 黑白负片',
  'Ilford HP5 Plus 400 黑白负片',
  'Kodak Tri-X 400 黑白负片',
  '其他',
]

const SCAN_SPECS = [
  '标准扫描 3000x2000',
  '高分辨率扫描 6000x4000',
  '无损扫描 TIFF格式',
]

export default function NewRoll() {
  const navigate = useNavigate()
  const createRoll = useRollStore((state) => state.createRoll)
  const currentUser = useAuthStore((state) => state.currentUser)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_contact: '',
    film_type: '',
    scan_spec: '标准扫描 3000x2000',
    due_date: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_name || !form.customer_contact || !form.film_type || !form.due_date) {
      alert('请填写必填字段')
      return
    }

    setLoading(true)
    const success = await createRoll({
      ...form,
      assignee_id: currentUser?.id,
      operator_id: currentUser?.id,
      operator_role: currentUser?.role,
    })
    setLoading(false)

    if (success) {
      navigate('/rolls')
    } else {
      alert('创建失败，请重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/rolls')}
          className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">登记新胶卷</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              预计交付日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                客户姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="请输入客户姓名"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                联系方式 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.customer_contact}
                onChange={(e) => setForm({ ...form, customer_contact: e.target.value })}
                placeholder="手机号或微信号"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              胶卷型号 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.film_type}
              onChange={(e) => setForm({ ...form, film_type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D] bg-white"
            >
              <option value="">请选择胶卷型号</option>
              {FILM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              冲扫规格
            </label>
            <select
              value={form.scan_spec}
              onChange={(e) => setForm({ ...form, scan_spec: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D] bg-white"
            >
              {SCAN_SPECS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              备注
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="特殊要求、客户备注等"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20 focus:border-[#C4813D] resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/rolls')}
            className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#C4813D] text-white rounded-lg text-sm font-medium hover:bg-[#B07030] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? '保存中...' : '保存登记'}
          </button>
        </div>
      </form>
    </div>
  )
}
