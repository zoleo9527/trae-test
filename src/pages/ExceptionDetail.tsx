import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Clock, User, Camera, Play, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Timeline } from '@/components/ui/Timeline';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { exceptionTypeLabels, exceptionStatusLabels, type ExceptionStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function ExceptionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, currentRole, getExceptionById, getLedgerById, updateExceptionStatus, addExceptionComment } = useStore();
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const exception = getExceptionById(id || '');

  if (!exception) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">异常记录不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/exceptions')}>
          返回列表
        </Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: ExceptionStatus) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'rejected':
        return 'danger';
      default:
        return 'gray';
    }
  };

  const getTypeIconColor = () => {
    switch (exception.type) {
      case 'environment':
        return 'bg-green-100 text-green-600';
      case 'equipment':
        return 'bg-blue-100 text-blue-600';
      case 'quality':
        return 'bg-yellow-100 text-yellow-600';
      case 'safety':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const canStartProcess = (currentRole === 'owner') && exception.status === 'pending';
  const canResolve = (currentRole === 'owner' || (currentRole === 'weigher' && exception.reporterId === currentUser.id)) &&
    (exception.status === 'processing' || exception.status === 'pending');
  const canReject = (currentRole === 'owner') && (exception.status === 'pending' || exception.status === 'processing');

  const handleStartProcess = () => {
    updateExceptionStatus(exception.id, 'processing', currentUser.id, currentUser.name);
  };

  const handleResolve = () => {
    updateExceptionStatus(exception.id, 'resolved', currentUser.id, currentUser.name);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    updateExceptionStatus(exception.id, 'rejected', currentUser.id, currentUser.name, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addExceptionComment(exception.id, {
      userId: currentUser.id,
      userName: currentUser.name,
      content: comment,
      createdAt: new Date().toISOString(),
    });
    setComment('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/exceptions')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{exception.exceptionNo}</h1>
          <p className="text-gray-500 mt-1">创建于 {format(new Date(exception.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="gray">{exceptionTypeLabels[exception.type]}</Badge>
          <Badge variant={getStatusBadgeVariant(exception.status)} className="text-sm px-3 py-1">
            {exceptionStatusLabels[exception.status]}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          详细信息
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          操作日志
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>异常信息</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{exception.title}</h3>
                  <p className="text-gray-600 mt-2 leading-relaxed">{exception.description}</p>
                </div>
                {exception.relatedLedgerId && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">关联台账</p>
                    {(() => {
                      const relatedLedger = getLedgerById(exception.relatedLedgerId);
                      return (
                        <button
                          onClick={() => navigate(`/ledger/${exception.relatedLedgerId}`)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {relatedLedger?.recordNo || exception.relatedLedgerId}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </Card.Content>
            </Card>

            {exception.photos.length > 0 && (
              <Card>
                <Card.Header>
                  <Card.Title>
                    <Camera className="w-5 h-5 inline mr-2" />
                    现场照片 ({exception.photos.length})
                  </Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {exception.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`现场照片 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )}

            <Card>
              <Card.Header>
                <Card.Title>
                  <MessageSquare className="w-5 h-5 inline mr-2" />
                  沟通记录 ({exception.comments.length})
                </Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="flex gap-3">
                  <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="添加评论..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" onClick={handleAddComment} disabled={!comment.trim()}>
                        发送
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 mt-4">
                  {exception.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{c.userName}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(c.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {exception.comments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">暂无沟通记录</p>
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>责任归属</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">上报人</p>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', getTypeIconColor())}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{exception.reporterName}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(exception.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">处理人</p>
                  {exception.handlerName ? (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{exception.handlerName}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">待指派处理人</p>
                  )}
                </div>
              </Card.Content>
              {(canStartProcess || canResolve || canReject) && (
                <Card.Footer className="space-y-2">
                  {canStartProcess && (
                    <Button className="w-full" onClick={handleStartProcess}>
                      <Play className="w-4 h-4 mr-2" />
                      开始处理
                    </Button>
                  )}
                  {canResolve && (
                    <Button className="w-full" variant="secondary" onClick={handleResolve}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      标记已解决
                    </Button>
                  )}
                  {canReject && (
                    <Button className="w-full" variant="outline" onClick={() => setShowRejectModal(true)}>
                      <XCircle className="w-4 h-4 mr-2" />
                      驳回
                    </Button>
                  )}
                </Card.Footer>
              )}
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>处理进度</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                {[
                  { key: 'pending', label: '已上报', time: exception.createdAt, done: true },
                  { key: 'processing', label: '处理中', time: exception.processingAt, done: exception.status === 'processing' || exception.status === 'resolved' || exception.status === 'rejected' || exception.status === 'closed' },
                  { key: 'resolved', label: '已解决', time: exception.resolvedAt, done: exception.status === 'resolved' },
                  { key: 'rejected', label: '已驳回', time: exception.resolvedAt, done: exception.status === 'rejected' },
                ].map((step, index, arr) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="relative">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        step.done ? 'bg-green-100' : exception.status === step.key ? 'bg-blue-100' : 'bg-gray-100'
                      )}>
                        {step.done ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                        )}
                      </div>
                      {index < arr.length - 1 && (
                        <div className={cn(
                          'absolute left-1/2 top-8 w-0.5 h-6 -translate-x-1/2',
                          step.done ? 'bg-green-200' : 'bg-gray-200'
                        )} />
                      )}
                    </div>
                    <div>
                      <p className={cn('font-medium', step.done ? 'text-gray-900' : 'text-gray-500')}>
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(step.time), 'MM-dd HH:mm', { locale: zhCN })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Content>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>操作日志</Card.Title>
          </Card.Header>
          <Card.Content>
            <Timeline items={exception.operationLogs} />
          </Card.Content>
        </Card>
      )}

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="驳回异常" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">驳回原因</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="请输入驳回原因..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>
              取消
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleReject} disabled={!rejectReason.trim()}>
              <X className="w-4 h-4 mr-2" />
              确认驳回
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
