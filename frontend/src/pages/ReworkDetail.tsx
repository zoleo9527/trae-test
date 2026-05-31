import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Check,
  Send,
  XCircle,
  Lock,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { useWorkflow } from '@/hooks/useWorkflow';
import { mockUsers } from '@/data/mock';
import { ResponsibilityLabels } from '@/types';
import { ReworkModal } from '@/components/modals/ReworkModal';
import type { ReworkOrder } from '@/types';

export function ReworkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const { canExecuteRework, canReviewRework } = useRole();
  const { startRework, submitReworkForReview, reviewRework, closeRework } =
    useWorkflow();

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<
    'start' | 'submit' | 'review' | 'close'
  >('start');

  const rework = state.reworkOrders.find((r) => r.id === id);
  const project = state.projects.find((p) => p.id === rework?.projectId);

  if (!rework) {
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
          <RefreshCw className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">返工单不存在</p>
        </div>
      </div>
    );
  }

  const getUserName = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    return user?.name || userId;
  };

  const handleStart = (data: { remark?: string }) => {
    startRework(rework, data.remark);
  };

  const handleSubmit = (data: { remark?: string }) => {
    submitReworkForReview(rework, data.remark);
  };

  const handleReview = (data: { remark?: string; passed?: boolean; actualCost?: number }) => {
    reviewRework(rework, data.passed ?? true, data.remark, data.actualCost);
  };

  const handleClose = (data: { remark?: string; actualCost?: number }) => {
    closeRework(rework, data.remark);
  };

  const handleModalConfirm = (data: any) => {
    switch (modalMode) {
      case 'start':
        handleStart(data);
        break;
      case 'submit':
        handleSubmit(data);
        break;
      case 'review':
        handleReview(data);
        break;
      case 'close':
        handleClose(data);
        break;
    }
  };

  const openModal = (mode: 'start' | 'submit' | 'review' | 'close') => {
    setModalMode(mode);
    setShowModal(true);
  };

  const canStart = rework.status === 'created' && canExecuteRework;
  const canSubmit = rework.status === 'in_progress' && canExecuteRework;
  const canReview = rework.status === 'submitted' && canReviewRework;
  const canClose = rework.status === 'passed' && canReviewRework;

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
            <h1 className="text-xl font-semibold text-gray-800">{rework.code}</h1>
            <p className="text-sm text-gray-500">{rework.title}</p>
          </div>
        </div>
        <StatusBadge status={rework.status} type="rework" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">基本信息</span>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">所属项目</label>
                  <p className="text-sm text-gray-800 mt-1">{project?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">创建时间</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {new Date(rework.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">责任方</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {ResponsibilityLabels[rework.responsibleParty]}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">创建人</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {getUserName(rework.createdBy)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">返工位置</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-800">{rework.location}</p>
                </div>
              </div>
              {rework.deadline && (
                <div>
                  <label className="text-xs text-gray-500">截止时间</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p
                      className={`text-sm ${
                        new Date(rework.deadline) < new Date()
                          ? 'text-danger-600 font-medium'
                          : 'text-gray-800'
                      }`}
                    >
                      {new Date(rework.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-500" />
              <span className="font-medium text-gray-800">返工原因</span>
            </div>
            <div className="card-body space-y-3">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-warning-100 text-warning-700 text-xs">
                {rework.reasonCategory}
              </div>
              <p className="text-sm text-gray-700">{rework.reason}</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <span className="font-medium text-gray-800">处理步骤</span>
              <span className="text-xs text-gray-500">
                {rework.steps.length} 个步骤
              </span>
            </div>
            <div className="card-body">
              <div className="space-y-0">
                {rework.steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-success-500"></div>
                      {index < rework.steps.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 my-1"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {step.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {step.operatorName}
                      </p>
                      {step.remark && (
                        <p className="text-sm text-gray-600 mt-2">{step.remark}</p>
                      )}
                      {step.evidenceUrls && step.evidenceUrls.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {step.evidenceUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`凭证${idx + 1}`}
                              className="w-16 h-16 object-cover rounded border border-gray-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">操作</span>
            </div>
            <div className="card-body space-y-3">
              {canStart && (
                <button
                  onClick={() => openModal('start')}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  开始整改
                </button>
              )}
              {canSubmit && (
                <button
                  onClick={() => openModal('submit')}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  提交复查
                </button>
              )}
              {canReview && (
                <>
                  <button
                    onClick={() => openModal('review')}
                    className="w-full btn-success flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    复查
                  </button>
                </>
              )}
              {canClose && (
                <button
                  onClick={() => openModal('close')}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  闭环确认
                </button>
              )}
              {!canStart && !canSubmit && !canReview && !canClose && (
                <p className="text-sm text-gray-500 text-center py-4">
                  无可用操作
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">费用信息</span>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">预估费用</span>
                <span className="text-sm font-medium text-gray-800">
                  ¥{rework.estimatedCost?.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">实际费用</span>
                <span
                  className={`text-sm font-medium ${
                    rework.actualCost ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {rework.actualCost
                    ? `¥${rework.actualCost.toLocaleString()}`
                    : '待确认'}
                </span>
              </div>
              {rework.actualCost && rework.estimatedCost && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">偏差</span>
                    <span
                      className={`text-xs font-medium ${
                        rework.actualCost > rework.estimatedCost
                          ? 'text-danger-600'
                          : 'text-success-600'
                      }`}
                    >
                      {rework.actualCost > rework.estimatedCost ? '+' : ''}
                      {((
                        ((rework.actualCost - rework.estimatedCost) /
                          rework.estimatedCost) *
                        100
                      ).toFixed(1))}
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {rework.assignee && (
            <div className="card">
              <div className="card-header">
                <span className="font-medium text-gray-800">负责人</span>
              </div>
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {getUserName(rework.assignee)}
                    </p>
                    <p className="text-xs text-gray-500">施工班组</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReworkModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        rework={rework}
        mode={modalMode}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}
