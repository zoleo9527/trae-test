import { useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, User, Paperclip, MessageSquare } from 'lucide-react';
import { useProcessStore } from '@/store/process.store';
import { useAppStore } from '@/store/app.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import type { ResponsibleParty, AppealStatus } from '@/types';
import { updateAppealStatus } from '@/services/appeal.service';
import { determineResponsibility, getPartyLabel, getPartyColor } from '@/utils/responsibility';
import { cn } from '@/lib/utils';

const responsibilityOptions: { value: ResponsibleParty; label: string; color: string }[] = [
  { value: 'rider', label: '骑手责任', color: 'bg-accent-red' },
  { value: 'merchant', label: '商家责任', color: 'bg-accent-amber' },
  { value: 'platform', label: '平台责任', color: 'bg-accent-blue' },
  { value: 'user', label: '用户责任', color: 'bg-accent-green' },
  { value: 'unclear', label: '待判定', color: 'bg-gray-400' },
];

export function AppealPanel() {
  const { order, appeals, selectedResponsibility, setSelectedResponsibility, setAppealDecision, markStepComplete, goToNextStep } = useProcessStore();
  const { currentUser, userRole, refreshPendingCounts } = useAppStore();
  const [resolution, setResolution] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const appeal = appeals[0];
  const suggestedResponsibility = order ? determineResponsibility(order, appeal) : null;

  if (!appeal || !order) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-500 text-center py-8">暂无申诉记录</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: AppealStatus) => {
    switch (status) {
      case 'resolved': return 'success';
      case 'rejected': return 'danger';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: AppealStatus) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'processing': return '处理中';
      case 'resolved': return '已解决';
      case 'rejected': return '已驳回';
      default: return status;
    }
  };

  const getAppealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      timeout: '配送超时',
      refund: '用户退款',
      settlement_error: '结算错误',
      complaint: '用户投诉',
      other: '其他',
    };
    return labels[type] || type;
  };

  const handleResolve = async () => {
    if (!selectedResponsibility) {
      alert('请先选择责任方');
      return;
    }
    if (!resolution.trim()) {
      alert('请填写处理结论');
      return;
    }

    setIsProcessing(true);
    try {
      const updatedAppeal = updateAppealStatus(appeal.id, 'resolved', {
        handlerRole: userRole!,
        handlerName: currentUser!.name,
        resolution,
        responsibleParty: selectedResponsibility,
      });

      if (updatedAppeal) {
        setAppealDecision(updatedAppeal);
        markStepComplete('appeal');
        refreshPendingCounts();
        goToNextStep();
      }
    } catch (error) {
      alert('处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const isResolved = appeal.status === 'resolved' || appeal.status === 'rejected';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">申诉信息</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  申诉单号：{appeal.id}
                </p>
              </div>
            </div>
            <StatusBadge
              status={appeal.status}
              label={getStatusLabel(appeal.status)}
              variant={getStatusVariant(appeal.status)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500">申诉类型</label>
              <div className="flex items-center gap-2 mt-1">
                <Tag variant="warning">{getAppealTypeLabel(appeal.type)}</Tag>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">提交时间</label>
              <p className="text-sm text-gray-900 mt-1 font-mono">
                {formatDateTime(appeal.createdAt)}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">申诉原因</label>
            <p className="text-sm text-gray-900 mt-1 font-medium">{appeal.reason}</p>
          </div>

          <div>
            <label className="text-xs text-gray-500">详细描述</label>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed bg-gray-50 p-3 rounded-md">
              {appeal.description}
            </p>
          </div>

          {appeal.evidenceUrls.length > 0 && (
            <div>
              <label className="text-xs text-gray-500 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> 凭证附件
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {appeal.evidenceUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 rounded transition-colors"
                  >
                    查看截图 {idx + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {appeal.handlerName && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>处理人：{appeal.handlerName}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isResolved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">责任判定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedResponsibility && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">系统分析建议</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  建议责任方：
                  <span className={cn('font-medium ml-1', getPartyColor(suggestedResponsibility.party))}>
                    {getPartyLabel(suggestedResponsibility.party)}
                  </span>
                  <span className="ml-2 text-blue-500">
                    （置信度 {suggestedResponsibility.confidence}%）
                  </span>
                </p>
                <ul className="text-sm text-blue-600 space-y-1">
                  {suggestedResponsibility.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">选择责任方</label>
              <div className="flex flex-wrap gap-2">
                {responsibilityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedResponsibility(option.value)}
                    className={cn(
                      'px-4 py-2 rounded-md border-2 text-sm font-medium transition-all',
                      selectedResponsibility === option.value
                        ? `${option.color} border-transparent text-white`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">处理结论</label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="请详细描述处理结论，包括对用户的补偿方案、对责任方的处理措施等..."
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost">暂存</Button>
              <Button
                onClick={handleResolve}
                loading={isProcessing}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                确认处理并进入下一步
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isResolved && appeal.resolution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent-green" />
              处理结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">最终责任方：</span>
              <span className={cn('font-medium', getPartyColor(appeal.responsibleParty!))}>
                {getPartyLabel(appeal.responsibleParty!)}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">处理结论：</span>
              <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">
                {appeal.resolution}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>处理时间：{formatDateTime(appeal.resolvedAt!)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
