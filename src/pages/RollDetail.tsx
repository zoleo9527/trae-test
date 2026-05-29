import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Film,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Camera,
  RefreshCw,
  MessageSquare,
  DollarSign,
} from 'lucide-react'
import { useRollStore } from '@/stores/rollStore'
import { useAuthStore } from '@/stores/authStore'
import {
  STATUS_LABEL,
  STATUS_COLOR,
  ACTION_TYPE_LABEL,
  COMPENSATION_METHOD_LABEL,
  formatDate,
  formatDateTime,
  ROLE_LABEL,
} from '@/lib/status'

export default function RollDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentRoll,
    fetchRollDetail,
    loading,
    startDevelop,
    submitQc,
    submitReworkDecision,
    executeRework,
    submitRecheck,
    requestConfirm,
    submitConfirmResult,
    submitCompensation,
  } = useRollStore()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [activeTab, setActiveTab] = useState<'timeline' | 'qc' | 'confirm'>('timeline')
  const [showQcForm, setShowQcForm] = useState(false)
  const [showDecisionForm, setShowDecisionForm] = useState(false)
  const [showReworkForm, setShowReworkForm] = useState(false)
  const [showRecheckForm, setShowRecheckForm] = useState(false)
  const [showConfirmForm, setShowConfirmForm] = useState(false)
  const [showConfirmResultForm, setShowConfirmResultForm] = useState(false)
  const [showCompensateForm, setShowCompensateForm] = useState(false)

  const [qcForm, setQcForm] = useState({ result: 'pass', issue_desc: '', impact_scope: '' })
  const [decisionForm, setDecisionForm] = useState({ decision: 'rework', reason: '' })
  const [reworkForm, setReworkForm] = useState({ action_detail: '', result: 'completed' })
  const [recheckForm, setRecheckForm] = useState({ result: 'pass', note: '' })
  const [confirmForm, setConfirmForm] = useState({ delivery_desc: '' })
  const [confirmResultForm, setConfirmResultForm] = useState({ result: 'satisfied', feedback: '' })
  const [compensateForm, setCompensateForm] = useState({ amount: '', method: 'refund', reason: '' })

  useEffect(() => {
    if (id) {
      fetchRollDetail(id)
    }
  }, [id])

  const handleDevelop = async () => {
    if (!currentRoll || !currentUser) return
    const success = await startDevelop(currentRoll.id, currentUser.id, currentUser.role)
    if (!success) {
      alert('操作失败')
    }
  }

  const handleQcSubmit = async () => {
    if (!currentRoll || !currentUser) return
    const success = await submitQc(currentRoll.id, {
      result: qcForm.result,
      issue_desc: qcForm.issue_desc,
      impact_scope: qcForm.impact_scope,
      operator_id: currentUser.id,
    })
    if (success) {
      setShowQcForm(false)
    } else {
      alert('操作失败')
    }
  }

  const handleDecisionSubmit = async () => {
    if (!currentRoll || !currentUser || currentRoll.qc_records.length === 0) return
    const success = await submitReworkDecision(
      currentRoll.id,
      currentRoll.qc_records[currentRoll.qc_records.length - 1].id,
      {
        decision: decisionForm.decision,
        reason: decisionForm.reason,
        decided_by: currentUser.id,
      }
    )
    if (success) {
      setShowDecisionForm(false)
    } else {
      alert('操作失败')
    }
  }

  const handleReworkSubmit = async () => {
    if (!currentRoll || !currentUser || currentRoll.rework_decisions.length === 0) return
    const success = await executeRework(
      currentRoll.id,
      currentRoll.rework_decisions[currentRoll.rework_decisions.length - 1].id,
      {
        action_detail: reworkForm.action_detail,
        result: reworkForm.result,
        operator_id: currentUser.id,
      }
    )
    if (success) {
      setShowReworkForm(false)
    } else {
      alert('操作失败')
    }
  }

  const handleRecheckSubmit = async () => {
    if (!currentRoll || !currentUser || currentRoll.rework_executions.length === 0) return
    const success = await submitRecheck(
      currentRoll.id,
      currentRoll.rework_executions[currentRoll.rework_executions.length - 1].id,
      {
        result: recheckForm.result,
        note: recheckForm.note,
        checked_by: currentUser.id,
        operator_role: currentUser.role,
      }
    )
    if (success) {
      setShowRecheckForm(false)
    } else {
      alert('操作失败')
    }
  }

  const handleConfirmSubmit = async () => {
    if (!currentRoll || !currentUser) return
    const success = await requestConfirm(currentRoll.id, {
      delivery_desc: confirmForm.delivery_desc,
      operator_id: currentUser.id,
    })
    if (success) {
      setShowConfirmForm(false)
    } else {
      alert('操作失败')
    }
  }

  const handleConfirmResultSubmit = async () => {
    if (!currentRoll || !currentUser || currentRoll.confirm_requests.length === 0) return
    const success = await submitConfirmResult(
      currentRoll.id,
      currentRoll.confirm_requests[currentRoll.confirm_requests.length - 1].id,
      {
        result: confirmResultForm.result,
        feedback: confirmResultForm.feedback,
        operator_id: currentUser.id,
      }
    )
    if (success) {
      setShowConfirmResultForm(false)
    } else {
      alert('操作失败')
    }
  }

  const handleCompensateSubmit = async () => {
    if (!currentRoll || !currentUser || currentRoll.confirm_results.length === 0) return
    const success = await submitCompensation(
      currentRoll.id,
      currentRoll.confirm_results[currentRoll.confirm_results.length - 1].id,
      {
        amount: parseFloat(compensateForm.amount),
        method: compensateForm.method,
        reason: compensateForm.reason,
        approved_by: currentUser.id,
      }
    )
    if (success) {
      setShowCompensateForm(false)
    } else {
      alert('操作失败')
    }
  }

  if (loading || !currentRoll) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  const canDoAction = (action: string): boolean => {
    if (!currentUser) return false
    const role = currentUser.role
    const status = currentRoll.status

    const permissions: Record<string, Record<string, string[]>> = {
      develop: { registered: ['developer'] },
      qc: { developing: ['developer'] },
      decision: { qc_failed: ['owner'] },
      rework: { reworking: ['developer'] },
      recheck: { recheck: ['developer', 'owner'] },
      confirm_request: { qc_passed: ['cs'], recheck: ['cs'] },
      confirm_result: { confirming: ['cs'] },
      compensate: { compensating: ['owner'] },
    }

    const allowedRoles = permissions[action]?.[status] || []
    return allowedRoles.includes(role)
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
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{currentRoll.roll_number}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[currentRoll.status]}`}>
              {STATUS_LABEL[currentRoll.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500">{currentRoll.customer_name} · {currentRoll.film_type}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Film className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">胶卷型号</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{currentRoll.film_type}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">冲扫规格</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{currentRoll.scan_spec || '-'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">客户信息</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{currentRoll.customer_name}</p>
              <p className="text-xs text-gray-400">{currentRoll.customer_contact}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">预计交付</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{formatDate(currentRoll.due_date)}</p>
              <p className="text-xs text-gray-400">登记: {formatDate(currentRoll.registered_at)}</p>
            </div>
          </div>
        </div>
        {currentRoll.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">备注</p>
            <p className="text-sm text-gray-600 mt-1">{currentRoll.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'timeline', label: '处理时间线', icon: Clock },
            { key: 'qc', label: '质检返工', icon: RefreshCw },
            { key: 'confirm', label: '客户确认', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#C4813D] text-[#C4813D]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                {canDoAction('develop') && (
                  <button
                    onClick={handleDevelop}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    开始冲扫
                  </button>
                )}
                {canDoAction('qc') && (
                  <button
                    onClick={() => setShowQcForm(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    质量检查
                  </button>
                )}
              </div>

              {showQcForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">质检结果</h4>
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="qc_result"
                          value="pass"
                          checked={qcForm.result === 'pass'}
                          onChange={(e) => setQcForm({ ...qcForm, result: e.target.value })}
                        />
                        <span className="text-sm text-gray-700">质检通过</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="qc_result"
                          value="fail"
                          checked={qcForm.result === 'fail'}
                          onChange={(e) => setQcForm({ ...qcForm, result: e.target.value })}
                        />
                        <span className="text-sm text-gray-700">质检未通过</span>
                      </label>
                    </div>
                    {qcForm.result === 'fail' && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">问题描述</label>
                          <textarea
                            value={qcForm.issue_desc}
                            onChange={(e) => setQcForm({ ...qcForm, issue_desc: e.target.value })}
                            placeholder="请描述发现的问题"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">影响范围</label>
                          <input
                            type="text"
                            value={qcForm.impact_scope}
                            onChange={(e) => setQcForm({ ...qcForm, impact_scope: e.target.value })}
                            placeholder="如：第5-10帧受影响"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowQcForm(false)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleQcSubmit}
                        className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm hover:bg-[#B07030]"
                      >
                        确认提交
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
                {currentRoll.actions.map((action, index) => (
                  <div key={action.id} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="w-6 h-6 rounded-full bg-[#C4813D] flex items-center justify-center z-10 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {ACTION_TYPE_LABEL[action.action_type] || action.action_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {ROLE_LABEL[action.operator_role] || action.operator_role}
                        </span>
                      </div>
                      {action.detail && (
                        <p className="text-sm text-gray-600 mt-1">{action.detail}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(action.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'qc' && (
            <div className="space-y-6">
              <div className="flex justify-end mb-4">
                {canDoAction('decision') && (
                  <button
                    onClick={() => setShowDecisionForm(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    返工决策
                  </button>
                )}
                {canDoAction('rework') && (
                  <button
                    onClick={() => setShowReworkForm(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    执行返工
                  </button>
                )}
                {canDoAction('recheck') && (
                  <button
                    onClick={() => setShowRecheckForm(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    复检
                  </button>
                )}
              </div>

              {showDecisionForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">返工决策</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">决策</label>
                      <select
                        value={decisionForm.decision}
                        onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                      >
                        <option value="rework">返工处理</option>
                        <option value="compensate">直接赔偿</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">决策理由</label>
                      <textarea
                        value={decisionForm.reason}
                        onChange={(e) => setDecisionForm({ ...decisionForm, reason: e.target.value })}
                        placeholder="请说明决策理由"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowDecisionForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleDecisionSubmit} className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm hover:bg-[#B07030]">确认提交</button>
                    </div>
                  </div>
                </div>
              )}

              {showReworkForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">返工执行</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">返工操作内容</label>
                      <textarea
                        value={reworkForm.action_detail}
                        onChange={(e) => setReworkForm({ ...reworkForm, action_detail: e.target.value })}
                        placeholder="请描述返工操作内容"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowReworkForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleReworkSubmit} className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm hover:bg-[#B07030]">确认完成</button>
                    </div>
                  </div>
                </div>
              )}

              {showRecheckForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">复检结果</h4>
                  <div className="space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="recheck_result" value="pass" checked={recheckForm.result === 'pass'} onChange={(e) => setRecheckForm({ ...recheckForm, result: e.target.value })} />
                        <span className="text-sm text-gray-700">复检通过</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="recheck_result" value="fail" checked={recheckForm.result === 'fail'} onChange={(e) => setRecheckForm({ ...recheckForm, result: e.target.value })} />
                        <span className="text-sm text-gray-700">复检未通过</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">复检备注</label>
                      <textarea value={recheckForm.note} onChange={(e) => setRecheckForm({ ...recheckForm, note: e.target.value })} placeholder="复检备注" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowRecheckForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleRecheckSubmit} className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm hover:bg-[#B07030]">确认提交</button>
                    </div>
                  </div>
                </div>
              )}

              {currentRoll.qc_records.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    质检记录
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.qc_records.map((qc) => (
                      <div key={qc.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {qc.result === 'pass' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium text-gray-800">
                              {qc.result === 'pass' ? '质检通过' : '质检未通过'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDateTime(qc.created_at)}</span>
                        </div>
                        {qc.issue_desc && (
                          <p className="text-sm text-gray-600 mt-2">问题: {qc.issue_desc}</p>
                        )}
                        {qc.impact_scope && (
                          <p className="text-sm text-gray-500 mt-1">影响: {qc.impact_scope}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentRoll.rework_decisions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    返工决策
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.rework_decisions.map((dec) => (
                      <div key={dec.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">
                            {dec.decision === 'rework' ? '决定返工' : '决定赔偿'}
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(dec.created_at)}</span>
                        </div>
                        {dec.reason && <p className="text-sm text-gray-600 mt-2">理由: {dec.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentRoll.rework_executions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    返工执行
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.rework_executions.map((exec) => (
                      <div key={exec.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">返工完成</span>
                          <span className="text-xs text-gray-400">{formatDateTime(exec.created_at)}</span>
                        </div>
                        {exec.action_detail && <p className="text-sm text-gray-600 mt-2">{exec.action_detail}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentRoll.recheck_records.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    复检记录
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.recheck_records.map((rec) => (
                      <div key={rec.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {rec.result === 'pass' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium text-gray-800">
                              {rec.result === 'pass' ? '复检通过' : '复检未通过'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDateTime(rec.created_at)}</span>
                        </div>
                        {rec.note && <p className="text-sm text-gray-600 mt-2">{rec.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'confirm' && (
            <div className="space-y-6">
              <div className="flex justify-end mb-4">
                {canDoAction('confirm_request') && (
                  <button
                    onClick={() => setShowConfirmForm(true)}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    发起客户确认
                  </button>
                )}
                {canDoAction('confirm_result') && (
                  <button
                    onClick={() => setShowConfirmResultForm(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    记录客户反馈
                  </button>
                )}
                {canDoAction('compensate') && (
                  <button
                    onClick={() => setShowCompensateForm(true)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    赔付处理
                  </button>
                )}
              </div>

              {showConfirmForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">发起客户确认</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">交付物说明</label>
                      <textarea value={confirmForm.delivery_desc} onChange={(e) => setConfirmForm({ ...confirmForm, delivery_desc: e.target.value })} placeholder="请描述交付内容" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowConfirmForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleConfirmSubmit} className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm hover:bg-[#B07030]">确认发送</button>
                    </div>
                  </div>
                </div>
              )}

              {showConfirmResultForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">客户反馈</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">反馈结果</label>
                      <select
                        value={confirmResultForm.result}
                        onChange={(e) => setConfirmResultForm({ ...confirmResultForm, result: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                      >
                        <option value="satisfied">客户满意</option>
                        <option value="compensation">要求赔偿</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">反馈内容</label>
                      <textarea value={confirmResultForm.feedback} onChange={(e) => setConfirmResultForm({ ...confirmResultForm, feedback: e.target.value })} placeholder="客户反馈内容" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowConfirmResultForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleConfirmResultSubmit} className="px-4 py-2 bg-[#C4813D] text-white rounded-lg text-sm hover:bg-[#B07030]">确认提交</button>
                    </div>
                  </div>
                </div>
              )}

              {showCompensateForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-800 mb-3">赔付处理</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">赔付金额</label>
                      <input type="number" value={compensateForm.amount} onChange={(e) => setCompensateForm({ ...compensateForm, amount: e.target.value })} placeholder="请输入赔付金额" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">赔付方式</label>
                      <select
                        value={compensateForm.method}
                        onChange={(e) => setCompensateForm({ ...compensateForm, method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20"
                      >
                        <option value="refund">退款</option>
                        <option value="rework">免费重冲</option>
                        <option value="voucher">代金券</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">赔付原因</label>
                      <textarea value={compensateForm.reason} onChange={(e) => setCompensateForm({ ...compensateForm, reason: e.target.value })} placeholder="赔付原因说明" rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C4813D]/20" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowCompensateForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                      <button onClick={handleCompensateSubmit} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">确认赔付</button>
                    </div>
                  </div>
                </div>
              )}

              {currentRoll.confirm_requests.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    确认请求
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.confirm_requests.map((req) => (
                      <div key={req.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">发起客户确认</span>
                          <span className="text-xs text-gray-400">{formatDateTime(req.created_at)}</span>
                        </div>
                        {req.delivery_desc && <p className="text-sm text-gray-600 mt-2">{req.delivery_desc}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentRoll.confirm_results.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-500" />
                    客户反馈
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.confirm_results.map((res) => (
                      <div key={res.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {res.result === 'satisfied' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className="font-medium text-gray-800">
                              {res.result === 'satisfied' ? '客户满意' : '要求赔偿'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDateTime(res.created_at)}</span>
                        </div>
                        {res.feedback && <p className="text-sm text-gray-600 mt-2">{res.feedback}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentRoll.compensation_records.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-500" />
                    赔付记录
                  </h3>
                  <div className="space-y-3">
                    {currentRoll.compensation_records.map((rec) => (
                      <div key={rec.id} className="border border-red-100 rounded-lg p-4 bg-red-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800">
                            赔付: ¥{rec.amount} ({COMPENSATION_METHOD_LABEL[rec.method] || rec.method})
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(rec.created_at)}</span>
                        </div>
                        {rec.reason && <p className="text-sm text-gray-600 mt-2">原因: {rec.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
