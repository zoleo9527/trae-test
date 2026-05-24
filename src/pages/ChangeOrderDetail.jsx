import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  User, 
  Printer, 
  Edit3,
  Send,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { statusMap, typeMap, roleMap } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { cn } from '../utils/cn';

function StatusBadge({ status }) {
  const config = statusMap[status] || { label: status, color: 'default' };
  const colorClasses = {
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
    primary: 'bg-blue-100 text-blue-700',
    default: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={cn('px-2 py-1 text-xs font-medium rounded-full', colorClasses[config.color])}>
      {config.label}
    </span>
  );
}

function ApprovalStep({ title, role, approval, isCurrent, isPending }) {
  const status = approval?.approved === true ? 'approved' : 
                 approval?.approved === false ? 'rejected' : 'pending';

  const statusColors = {
    approved: 'border-green-500 bg-green-50',
    rejected: 'border-red-500 bg-red-50',
    pending: 'border-gray-300 bg-gray-50',
  };

  const iconColors = {
    approved: 'text-green-500',
    rejected: 'text-red-500',
    pending: 'text-gray-400',
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 transition-all',
      statusColors[status],
      isCurrent && 'ring-2 ring-primary-500 ring-offset-2'
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{title}</span>
        <span className={cn(
          'text-xs px-2 py-0.5 rounded',
          roleMap[role]?.color === 'primary' ? 'bg-blue-100 text-blue-700' :
          roleMap[role]?.color === 'success' ? 'bg-green-100 text-green-700' :
          'bg-yellow-100 text-yellow-700'
        )}>
          {roleMap[role]?.label}
        </span>
      </div>
      <div className="flex items-center">
        {status === 'approved' ? (
          <Check className={cn('w-5 h-5', iconColors[status])} />
        ) : status === 'rejected' ? (
          <X className={cn('w-5 h-5', iconColors[status])} />
        ) : (
          <Clock className={cn('w-5 h-5', iconColors[status])} />
        )}
        <span className="ml-2 text-sm text-gray-600">
          {status === 'approved' ? `已批准 - ${approval.user}` :
           status === 'rejected' ? `已驳回 - ${approval.user}` :
           isPending ? '待处理' : '等待中'}
        </span>
      </div>
      {approval?.comment && (
        <div className="mt-2 text-sm text-gray-500 bg-white px-3 py-2 rounded">
          {approval.comment}
        </div>
      )}
      {approval?.time && (
        <div className="mt-1 text-xs text-gray-400">{approval.time}</div>
      )}
    </div>
  );
}

export default function ChangeOrderDetail({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { changeOrders, managerApprove, managerReject, supervisorResubmit, sendOwnerConfirmation, ownerApprove } = useApp();
  const order = changeOrders.find(o => o.id === id);
  
  const [comment, setComment] = useState('');
  const [showActionModal, setShowActionModal] = useState(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-gray-500">变更单不存在</div>
        <Link to="/change-orders" className="mt-4 text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  const isMyTurn = order.currentHandler === currentUser.role;

  const handlePrint = async () => {
    const printContent = `
      <div class="header">
        <div class="title">工程变更单回执</div>
        <div class="subtitle">${order.id}</div>
      </div>
      <table class="info-table">
        <tr><td class="label">项目名称</td><td>${order.projectName}</td></tr>
        <tr><td class="label">变更类型</td><td>${typeMap[order.type]?.label}</td></tr>
        <tr><td class="label">变更内容</td><td>${order.title}</td></tr>
        <tr><td class="label">变更原因</td><td>${order.reason}</td></tr>
        <tr><td class="label">版本</td><td>v${order.version}</td></tr>
        <tr><td class="label">原费用</td><td>¥${order.costChange.original.toLocaleString()}</td></tr>
        <tr><td class="label">变更后费用</td><td>¥${order.costChange.new.toLocaleString()}</td></tr>
        <tr><td class="label">费用差额</td><td>${order.costChange.difference > 0 ? '+' : ''}¥${order.costChange.difference.toLocaleString()}</td></tr>
        <tr><td class="label">备注</td><td>${order.costChange.note}</td></tr>
      </table>
      <div class="sign-section">
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>监理负责人签字</div>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>项目管家签字</div>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <div>业主签字</div>
        </div>
      </div>
      <div class="footer">打印时间：${new Date().toLocaleString()}</div>
    `;
    
    if (window.electron) {
      await window.electron.invoke('print-receipt', printContent);
    } else {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>打印回执</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
              .subtitle { font-size: 14px; color: #666; }
              .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .info-table td { padding: 10px; border: 1px solid #ddd; }
              .info-table .label { background: #f5f5f5; width: 150px; font-weight: 500; }
              .sign-section { margin-top: 40px; display: flex; justify-content: space-between; }
              .sign-box { width: 200px; text-align: center; }
              .sign-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 10px; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleApprove = () => {
    managerApprove(order.id, currentUser.id, comment);
    setShowActionModal(null);
    setComment('');
  };

  const handleReject = () => {
    managerReject(order.id, currentUser.id, comment);
    setShowActionModal(null);
    setComment('');
  };

  const handleResubmit = () => {
    supervisorResubmit(order.id, currentUser.id);
    setIsResubmitting(false);
  };

  const handleSendOwnerConfirmation = () => {
    sendOwnerConfirmation(order.id, currentUser.id);
    alert('已发送业主确认通知');
  };

  const handleOwnerApprove = () => {
    ownerApprove(order.id);
    setShowActionModal(null);
    navigate('/change-orders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/change-orders" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900">{order.title}</h1>
              <StatusBadge status={order.status} />
              <span className="text-sm text-gray-500">v{order.version}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {order.id} · {order.projectName}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {order.status === 'completed' && (
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              打印回执
            </button>
          )}
          
          {currentUser.role === 'supervisor' && order.status === 'rejected' && (
            <button 
              onClick={() => setIsResubmitting(true)}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新提交
            </button>
          )}
          
          {currentUser.role === 'manager' && order.status === 'pending_approval' && (
            <>
              <button 
                onClick={() => setShowActionModal('approve')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4 mr-2" />
                审核通过
              </button>
              <button 
                onClick={() => setShowActionModal('reject')}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4 mr-2" />
                驳回
              </button>
            </>
          )}
          
          {order.status === 'pending_owner_send' && currentUser.role === 'manager' && (
            <button 
              onClick={handleSendOwnerConfirmation}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              发送业主确认
            </button>
          )}
          
          {order.status === 'pending_owner' && (
            <button 
              onClick={() => setShowActionModal('owner_approve')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              模拟业主签字确认
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">变更详情</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">变更类型</label>
                <div className="mt-1 text-gray-900">{typeMap[order.type]?.label}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500">创建人</label>
                <div className="mt-1 text-gray-900">{order.createdBy}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-500">变更原因</label>
                <div className="mt-1 text-gray-900">{order.reason}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-gray-500">详细描述</label>
                <div className="mt-1 text-gray-900">{order.description}</div>
              </div>
            </div>
          </div>

          {order.images && order.images.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">相关图片</h2>
              <div className="grid grid-cols-4 gap-4">
                {order.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">审批流程</h2>
            <div className="grid grid-cols-3 gap-4">
              <ApprovalStep 
                title="监理审核" 
                role="supervisor" 
                approval={order.approvals.supervisor}
                isCurrent={order.currentHandler === 'supervisor'}
                isPending={order.currentHandler === 'supervisor'}
              />
              <ApprovalStep 
                title="管家审核" 
                role="manager" 
                approval={order.approvals.manager}
                isCurrent={order.currentHandler === 'manager'}
                isPending={order.status === 'pending_approval'}
              />
              <ApprovalStep 
                title="业主确认" 
                role="owner" 
                approval={order.approvals.owner}
                isCurrent={order.currentHandler === 'owner'}
                isPending={order.status === 'pending_owner_send' || order.status === 'pending_owner'}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">处理时间线</h2>
            <div className="space-y-4">
              {order.timeline.map((item, idx) => (
                <div key={idx} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      idx === order.timeline.length - 1 ? 'bg-primary-500' : 'bg-gray-300'
                    )} />
                    {idx < order.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{item.action}</span>
                        <span className={cn(
                          'ml-2 text-xs px-2 py-0.5 rounded',
                          roleMap[item.role]?.color === 'primary' ? 'bg-blue-100 text-blue-700' :
                          roleMap[item.role]?.color === 'success' ? 'bg-green-100 text-green-700' :
                          roleMap[item.role]?.color === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {roleMap[item.role]?.label || item.role}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{item.time}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">操作人：{item.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">费用变更</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">原合同费用</span>
                <span className="font-medium text-gray-900">¥{order.costChange.original.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">变更后费用</span>
                <span className="font-medium text-gray-900">¥{order.costChange.new.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 -mx-3">
                <span className="text-gray-700 font-medium">费用差额</span>
                <span className={cn(
                  'text-lg font-bold',
                  order.costChange.difference > 0 ? 'text-red-600' : 
                  order.costChange.difference < 0 ? 'text-green-600' : 'text-gray-600'
                )}>
                  {order.costChange.difference > 0 ? '+' : ''}¥{order.costChange.difference.toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                {order.costChange.note}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">当前处理</h2>
            {order.currentHandler ? (
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <div className={cn(
                    'text-sm px-2 py-0.5 inline-block rounded',
                    roleMap[order.currentHandler]?.color === 'primary' ? 'bg-blue-100 text-blue-700' :
                    roleMap[order.currentHandler]?.color === 'success' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  )}>
                    {roleMap[order.currentHandler]?.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isMyTurn ? '轮到您处理' : '等待处理中...'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div>流程已完成</div>
              </div>
            )}
          </div>

          {isMyTurn && (
            <div className="bg-primary-50 rounded-xl border border-primary-200 p-6">
              <h3 className="font-medium text-primary-700 mb-3">您的待办</h3>
              
              {order.status === 'pending_approval' && currentUser.role === 'manager' && (
                <>
                  <p className="text-sm text-primary-600 mb-4">
                    该变更单需要您审核，请确认费用和内容无误。
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowActionModal('approve')}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      通过
                    </button>
                    <button 
                      onClick={() => setShowActionModal('reject')}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      驳回
                    </button>
                  </div>
                </>
              )}
              
              {order.status === 'pending_owner_send' && currentUser.role === 'manager' && (
                <>
                  <p className="text-sm text-primary-600 mb-4">
                    请发送业主确认通知，待业主签字确认后变更生效。
                  </p>
                  <button 
                    onClick={handleSendOwnerConfirmation}
                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    发送业主确认
                  </button>
                </>
              )}
              
              {order.status === 'rejected' && currentUser.role === 'supervisor' && (
                <>
                  <p className="text-sm text-primary-600 mb-4">
                    该变更单已被驳回，请修改后重新提交。
                  </p>
                  <button 
                    onClick={() => setIsResubmitting(true)}
                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    编辑并重新提交
                  </button>
                </>
              )}
            </div>
          )}
          
          {order.status === 'pending_owner' && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
              <h3 className="font-medium text-yellow-700 mb-3">待业主确认</h3>
              <p className="text-sm text-yellow-600 mb-4">
                已发送业主确认通知，等待业主签字确认。
              </p>
              <button 
                onClick={() => setShowActionModal('owner_approve')}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                模拟业主签字确认
              </button>
            </div>
          )}

          {currentUser.role === 'service' && (
            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
              <h3 className="font-medium text-yellow-700 mb-3">客服回查</h3>
              <p className="text-sm text-yellow-600 mb-4">
                您可以查看所有变更单的完整历史记录，用于业主咨询时的回溯查询。
              </p>
              <button 
                onClick={handlePrint}
                className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                打印完整记录
              </button>
            </div>
          )}
        </div>
      </div>

      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowActionModal(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showActionModal === 'approve' ? '确认审核通过' : 
               showActionModal === 'reject' ? '驳回变更单' :
               '确认业主已签字确认'}
            </h3>
            {showActionModal === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">驳回原因</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入驳回原因..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                />
              </div>
            )}
            {showActionModal === 'approve' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">审核意见（可选）</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入审核意见..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
            )}
            {showActionModal === 'owner_approve' && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  此操作模拟业主签字确认。确认后，变更单将生效，并自动生成【待费用确认】的费用记录。
                </p>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowActionModal(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={
                  showActionModal === 'approve' ? handleApprove : 
                  showActionModal === 'owner_approve' ? handleOwnerApprove :
                  handleReject
                }
                className={cn(
                  'flex-1 py-2 rounded-lg text-white transition-colors',
                  showActionModal === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                )}
              >
                确认{showActionModal === 'approve' ? '通过' : showActionModal === 'reject' ? '驳回' : '生效'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isResubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsResubmitting(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认重新提交</h3>
            <p className="text-sm text-gray-600 mb-4">
              系统将自动升级版本号（v{order.version} → v{order.version + 1}），并重新提交给项目管家审核。
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">更新说明（可选）</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请说明修改内容..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsResubmitting(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleResubmit}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
