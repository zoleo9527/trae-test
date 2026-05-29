import { useState } from 'react';
import { Coins, CheckCircle, XCircle, Calculator, User } from 'lucide-react';
import { useProcessStore } from '@/store/process.store';
import { useAppStore } from '@/store/app.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import type { SubsidyStatus } from '@/types';
import { createSubsidy, updateSubsidyStatus, calculateAmount } from '@/services/subsidy.service';
import { calculateSubsidyAmount } from '@/mock/subsidies';
import { getPartyLabel, getPartyColor } from '@/utils/responsibility';
import { cn } from '@/lib/utils';

const subsidyReasons = [
  '商家出餐慢导致超时',
  '路况拥堵导致配送延误',
  '天气恶劣影响配送',
  '用户地址难找',
  '其他特殊情况',
];

export function SubsidyPanel() {
  const { order, subsidies, selectedResponsibility, setSubsidyDecision, markStepComplete, goToNextStep } = useProcessStore();
  const { currentUser, userRole, refreshPendingCounts } = useAppStore();
  const [selectedReason, setSelectedReason] = useState('');
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const subsidy = subsidies[0];

  if (!order) {
    return (
      <Card>
        <CardContent>
          <p className="text-gray-500 text-center py-8">请先选择订单</p>
        </CardContent>
      </Card>
    );
  }

  const suggestedAmount = selectedReason ? calculateSubsidyAmount(order.id, selectedReason) : 0;
  const finalAmount = customAmount ?? suggestedAmount;

  const shouldOfferSubsidy = selectedResponsibility === 'merchant' || selectedResponsibility === 'platform';

  const getStatusVariant = (status: SubsidyStatus) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: SubsidyStatus) => {
    switch (status) {
      case 'pending': return '待审核';
      case 'approved': return '已通过';
      case 'rejected': return '已驳回';
      default: return status;
    }
  };

  const handleApprove = async () => {
    if (!selectedReason) {
      alert('请选择补贴原因');
      return;
    }
    if (finalAmount <= 0) {
      alert('补贴金额必须大于0');
      return;
    }

    setIsProcessing(true);
    try {
      let subsidyRecord = subsidy;
      if (!subsidyRecord) {
        subsidyRecord = createSubsidy({
          orderId: order.id,
          riderName: order.riderName,
          type: selectedReason,
          reason: selectedReason,
          notes: '',
          amount: finalAmount,
        });
      }

      const updated = updateSubsidyStatus(subsidyRecord.id, 'approved', currentUser!.name);
      if (updated) {
        setSubsidyDecision(updated);
        markStepComplete('subsidy');
        refreshPendingCounts();
        goToNextStep();
      }
    } catch (error) {
      alert('处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!subsidy) return;

    setIsProcessing(true);
    try {
      const updated = updateSubsidyStatus(subsidy.id, 'rejected', currentUser!.name);
      if (updated) {
        setSubsidyDecision(updated);
        markStepComplete('subsidy');
        refreshPendingCounts();
        goToNextStep();
      }
    } catch (error) {
      alert('处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const isProcessed = subsidy && (subsidy.status === 'approved' || subsidy.status === 'rejected');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">补贴处理</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  订单：{order.id}
                </p>
              </div>
            </div>
            {subsidy && (
              <StatusBadge
                status={subsidy.status}
                label={getStatusLabel(subsidy.status)}
                variant={getStatusVariant(subsidy.status)}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">骑手：</span>
                <span className="font-medium text-gray-900">{order.riderName}</span>
              </div>
              <div>
                <span className="text-gray-500">责任方：</span>
                <span className={cn('font-medium', selectedResponsibility ? getPartyColor(selectedResponsibility) : 'text-gray-500')}>
                  {selectedResponsibility ? getPartyLabel(selectedResponsibility) : '待判定'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">订单金额：</span>
                <span className="font-medium text-gray-900">¥{order.amount}</span>
              </div>
              <div>
                <span className="text-gray-500">配送时长：</span>
                <span className="font-mono text-gray-900">
                  {Math.round((new Date(order.deliveredTime).getTime() - new Date(order.createdAt).getTime()) / 60000)} 分钟
                </span>
              </div>
            </div>
          </div>

          {shouldOfferSubsidy && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">补贴建议</span>
              </div>
              <p className="text-sm text-amber-700">
                责任方为{getPartyLabel(selectedResponsibility!)}，建议给予骑手补贴补偿等待/配送时间。
              </p>
            </div>
          )}

          {!shouldOfferSubsidy && selectedResponsibility === 'rider' && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                责任方为骑手，不建议给予补贴。如确有特殊情况，可手动添加。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {subsidy && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">已有补贴记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">补贴原因：</span>
              <p className="text-sm text-gray-900 mt-1">{subsidy.reason}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">补贴金额：</span>
              <span className="text-lg font-bold text-accent-green">¥{subsidy.amount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>申请人：系统自动生成</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isProcessed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{subsidy ? '审核补贴' : '发起补贴'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">选择补贴原因</label>
              <div className="flex flex-wrap gap-2">
                {subsidyReasons.map(reason => (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      'px-3 py-1.5 rounded-md border text-sm transition-all',
                      selectedReason === reason
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  系统建议金额
                </label>
                <div className="text-2xl font-bold text-accent-green">
                  ¥{suggestedAmount}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  根据补贴规则自动计算
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  实际补贴金额
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">¥</span>
                  <input
                    type="number"
                    value={customAmount ?? suggestedAmount}
                    onChange={e => setCustomAmount(Number(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-200 rounded text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  可手动调整金额
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={handleReject} disabled={!subsidy}>
                <XCircle className="w-4 h-4 mr-2" />
                驳回
              </Button>
              <Button
                onClick={handleApprove}
                loading={isProcessing}
                disabled={!selectedReason || finalAmount <= 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {subsidy ? '审核通过并下一步' : '确认补贴并下一步'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessed && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent-green" />
              处理结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">状态：</span>
              <StatusBadge
                status={subsidy!.status}
                label={getStatusLabel(subsidy!.status)}
                variant={getStatusVariant(subsidy!.status)}
              />
            </div>
            <div>
              <span className="text-sm text-gray-600">补贴金额：</span>
              <span className="text-lg font-bold text-accent-green">¥{subsidy!.amount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>处理人：{subsidy!.approvedBy}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
