import { useState } from 'react'
import { X, Send, CheckCircle } from 'lucide-react'

export default function BatchActionBar({ selectedCount, onAction, onClear }) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusOptions = [
    { value: 'in_progress', label: '标记进行中' },
    { value: 'rectifying', label: '派单整改' },
    { value: 'rechecking', label: '标记待复查' },
    { value: 'completed', label: '批量完成' },
  ]

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-0 left-64 right-0 z-50 bg-white border-t shadow-lg">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            已选择 <span className="font-semibold text-blue-600">{selectedCount}</span> 项
          </span>
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X size={14} />
            取消选择
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Send size={16} />
              批量更新状态
            </button>
            {showStatusMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 rounded-lg border bg-white py-2 shadow-lg">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onAction('status', option.value)
                      setShowStatusMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
