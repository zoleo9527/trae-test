import React, { useState } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { mockUsers } from '@/data/mock';
import { useRole } from '@/hooks/useRole';
import { useApp } from '@/store/AppContext';
import { useWorkflow } from '@/hooks/useWorkflow';
import {
  DifferenceTypeLabels,
  ResponsibilityLabels,
  type Responsibility,
  type DifferenceType,
} from '@/types';
import {
  AlertTriangle,
  ArrowLeft,
  FileCheck,
  MapPin,
  Check,
  FileEdit,
  Gavel,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { SignReceiptModal } from '@/components/modals/SignReceiptModal';
import { DifferenceModal } from '@/components/modals/DifferenceModal';
import { JudgmentModal } from '@/components/modals/JudgmentModal';

export function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const { canSignReceipt, canVerifyReceipt, canJudgeResponsibility, canRecordDifference } =
    useRole();
  const { signReceipt, recordDifference, verifyReceipt, judgeResponsibility } =
    useWorkflow();

  const [showSignModal, setShowSignModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showJudgeModal, setShowJudgeModal] = useState(false);
  const [selectedDifference, setSelectedDifference] = useState<any>(null);

  const receipt = state.receipts.find((r) => r.id === id);
  const shipping = state.shippingOrders.find((s) => s.id === receipt?.shippingId);
  const project = state.projects.find((p) => p.id === receipt?.projectId);

  if (!receipt || !shipping) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="text-center py-12">
          <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">回单不存在</p>
        </div>
      </div>
    );
  }

  const getUserName = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    return user?.name || userId;
  };

  const handleSign = (location: string, quantities: Record<string, number>) => {
    signReceipt(receipt, location, quantities);
  };

  const handleRecordDiff = (data: {
    type: DifferenceType;
    materialId?: string;
    materialName?: string;
    description: string;
    quantity?: number;
    amount: number;
    responsibility: Responsibility;
  }) => {
    recordDifference(receipt, data);
  };

  const handleVerify = () => {
    verifyReceipt(receipt);
  };

  const handleJudge = (responsibility: Responsibility, resolution: string) => {
    if (selectedDifference) {
      judgeResponsibility(receipt, selectedDifference.id, responsibility, resolution);
      setSelectedDifference(null);
    }
  };

  const openJudgeModal = (diff: any) => {
    setSelectedDifference(diff);
    setShowJudgeModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">回单详情</h1>
            <p className="text-sm text-gray-500">
              {shipping.code} · {shipping.title}
            </p>
          </div>
        </div>
        <StatusBadge status={receipt.status} type="receipt" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">签收信息</span>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">所属项目</label>
                  <p className="text-sm text-gray-800 mt-1">{project?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">签收状态</label>
                  <div className="mt-1">
                    <StatusBadge status={receipt.status} type="receipt" />
                  </div>
                </div>
                {receipt.signedAt && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">签收时间</label>
                      <p className="text-sm text-gray-800 mt-1">
                        {new Date(receipt.signedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">签收人</label>
                      <p className="text-sm text-gray-800 mt-1">
                        {getUserName(receipt.signedBy!)}
                      </p>
                    </div>
                  </>
                )}
                {receipt.signedLocation && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">签收地点</label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-800">{receipt.signedLocation}</p>
                    </div>
                  </div>
                )}
                {receipt.verifiedAt && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">核验时间</label>
                      <p className="text-sm text-gray-800 mt-1">
                        {new Date(receipt.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">核验人</label>
                      <p className="text-sm text-gray-800 mt-1">
                        {getUserName(receipt.verifiedBy!)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {receipt.remark && (
                <div>
                  <label className="text-xs text-gray-500">备注</label>
                  <p className="text-sm text-gray-700 mt-1">{receipt.remark}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span className="font-medium text-gray-800">材料签收明细</span>
              {receipt.differences.length > 0 && (
                <span className="flex items-center gap-1 text-sm text-danger-600">
                  <AlertTriangle className="w-4 h-4" />
                  {receipt.differences.length} 项差异
                </span>
              )}
            </div>
            <div className="card-body">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-xs font-medium text-gray-500">
                      材料名称
                    </th>
                    <th className="text-left py-3 text-xs font-medium text-gray-500">
                      规格
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      发货数量
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      实收数量
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      差异
                    </th>
                    <th className="text-right py-3 text-xs font-medium text-gray-500">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shipping.materialItems.map((item) => {
                    const diff = receipt.differences.find(
                      (d) => d.materialId === item.id
                    );
                    const hasDiff =
                      item.receivedQuantity !== undefined &&
                      item.receivedQuantity < item.quantity;
                    return (
                      <tr key={item.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 text-sm text-gray-800">{item.name}</td>
                        <td className="py-3 text-sm text-gray-600">{item.spec}</td>
                        <td className="py-3 text-sm text-right text-gray-800">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 text-sm text-right">
                          {item.receivedQuantity !== undefined ? (
                            <span
                              className={
                                hasDiff
                                  ? 'text-danger-600 font-medium'
                                  : 'text-success-600'
                              }
                            >
                              {item.receivedQuantity} {item.unit}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-right">
                          {item.receivedQuantity !== undefined &&
                          item.receivedQuantity !== item.quantity ? (
                            <span className="text-danger-600 font-medium">
                              {item.receivedQuantity - item.quantity > 0 ? '+' : ''}
                              {item.receivedQuantity - item.quantity} {item.unit}
                            </span>
                          ) : (
                            <span className="text-success-600">-</span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-right">
                          {diff ? (
                            <span className="text-danger-600">有差异</span>
                          ) : item.receivedQuantity !== undefined ? (
                            <span className="text-success-600">正常</span>
                          ) : (
                            <span className="text-gray-400">待签收</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {receipt.differences.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="font-medium text-gray-800">差异记录</span>
              </div>
              <div className="card-body space-y-4">
                {receipt.differences.map((diff) => (
                  <div
                    key={diff.id}
                    className={`p-4 rounded-lg border ${
                      diff.resolved
                        ? 'bg-success-50 border-success-200'
                        : 'bg-danger-50 border-danger-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            diff.resolved ? 'text-success-600' : 'text-danger-600'
                          }`}
                        />
                        <span className="font-medium text-gray-800">
                          {diff.materialName}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          diff.resolved ? 'text-success-600' : 'text-danger-600'
                        }`}
                      >
                        ¥{diff.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <label className="text-xs text-gray-500">差异类型</label>
                        <p className="text-sm text-gray-800 mt-1">
                          {DifferenceTypeLabels[diff.type]}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">责任方判定</label>
                        <p className="text-sm text-gray-800 mt-1">
                          {ResponsibilityLabels[diff.responsibility]}
                        </p>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-xs text-gray-500">差异描述</label>
                      <p className="text-sm text-gray-700 mt-1">{diff.description}</p>
                    </div>
                    {diff.resolution && (
                      <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                        <label className="text-xs text-gray-500">处理方案</label>
                        <p className="text-sm text-gray-700 mt-1">{diff.resolution}</p>
                      </div>
                    )}
                    {diff.evidenceUrls && diff.evidenceUrls.length > 0 && (
                      <div>
                        <label className="text-xs text-gray-500">凭证照片</label>
                        <div className="flex gap-2 mt-2">
                          {diff.evidenceUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`凭证${idx + 1}`}
                              className="w-20 h-20 object-cover rounded border border-gray-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        由 {getUserName(diff.reportedBy)} 于{' '}
                        {new Date(diff.reportedAt).toLocaleString()} 上报
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            diff.resolved
                              ? 'bg-success-100 text-success-700'
                              : 'bg-warning-100 text-warning-700'
                          }`}
                        >
                          {diff.resolved ? '已解决' : '待处理'}
                        </span>
                        {!diff.resolved && canJudgeResponsibility && (
                          <button
                            onClick={() => openJudgeModal(diff)}
                            className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
                          >
                            判定责任
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">操作</span>
            </div>
            <div className="card-body space-y-3">
              {receipt.status === 'pending' && canSignReceipt && (
                <>
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    确认签收
                  </button>
                  {canRecordDifference && (
                    <button
                      onClick={() => setShowDiffModal(true)}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <FileEdit className="w-4 h-4" />
                      记录差异
                    </button>
                  )}
                </>
              )}
              {(receipt.status === 'signed' || receipt.status === 'has_difference') &&
                canVerifyReceipt && (
                  <>
                    <button
                      onClick={handleVerify}
                      className="w-full btn-success flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      核验通过
                    </button>
                  </>
                )}
              {receipt.status === 'has_difference' && canJudgeResponsibility && (
                <button
                  onClick={() =>
                    openJudgeModal(
                      receipt.differences.find((d) => !d.resolved) ||
                        receipt.differences[0]
                    )
                  }
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Gavel className="w-4 h-4" />
                  判定责任并结案
                </button>
              )}
              <button
                className="w-full btn-secondary"
                onClick={() => navigate(`/shipping/${shipping.id}`)}
              >
                查看发货单
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">处理时间线</span>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5"></div>
                  <div>
                    <p className="text-sm text-gray-800">发货单创建</p>
                    <p className="text-xs text-gray-500">
                      {new Date(shipping.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {shipping.shippedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm text-gray-800">材料发出</p>
                      <p className="text-xs text-gray-500">
                        {new Date(shipping.shippedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {receipt.signedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-success-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm text-gray-800">现场签收</p>
                      <p className="text-xs text-gray-500">
                        {getUserName(receipt.signedBy!)} ·{' '}
                        {new Date(receipt.signedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {receipt.differences.length > 0 &&
                  receipt.differences.map((diff) => (
                    <div key={diff.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-danger-500 mt-1.5"></div>
                      <div>
                        <p className="text-sm text-gray-800">记录差异</p>
                        <p className="text-xs text-gray-500">
                          {getUserName(diff.reportedBy)} ·{' '}
                          {new Date(diff.reportedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                {receipt.verifiedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-success-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm text-gray-800">回单核验完成</p>
                      <p className="text-xs text-gray-500">
                        {getUserName(receipt.verifiedBy!)} ·{' '}
                        {new Date(receipt.verifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignReceiptModal
        isOpen={showSignModal}
        onClose={() => setShowSignModal(false)}
        receipt={receipt}
        shipping={shipping}
        onConfirm={handleSign}
      />

      <DifferenceModal
        isOpen={showDiffModal}
        onClose={() => setShowDiffModal(false)}
        materialItems={shipping.materialItems}
        onConfirm={handleRecordDiff}
      />

      {selectedDifference && (
        <JudgmentModal
          isOpen={showJudgeModal}
          onClose={() => {
            setShowJudgeModal(false);
            setSelectedDifference(null);
          }}
          difference={selectedDifference}
          onConfirm={handleJudge}
        />
      )}
    </div>
  );
}
