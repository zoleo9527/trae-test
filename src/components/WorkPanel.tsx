import { useState } from 'react'
import {
  X,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  Undo2,
  Clock,
  User,
  MapPin,
  Wrench,
} from 'lucide-react'
import { useWorkOrderStore } from '@/store/useWorkOrderStore'
import { useAuthStore } from '@/store/useAuthStore'
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/Badge'
import { formatDateTime, getOverdueTime, isOverdue } from '@/utils/format'
import type { WorkOrder } from '@/types'

interface WorkPanelProps {
  workOrder: WorkOrder | null
  onClose: () => void
}

export function WorkPanel({ workOrder, onClose }: WorkPanelProps) {
  const { user } = useAuthStore()
  const { returnWorkOrder, escalateWorkOrder, completeWorkOrder, addLog, updateWorkOrder } = useWorkOrderStore()
  const [remark, setRemark] = useState('')
  const [showActions, setShowActions] = useState(false)

  if (!workOrder) return null

  const handleAddRemark = () => {
    if (!remark.trim() || !user) return
    addLog(workOrder.id, {
      operatorId: user.id,
      operatorName: user.name,
      action: '添加备注',
      remark: remark.trim(),
    })
    setRemark('')
  }

  const handleReturn = () => {
    if (!remark.trim() || !user) return
    returnWorkOrder(workOrder.id, remark.trim(), user.id, user.name)
    setRemark('')
    setShowActions(false)
  }

  const handleEscalate = () => {
    if (!remark.trim() || !user) return
    escalateWorkOrder(workOrder.id, remark.trim(), user.id, user.name)
    setRemark('')
    setShowActions(false)
  }

  const handleComplete = () => {
    if (!user) return
    completeWorkOrder(workOrder.id, remark.trim() || '处理完成', user.id, user.name)
    setRemark('')
    setShowActions(false)
  }

  const handleAccept = () => {
    if (!user) return
    updateWorkOrder(workOrder.id, { status: 'processing', assigneeId: user.id, assigneeName: user.name })
    addLog(workOrder.id, {
      operatorId: user.id,
      operatorName: user.name,
      action: '接收工单',
    })
  }

  const overdue = isOverdue(workOrder.deadline)

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col z-40 border-l border-slate-200">
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">工单处理台</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-slate-900 text-lg leading-tight">
                {workOrder.title}
              </h4>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatusBadge status={workOrder.status} />
              <PriorityBadge priority={workOrder.priority} />
              <TypeBadge type={workOrder.type} />
            </div>
            {overdue && workOrder.deadline && (
              <div className="flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-3">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {getOverdueTime(workOrder.deadline)}
              </div>
            )}
            <p className="text-slate-600 text-sm leading-relaxed">
              {workOrder.description}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center text-slate-600">
              <MapPin className="w-4 h-4 mr-3 text-slate-400" />
              <span>{workOrder.siteName}</span>
              {workOrder.deviceName && (
                <span className="text-slate-400 ml-2">· {workOrder.deviceName}</span>
              )}
            </div>
            <div className="flex items-center text-slate-600">
              <User className="w-4 h-4 mr-3 text-slate-400" />
              <span>报修人：{workOrder.reporterName}</span>
            </div>
            {workOrder.assigneeName && (
              <div className="flex items-center text-slate-600">
                <Wrench className="w-4 h-4 mr-3 text-slate-400" />
                <span>处理人：{workOrder.assigneeName}</span>
              </div>
            )}
            <div className="flex items-center text-slate-600">
              <Clock className="w-4 h-4 mr-3 text-slate-400" />
              <span>创建时间：{formatDateTime(workOrder.createdAt)}</span>
            </div>
            {workOrder.refundAmount && (
              <div className="flex items-center text-rose-600 font-medium">
                退款金额：¥{workOrder.refundAmount}
              </div>
            )}
          </div>

          {workOrder.attachments.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-slate-700 mb-3">附件</h5>
              <div className="grid grid-cols-3 gap-2">
                {workOrder.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 group relative"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs px-2 text-center truncate">
                        {att.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5 className="text-sm font-medium text-slate-700 mb-3">处理记录</h5>
            <div className="space-y-3">
              {[...workOrder.logs].reverse().map((log, index) => (
                <div key={log.id} className="relative pl-5">
                  {index < workOrder.logs.length - 1 && (
                    <div className="absolute left-1.5 top-6 bottom-0 w-px bg-slate-200" />
                  )}
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">
                        {log.operatorName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{log.action}</p>
                    {log.remark && (
                      <p className="text-sm text-slate-500 mt-1 bg-white rounded px-2 py-1">
                        {log.remark}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 p-4 bg-slate-50">
        {!showActions ? (
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="输入处理备注..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={handleAddRemark}
                className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex space-x-2">
              {workOrder.status === 'assigned' && (
                <button
                  onClick={handleAccept}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  接收工单
                </button>
              )}
              <button
                onClick={() => setShowActions(true)}
                className="flex-1 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
              >
                更多操作
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleComplete}
              className="w-full px-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              标记完成
            </button>
            <button
              onClick={handleEscalate}
              className="w-full px-3 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              申请升级
            </button>
            <button
              onClick={handleReturn}
              className="w-full px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center"
            >
              <Undo2 className="w-4 h-4 mr-2" />
              退回工单
            </button>
            <button
              onClick={() => setShowActions(false)}
              className="w-full px-3 py-2 text-slate-600 hover:text-slate-800 text-sm"
            >
              取消
            </button>
            <p className="text-xs text-slate-500 text-center">
              {remark ? '将使用上方备注内容' : '请先在上方输入备注'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
