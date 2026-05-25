import { useState } from 'react'

export default function TwoPanelLayout({
  listPanel,
  detailPanel,
  selectedId,
  onSelect,
}) {
  const [detailWidth, setDetailWidth] = useState(50)

  return (
    <div className="h-full flex bg-white">
      <div
        className="h-full overflow-hidden border-r border-gray-200"
        style={{ width: `${100 - detailWidth}%` }}
      >
        {listPanel}
      </div>

      <div
        className="w-1 bg-gray-100 hover:bg-blue-400 cursor-col-resize flex-shrink-0"
        onMouseDown={(e) => {
          e.preventDefault()
          const startX = e.clientX
          const startWidth = detailWidth
          const container = e.currentTarget.parentElement

          const handleMouseMove = (moveEvent) => {
            const diff = moveEvent.clientX - startX
            const containerWidth = container.clientWidth
            const newWidth = startWidth - (diff / containerWidth) * 100
            setDetailWidth(Math.max(30, Math.min(70, newWidth)))
          }

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }

          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      />

      <div
        className="h-full overflow-hidden bg-gray-50"
        style={{ width: `${detailWidth}%` }}
      >
        {selectedId ? (
          detailPanel
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <p>请从左侧列表选择一条记录查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
