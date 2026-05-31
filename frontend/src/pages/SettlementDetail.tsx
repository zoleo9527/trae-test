import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Scale,
  User,
  Clock,
  Gavel,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { useWorkflow } from '@/hooks/useWorkflow';
import { mockUsers } from '@/data/mock';
import { Modal, ModalFooter } from '@/components/shared/Modal';

export function SettlementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const { canRuleDispute } = useRole();
  const { ruleDispute } = useWorkflow();

  const [showRulingModal, setShowRulingModal] = useState(false);
  const [ruling, setRuling] = useState('');
  const [resolution, setResolution] = useState('');

  const dispute = state.disputes.find((d) => d.id === id);
  const project = state.projects.find((p) => p.id === dispute?.projectId);

  if (!dispute) {
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
          <Scale className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">争议单不存在</p>
        </div>
      </div>
    );
  }

  const getUserName = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    return user?.name || userId;
  };

  const handleRuling = () => {
    if (ruling.trim() && resolution.trim()) {
      ruleDispute(dispute, ruling, resolution);
      setShowRulingModal(false);
      setRuling('');
      setResolution('');
    }
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
            <h1 className="text-xl font-semibold text-gray-800">{dispute.code}</h1>
            <p className="text-sm text-gray-500">{dispute.title}</p>
          </div>
        </div>
        <StatusBadge status={dispute.status} type="dispute" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">争议基本信息</span>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">所属项目</label>
                  <p className="text-sm text-gray-800 mt-1">{project?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">争议类型</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {dispute.type === 'material'
                      ? '材料争议'
                      : dispute.type === 'labor'
                        ? '人工争议'
                        : dispute.type === 'rework'
                          ? '返工争议'
                          : '其他争议'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">争议金额</label>
                  <p className="text-lg font-semibold text-danger-600 mt-1">
                    ¥{dispute.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">创建时间</label>
                  <p className="text-sm text-gray-800 mt-1">
                    {new Date(dispute.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-500" />
              <span className="font-medium text-gray-800">争议描述</span>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-700">{dispute.description}</p>
            </div>
          </div>

          {dispute.negotiationRecords && dispute.negotiationRecords.length > 0 && (
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-gray-800">协商记录</span>
              </div>
              <div className="card-body space-y-4">
                {dispute.negotiationRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {record.author}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(record.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{record.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dispute.ruling && (
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Gavel className="w-4 h-4 text-warning-500" />
                <span className="font-medium text-gray-800">裁定结果</span>
              </div>
              <div className="card-body space-y-4">
                <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      裁定人：{dispute.ruledBy ? getUserName(dispute.ruledBy) : '-'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {dispute.ruledAt
                        ? new Date(dispute.ruledAt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{dispute.ruling}</p>
                </div>
                {dispute.resolution && (
                  <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                    <span className="text-sm font-medium text-gray-800 block mb-1">
                      处理方案
                    </span>
                    <p className="text-sm text-gray-700">{dispute.resolution}</p>
                  </div>
                )}
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
              {dispute.status === 'pending' && canRuleDispute && (
                <button
                  onClick={() => setShowRulingModal(true)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Gavel className="w-4 h-4" />
                  进行裁定
                </button>
              )}
              {dispute.status === 'ruled' && (
                <div className="text-center py-4">
                  <p className="text-sm text-success-600">已完成裁定</p>
                </div>
              )}
              {dispute.status === 'resolved' && (
                <div className="text-center py-4">
                  <p className="text-sm text-success-600">争议已解决</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="font-medium text-gray-800">争议双方</span>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {getUserName(dispute.applicant)}
                  </p>
                  <p className="text-xs text-gray-500">申请人</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {getUserName(dispute.respondent)}
                  </p>
                  <p className="text-xs text-gray-500">被申请人</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showRulingModal}
        onClose={() => setShowRulingModal(false)}
        title="争议裁定"
        size="lg"
      >
        <div className="space-y-5">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-800">
                {dispute.title}
              </span>
              <span className="text-sm font-semibold text-danger-600">
                ¥{dispute.amount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500">{dispute.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              裁定意见
            </label>
            <textarea
              value={ruling}
              onChange={(e) => setRuling(e.target.value)}
              placeholder="请详细说明裁定意见..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              处理方案
            </label>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="请说明具体的处理方案和结算方式..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <p className="text-sm text-primary-800">
              <strong>重要提示：</strong>
              裁定结果将直接影响双方结算金额，请务必审慎裁定。裁定后将自动流转至财务结算环节。
            </p>
          </div>
        </div>
        <ModalFooter>
          <button
            onClick={() => setShowRulingModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleRuling}
            disabled={!ruling.trim() || !resolution.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认裁定
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
