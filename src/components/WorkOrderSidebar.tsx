import { useState } from 'react';
import { X, Clock, User, Calendar, AlertTriangle, Package, Send, FileText, Camera, ChevronRight, Users, CheckCircle, XCircle, ArrowLeftRight } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import {
  workOrderStatusLabels,
  workOrderStatusColors,
  workOrderPriorityLabels,
  workOrderPriorityColors,
  sparePartStatusLabels,
  sparePartStatusColors,
  actionLabels,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { WorkOrderStatus, SparePartRequest } from '../types';
import SparePartApprovalModal from './SparePartApprovalModal';
import SparePartIssueReturnModal from './SparePartIssueReturnModal';

export default function WorkOrderSidebar() {
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'logs' | 'spareparts'>('info');
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showIssueReturnModal, setShowIssueReturnModal] = useState(false);
  const [issueReturnMode, setIssueReturnMode] = useState<'issue' | 'return'>('issue');
  const [selectedSparePart, setSelectedSparePart] = useState<SparePartRequest | null>(null);

  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const selectedWorkOrderId = useStore((state) => state.selectedWorkOrderId);
  const workOrders = useStore((state) => state.workOrders);
  const selectWorkOrder = useStore((state) => state.selectWorkOrder);
  const updateWorkOrderStatus = useStore((state) => state.updateWorkOrderStatus);
  const assignWorkOrder = useStore((state) => state.assignWorkOrder);
  const requestSparePart = useStore((state) => state.requestSparePart);
  const getWorkOrderLogs = useStore((state) => state.getWorkOrderLogs);
  const getWorkOrderAlarms = useStore((state) => state.getWorkOrderAlarms);
  const getWorkOrderSpareParts = useStore((state) => state.getWorkOrderSpareParts);
  const getUserName = useStore((state) => state.getUserName);
  const getEngineers = useStore((state) => state.getEngineers);
  const currentUser = useStore((state) => state.currentUser);

  const workOrder = workOrders.find((wo) => wo.id === selectedWorkOrderId);
  const logs = workOrder ? getWorkOrderLogs(workOrder.id) : [];
  const alarms = workOrder ? getWorkOrderAlarms(workOrder.id) : [];
  const spareParts = workOrder ? getWorkOrderSpareParts(workOrder.id) : [];
  const engineers = getEngineers();

  const closeSidebar = () => {
    selectWorkOrder(null);
    setRemark('');
    setShowAssignDropdown(false);
  };

  const handleStatusChange = (newStatus: WorkOrderStatus) => {
    if (!workOrder || !remark.trim()) return;
    updateWorkOrderStatus(workOrder.id, newStatus, remark);
    setRemark('');
  };

  const handleAssign = (engineerId: string) => {
    if (!workOrder) return;
    assignWorkOrder(workOrder.id, engineerId, remark || `重新分派给 ${getUserName(engineerId)}`);
    setRemark('');
    setShowAssignDropdown(false);
  };

  const handleRequestSparePart = () => {
    if (!workOrder || !remark.trim()) return;
    requestSparePart(workOrder.id, '熔断器', 'RT18-32/10A', 2, '个');
    setRemark('');
  };

  const canApproveSparePart = currentUser?.role === 'admin' || currentUser?.role === 'staff';
  const hasPendingSpareParts = spareParts.some((sp) => sp.status === 'pending');

  const getAvailableActions = (): { status: WorkOrderStatus; label: string; color: string; icon: React.ReactNode }[] => {
    if (!workOrder) return [];

    const role = currentUser?.role;
    const status = workOrder.status;

    if (role === 'engineer') {
      switch (status) {
        case 'pending':
        case 'returned':
          return [{ status: 'processing', label: '开始处理', color: 'bg-blue-600 hover:bg-blue-700', icon: <Send className="w-4 h-4" /> }];
        case 'processing':
          return [
            { status: 'reviewing', label: '提交完成', color: 'bg-green-600 hover:bg-green-700', icon: <CheckCircle className="w-4 h-4" /> },
          ];
        case 'waiting_spare':
          if (hasPendingSpareParts) {
            return [];
          }
          return [{ status: 'processing', label: '备件到位继续', color: 'bg-blue-600 hover:bg-blue-700', icon: <Send className="w-4 h-4" /> }];
        default:
          return [];
      }
    }

    if (role === 'admin') {
      switch (status) {
        case 'reviewing':
          return [
            { status: 'closed', label: '审核通过', color: 'bg-green-600 hover:bg-green-700', icon: <CheckCircle className="w-4 h-4" /> },
            { status: 'returned', label: '退回重处理', color: 'bg-red-600 hover:bg-red-700', icon: <XCircle className="w-4 h-4" /> },
          ];
        default:
          return [];
      }
    }

    if (role === 'staff') {
      return [];
    }

    return [];
  };

  const canAssign = (currentUser?.role === 'staff' || currentUser?.role === 'admin') && workOrder?.status !== 'closed';

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  };

  if (!sidebarOpen || !workOrder) {
    return null;
  }

  const actions = getAvailableActions();
  const pendingSpareParts = spareParts.filter((sp) => sp.status === 'pending');

  return (
    <div
      className={cn(
        'fixed right-0 top-16 bottom-0 w-full lg:w-[480px] bg-white border-l border-slate-200 shadow-xl z-40 flex flex-col transition-transform duration-300 transform',
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-800">工单处理</h3>
          <span
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border font-medium',
              workOrderStatusColors[workOrder.status]
            )}
          >
            {workOrderStatusLabels[workOrder.status]}
          </span>
        </div>
        <button
          onClick={closeSidebar}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        {[
          { id: 'info', label: '详情', icon: FileText },
          { id: 'logs', label: '处理记录', icon: Clock },
          { id: 'spareparts', label: '备件', badge: pendingSpareParts.length },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px relative',
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute top-2 right-6 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-4 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">{workOrder.title}</h4>
              <p className="text-sm text-slate-600">{workOrder.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">负责人:</span>
                <span className="text-slate-700 font-medium">{getUserName(workOrder.assigneeId)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">优先级:</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    workOrderPriorityColors[workOrder.priority]
                  )}
                >
                  {workOrderPriorityLabels[workOrder.priority]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">创建时间:</span>
                <span className="text-slate-700">{formatDate(workOrder.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">截止时间:</span>
                <span className="text-slate-700">{formatDate(workOrder.deadline)}</span>
              </div>
            </div>

            {canAssign && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  重新分派工单
                </h5>
                <div className="relative">
                  <button
                    onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm text-left flex items-center justify-between hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-slate-600">选择工程师</span>
                    <ChevronRight className={cn('w-4 h-4 text-slate-400 transition-transform', showAssignDropdown && 'rotate-90')} />
                  </button>
                  {showAssignDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                      {engineers.map((engineer) => (
                        <button
                          key={engineer.id}
                          onClick={() => handleAssign(engineer.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                          <img
                            src={engineer.avatar}
                            alt={engineer.name}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-slate-700">{engineer.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {alarms.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  关联发电预警
                </h5>
                <div className="space-y-2">
                  {alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-800 text-sm">{alarm.type}</span>
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            alarm.level === 'critical'
                              ? 'bg-red-500'
                              : alarm.level === 'warning'
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                          )}
                        />
                      </div>
                      <p className="text-xs text-slate-600">{alarm.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>设备: {alarm.inverterId}</span>
                        <span>当前值: {alarm.currentValue}</span>
                        <span>阈值: {alarm.thresholdValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workOrder.photos.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-500" />
                  现场照片
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  {workOrder.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center"
                    >
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-4">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-6">
                {logs.map((log, index) => (
                  <div key={log.id} className="relative pl-10">
                    <div
                      className={cn(
                        'absolute left-2 top-1 w-5 h-5 rounded-full border-2 border-white',
                        index === 0 ? 'bg-blue-500' : 'bg-slate-300'
                      )}
                    />
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-800 text-sm">
                          {actionLabels[log.action] || log.action}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-600">{log.remark}</p>
                      <p className="text-xs text-slate-400 mt-1">操作人: {getUserName(log.operatorId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'spareparts' && (
          <div className="p-4">
            {spareParts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>暂无备件领用记录</p>
              </div>
            ) : (
              <div className="space-y-4">
                {spareParts.map((sp) => (
                  <div key={sp.id} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <div className="p-3 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-800">{sp.partName}</span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {sp.partCode} · {sp.quantity}{sp.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              sparePartStatusColors[sp.status]
                            )}
                          >
                            {sparePartStatusLabels[sp.status]}
                          </span>
                          <div className="flex items-center gap-1">
                            {sp.status === 'pending' && canApproveSparePart && (
                              <button
                                onClick={() => {
                                  setSelectedSparePart(sp);
                                  setShowApprovalModal(true);
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="审批"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {sp.status === 'approved' && canApproveSparePart && (
                              <button
                                onClick={() => {
                                  setSelectedSparePart(sp);
                                  setIssueReturnMode('issue');
                                  setShowIssueReturnModal(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="发放"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}
                            {sp.status === 'issued' && canApproveSparePart && (
                              <button
                                onClick={() => {
                                  setSelectedSparePart(sp);
                                  setIssueReturnMode('return');
                                  setShowIssueReturnModal(true);
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="归还"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      <h5 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        流向追踪
                      </h5>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700">申请</span>
                              <span className="text-xs text-slate-400">{formatDate(sp.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-500">{getUserName(sp.requesterId)}</p>
                          </div>
                        </div>

                        {sp.approvedAt && (
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">批准</span>
                                <span className="text-xs text-slate-400">{formatDate(sp.approvedAt)}</span>
                              </div>
                              <p className="text-xs text-slate-500">{sp.approverId ? getUserName(sp.approverId) : '-'}</p>
                            </div>
                          </div>
                        )}

                        {sp.issuedAt && (
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">发放</span>
                                <span className="text-xs text-slate-400">{formatDate(sp.issuedAt)}</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {sp.issuerId ? getUserName(sp.issuerId) : '-'}
                                {sp.issueRemark && ` · ${sp.issueRemark}`}
                              </p>
                            </div>
                          </div>
                        )}

                        {sp.returnedAt && (
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">归还</span>
                                <span className="text-xs text-slate-400">{formatDate(sp.returnedAt)}</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                {sp.returnerId ? getUserName(sp.returnerId) : '-'}
                                {sp.returnRemark && ` · ${sp.returnRemark}`}
                              </p>
                            </div>
                          </div>
                        )}

                        {sp.status === 'rejected' && (
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">已拒绝</span>
                                <span className="text-xs text-slate-400">{sp.approvedAt ? formatDate(sp.approvedAt) : '-'}</span>
                              </div>
                              <p className="text-xs text-slate-500">{sp.approverId ? getUserName(sp.approverId) : '-'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="mb-4">
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="输入处理备注..."
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusChange(action.status)}
                  disabled={!remark.trim()}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    action.color
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {currentUser?.role === 'engineer' && workOrder.status === 'processing' && (
            <button
              onClick={handleRequestSparePart}
              disabled={!remark.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Package className="w-4 h-4" />
              申请备件 (需填写备注)
            </button>
          )}

          {actions.length === 0 && workOrder.status !== 'waiting_spare' && (
            <p className="text-center text-sm text-slate-500">
              当前状态无可用操作，请等待其他角色处理
            </p>
          )}

          {workOrder.status === 'waiting_spare' && hasPendingSpareParts && (
            <p className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded-lg">
              {currentUser?.role === 'engineer'
                ? '存在未审批的备件申请，请等待站长或内勤审批'
                : '工单等待备件审批中，请前往备件管理或点击上方备件标签页处理'}
            </p>
          )}
        </div>
      </div>

      <SparePartApprovalModal
        isOpen={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedSparePart(null);
        }}
        sparePart={selectedSparePart}
      />

      <SparePartIssueReturnModal
        isOpen={showIssueReturnModal}
        onClose={() => {
          setShowIssueReturnModal(false);
          setSelectedSparePart(null);
        }}
        sparePart={selectedSparePart}
        mode={issueReturnMode}
      />
    </div>
  );
}
