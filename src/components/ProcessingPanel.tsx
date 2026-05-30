import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, MapPin, Clock, AlertTriangle, CheckCircle, RotateCcw,
  Send, Package, User, FileText, Store, Upload, Check, XCircle
} from 'lucide-react';
import { useProcessingStore } from '@/store/useProcessingStore';
import { useOrderStore } from '@/store/useOrderStore';
import { useRoleStore } from '@/store/useRoleStore';
import { useBatchStore } from '@/store/useBatchStore';
import {
  STATUS_LABELS, ROLE_LABELS, DAMAGE_POSITIONS, REWASH_REASONS, WASH_TYPES, REJECT_SOURCE_LABELS,
  type Order, type DamageRecord, type RewashRecord
} from '@/types';
import { mockDamageRecords, mockRewashRecords } from '@/data/mockData';
import { cn } from '@/lib/utils';

const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MODE_LABELS: Record<string, string> = {
  sort: '分拣指派',
  inspect: '质检处理',
  damage: '污损赔付处理',
  rewash: '返洗处理',
  handover: '门店交接',
  verify: '回单核验',
  rejected_review: '门店退回审核',
  rejected_damage_review: '污损赔付审核',
  rejected_store_resubmit: '门店重新交接',
};

export default function ProcessingPanel() {
  const { orderId, isOpen, mode, closeProcessing, openProcessing } = useProcessingStore();
  const { orders, setOrders, damageRecords, rewashRecords, receipts, addDamageRecord, addRewashRecord, updateReceipt, updateRewashStatus } = useOrderStore();
  const { batches, addOrderToBatch } = useBatchStore();
  const { currentRole } = useRoleStore();
  const [activeTab, setActiveTab] = useState<'main' | 'history' | 'evidence'>('main');
  const [damagePosition, setDamagePosition] = useState('');
  const [damageDesc, setDamageDesc] = useState('');
  const [rewashReason, setRewashReason] = useState('');
  const [rewashDesc, setRewashDesc] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [verifyPassed, setVerifyPassed] = useState<boolean | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [inspectSubMode, setInspectSubMode] = useState<'pass' | 'rewash' | 'damage' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const order = orders.find((o) => o.id === orderId);
  const orderDamageRecords = damageRecords.filter((d) => d.orderId === orderId);
  const orderRewashRecords = rewashRecords.filter((r) => r.orderId === orderId);
  const orderReceipt = receipts.find((r) => r.orderId === orderId);
  const batch = order?.batchId ? batches.find((b) => b.id === order.batchId) : null;

  const resetFormState = () => {
    setInspectSubMode(null);
    setDamagePosition('');
    setDamageDesc('');
    setRewashReason('');
    setRewashDesc('');
    setSelectedBatch('');
    setVerifyPassed(null);
    setRejectReason('');
    setUploadedImages([]);
  };

  const handleClose = () => {
    resetFormState();
    closeProcessing();
  };

  if (!order) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(() =>
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laundry+garment+inspection+photo+close+up+high+quality&image_size=square`
      );
      setUploadedImages([...uploadedImages, ...newImages]);
    }
  };

  const handleSort = () => {
    if (!selectedBatch) return;
    addOrderToBatch(selectedBatch, orderId!);
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'washing' as const, batchId: selectedBatch, updatedAt: new Date().toISOString(), assignedTo: 'inspector' as const }
        : o
    );
    setOrders(updatedOrders);
    handleClose();
  };

  const handleInspectPass = () => {
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'handover' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
        : o
    );
    setOrders(updatedOrders);
    closeProcessing();
  };

  const handleMarkDamage = () => {
    if (!damagePosition || !damageDesc) return;
    addDamageRecord({
      orderId: orderId!,
      position: damagePosition,
      description: damageDesc,
      imageUrl: uploadedImages[0] || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=laundry+garment+damage+inspection+photo&image_size=square',
      recordedBy: `质检员-${currentRole === 'inspector' ? '当前' : '系统'}`,
    });
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'damage_claim' as const, updatedAt: new Date().toISOString(), assignedTo: 'factory_manager' as const }
        : o
    );
    setOrders(updatedOrders);
    handleClose();
  };

  const handleDamageRejectToFactory = () => {
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'rejected' as const, updatedAt: new Date().toISOString(), assignedTo: 'factory_manager' as const, rejectSource: 'damage_claim' as const }
        : o
    );
    setOrders(updatedOrders);
    handleClose();
  };

  const handleMarkRewash = () => {
    if (!rewashReason || !rewashDesc) return;
    addRewashRecord({
      orderId: orderId!,
      reason: rewashReason,
      description: rewashDesc,
      status: 'rewashing',
    });
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'rewashing' as const, updatedAt: new Date().toISOString(), assignedTo: 'inspector' as const }
        : o
    );
    setOrders(updatedOrders);
    handleClose();
  };

  const handleHandover = () => {
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'verifying' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
        : o
    );
    setOrders(updatedOrders);
    closeProcessing();
  };

  const handleVerify = (passed: boolean) => {
    setVerifyPassed(passed);
    if (passed) {
      updateReceipt(orderId!, {
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        verifiedBy: `门店-${currentRole === 'store_handler' ? '当前' : '系统'}`,
        isRejected: false,
        rejectReason: null,
      });
      const updatedOrders = orders.map((o) =>
        o.id === orderId
          ? { ...o, status: 'completed' as const, updatedAt: new Date().toISOString() }
          : o
      );
      setOrders(updatedOrders);
      setTimeout(() => handleClose(), 1500);
    }
  };

  const handleReject = () => {
    if (!rejectReason) return;
    const now = new Date().toISOString();
    const operatorLabel = `门店-${currentRole === 'store_handler' ? '当前' : '系统'}`;
    updateReceipt(orderId!, {
      isVerified: false,
      verifiedAt: now,
      verifiedBy: operatorLabel,
      isRejected: true,
      rejectReason: rejectReason,
    });
    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? { ...o, status: 'rejected' as const, updatedAt: now, assignedTo: 'factory_manager' as const, rejectSource: 'store_receipt' as const }
        : o
    );
    setOrders(updatedOrders);
    handleClose();
  };

  const renderMainContent = () => {
    if ((mode === 'rejected_review' || mode === 'rejected_damage_review') && currentRole !== 'factory_manager') {
      return (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-medium text-slate-700">无处理权限</h3>
            <p className="text-sm text-slate-500 mt-1">该订单为{order?.rejectSource ? REJECT_SOURCE_LABELS[order.rejectSource] : '退回'}，需厂长审核</p>
            <p className="text-xs text-slate-400 mt-2">当前责任人：{order?.assignedTo ? ROLE_LABELS[order.assignedTo] : '未指派'}</p>
          </div>
        </div>
      );
    }
    if (mode === 'sort' && currentRole !== 'factory_manager') {
      return (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-medium text-slate-700">无处理权限</h3>
            <p className="text-sm text-slate-500 mt-1">分拣指派需厂长操作</p>
          </div>
        </div>
      );
    }
    if (mode === 'inspect' && currentRole !== 'inspector') {
      return (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-medium text-slate-700">无处理权限</h3>
            <p className="text-sm text-slate-500 mt-1">质检处理需质检员操作</p>
          </div>
        </div>
      );
    }
    if ((mode === 'verify' || mode === 'handover' || mode === 'rejected_store_resubmit') && currentRole !== 'store_handler') {
      return (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="font-medium text-slate-700">无处理权限</h3>
            <p className="text-sm text-slate-500 mt-1">回单核验/交接需门店交接操作</p>
          </div>
        </div>
      );
    }
    switch (mode) {
      case 'sort':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">选择洗涤批次</label>
              <div className="space-y-2">
                {batches.filter((b) => b.status !== 'completed').map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBatch(b.id)}
                    className={cn(
                      'w-full p-4 rounded-lg border text-left transition-all',
                      selectedBatch === b.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{b.batchNo}</p>
                        <p className="text-sm text-slate-500">{b.washType} · {b.orderIds.length} 件衣物</p>
                      </div>
                      {selectedBatch === b.id && <Check className="w-5 h-5 text-amber-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSort}
              disabled={!selectedBatch}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                selectedBatch
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
              确认分拣并进入洗涤
            </button>
          </div>
        );

      case 'inspect':
        if (inspectSubMode === 'rewash') {
          return (
            <div className="space-y-6">
              <button
                onClick={() => setInspectSubMode(null)}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                ← 返回质检选择
              </button>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">返洗原因</label>
                  <div className="space-y-2">
                    {REWASH_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setRewashReason(reason)}
                        className={cn(
                          'w-full p-3 rounded-lg border text-left transition-all',
                          rewashReason === reason
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <span className={cn(
                          'text-sm',
                          rewashReason === reason ? 'text-orange-700 font-medium' : 'text-slate-600'
                        )}>
                          {reason}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">详细说明</label>
                  <textarea
                    value={rewashDesc}
                    onChange={(e) => setRewashDesc(e.target.value)}
                    placeholder="请描述具体问题..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    rows={3}
                  />
                </div>
              </div>

              <button
                onClick={handleMarkRewash}
                disabled={!rewashReason || !rewashDesc}
                className={cn(
                  'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  rewashReason && rewashDesc
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <RotateCcw className="w-4 h-4" />
                确认返洗
              </button>
            </div>
          );
        }

        if (inspectSubMode === 'damage') {
          return (
            <div className="space-y-6">
              <button
                onClick={() => setInspectSubMode(null)}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                ← 返回质检选择
              </button>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    拍照取证
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
                  >
                    <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">点击上传或拍照</p>
                    <p className="text-xs text-slate-400 mt-1">支持多张图片</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {uploadedImages.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    污损位置
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAMAGE_POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setDamagePosition(pos)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm transition-all',
                          damagePosition === pos
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">污损描述</label>
                  <textarea
                    value={damageDesc}
                    onChange={(e) => setDamageDesc(e.target.value)}
                    placeholder="请详细描述污损情况..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    rows={3}
                  />
                </div>
              </div>

              <button
                onClick={handleMarkDamage}
                disabled={!damagePosition || !damageDesc}
                className={cn(
                  'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                  damagePosition && damageDesc
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                确认污损记录
              </button>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-700">质检结果</h3>

              <button
                onClick={handleInspectPass}
                className="w-full p-4 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-emerald-700">质检通过</p>
                  <p className="text-sm text-emerald-600">衣物洗涤合格，进入门店交接</p>
                </div>
              </button>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-medium text-slate-600 mb-3">标记问题</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setInspectSubMode('rewash')}
                    className="w-full p-4 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-orange-700">需要返洗</p>
                      <p className="text-sm text-orange-600">污渍未清、色泽不均等问题</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setInspectSubMode('damage')}
                    className="w-full p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-red-700">发现污损</p>
                      <p className="text-sm text-red-600">褪色、破损、变形等问题</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'damage':
        if (orderDamageRecords.length > 0) {
          return (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  污损赔付处理
                </h3>
                <p className="text-sm text-red-700">
                  该订单已有 {orderDamageRecords.length} 条污损记录，请厂长审核处理
                </p>
              </div>
              {orderDamageRecords.map((record: DamageRecord) => (
                <div key={record.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">{record.position}</span>
                    <span className="text-xs text-red-400 ml-auto">{record.id}</span>
                  </div>
                  <p className="text-sm text-red-600 mb-3">{record.description}</p>
                  <img src={record.imageUrl} alt="" className="rounded-lg w-full h-40 object-cover" />
                  <p className="text-xs text-red-400 mt-3">
                    {record.recordedBy} · {formatDateTime(record.recordedAt)}
                  </p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const updatedOrders = orders.map((o) =>
                      o.id === orderId
                        ? { ...o, status: 'rejected' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
                        : o
                    );
                    setOrders(updatedOrders);
                    handleClose();
                  }}
                  className="py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600"
                >
                  <XCircle className="w-4 h-4" />
                  退回门店
                </button>
                <button
                  onClick={() => {
                    const updatedOrders = orders.map((o) =>
                      o.id === orderId
                        ? { ...o, status: 'handover' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
                        : o
                    );
                    setOrders(updatedOrders);
                    handleClose();
                  }}
                  className="py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  赔付后放行
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">污损登记</h3>
              <p className="text-sm text-red-700">发现衣物存在污损，请记录并拍照留证</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  拍照取证
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all"
                >
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">点击上传或拍照</p>
                  <p className="text-xs text-slate-400 mt-1">支持多张图片</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  污损位置
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAMAGE_POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setDamagePosition(pos)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm transition-all',
                        damagePosition === pos
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">污损描述</label>
                <textarea
                  value={damageDesc}
                  onChange={(e) => setDamageDesc(e.target.value)}
                  placeholder="请详细描述污损情况..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={handleMarkDamage}
              disabled={!damagePosition || !damageDesc}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                damagePosition && damageDesc
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              确认污损记录
            </button>
          </div>
        );

      case 'rewash':
        if (orderRewashRecords.length > 0) {
          const latestRewash = orderRewashRecords[orderRewashRecords.length - 1];
          return (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  返洗处理
                </h3>
                <p className="text-sm text-orange-700">
                  该订单处于返洗状态，当前是第 {orderRewashRecords.length} 次返洗
                </p>
              </div>
              {orderRewashRecords.map((record: RewashRecord, index: number) => (
                <div key={record.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded">
                      第 {index + 1} 次
                    </span>
                    <span className="text-sm font-medium text-orange-700">{record.reason}</span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded ml-auto',
                      record.status === 'rewashing' ? 'bg-blue-100 text-blue-700' :
                      record.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    )}>
                      {record.status === 'rewashing' ? '返洗中' :
                       record.status === 'completed' ? '已完成' : '待处理'}
                    </span>
                  </div>
                  <p className="text-sm text-orange-600 mb-3">{record.description}</p>
                  <p className="text-xs text-orange-400">
                    登记时间：{formatDateTime(record.createdAt)}
                  </p>
                  {record.rewashCompletedAt && (
                    <p className="text-xs text-orange-400">
                      完成时间：{formatDateTime(record.rewashCompletedAt)}
                    </p>
                  )}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const activeRewash = orderRewashRecords.find((r) => r.status === 'rewashing');
                    if (activeRewash) {
                      updateRewashStatus(activeRewash.id, 'completed');
                    }
                    const updatedOrders = orders.map((o) =>
                      o.id === orderId
                        ? { ...o, status: 'inspecting' as const, updatedAt: new Date().toISOString(), assignedTo: 'inspector' as const }
                        : o
                    );
                    setOrders(updatedOrders);
                    handleClose();
                  }}
                  className="py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                >
                  <RotateCcw className="w-4 h-4" />
                  完成返洗
                </button>
                <button
                  onClick={() => {
                    const activeRewash = orderRewashRecords.find((r) => r.status === 'rewashing');
                    if (activeRewash) {
                      updateRewashStatus(activeRewash.id, 'completed');
                    }
                    const updatedOrders = orders.map((o) =>
                      o.id === orderId
                        ? { ...o, status: 'inspecting' as const, updatedAt: new Date().toISOString(), assignedTo: 'inspector' as const }
                        : o
                    );
                    setOrders(updatedOrders);
                    handleClose();
                  }}
                  className="py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  <CheckCircle className="w-4 h-4" />
                  进入质检
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-800 mb-2">返洗登记</h3>
              <p className="text-sm text-orange-700">衣物洗涤不合格，需要重新洗涤</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">返洗原因</label>
                <div className="space-y-2">
                  {REWASH_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setRewashReason(reason)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all',
                        rewashReason === reason
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      <span className={cn(
                        'text-sm',
                        rewashReason === reason ? 'text-orange-700 font-medium' : 'text-slate-600'
                      )}>
                        {reason}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">详细说明</label>
                <textarea
                  value={rewashDesc}
                  onChange={(e) => setRewashDesc(e.target.value)}
                  placeholder="请描述具体问题..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={handleMarkRewash}
              disabled={!rewashReason || !rewashDesc}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                rewashReason && rewashDesc
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <RotateCcw className="w-4 h-4" />
              确认返洗
            </button>
          </div>
        );

      case 'handover':
        return (
          <div className="space-y-6">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h3 className="font-medium text-cyan-800 mb-2">交接确认</h3>
              <p className="text-sm text-cyan-700">
                确认衣物已打包完毕，准备送往 {order.storeName}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">订单编号</span>
                <span className="font-mono text-sm text-slate-800">{order.orderNo}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">衣物类型</span>
                <span className="text-sm text-slate-800">{order.garmentType}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">所属门店</span>
                <span className="text-sm text-slate-800">{order.storeName}</span>
              </div>
            </div>

            <button
              onClick={handleHandover}
              className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
            >
              <Send className="w-4 h-4" />
              确认送出
            </button>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6">
            {verifyPassed === null ? (
              <>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-medium text-teal-800 mb-2">门店核验</h3>
                  <p className="text-sm text-teal-700">
                    请核对收到的衣物是否与订单一致
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" defaultChecked />
                    <span className="text-sm text-slate-700">衣物数量正确</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" defaultChecked />
                    <span className="text-sm text-slate-700">衣物无新增污渍</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" defaultChecked />
                    <span className="text-sm text-slate-700">洗涤效果符合预期</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVerify(true)}
                    className="py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
                  >
                    <CheckCircle className="w-4 h-4" />
                    核验通过
                  </button>
                  <button
                    onClick={() => handleVerify(false)}
                    className="py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4" />
                    申请退回
                  </button>
                </div>
              </>
            ) : verifyPassed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-700">核验通过</h3>
                <p className="text-sm text-emerald-600 mt-1">回单已完成</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">退回原因</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请详细说明退回原因..."
                    className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    rows={4}
                  />
                </div>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason}
                  className={cn(
                    'w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                    rejectReason
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  )}
                >
                  <XCircle className="w-4 h-4" />
                  确认退回
                </button>
              </div>
            )}
          </div>
        );

      case 'rejected_review':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                门店退回审核
              </h3>
              <p className="text-sm text-red-700">
                门店已退回此订单，请审核处理
              </p>
            </div>

            {orderReceipt && orderReceipt.isRejected && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">退回原因</h4>
                <p className="text-sm text-slate-600">{orderReceipt.rejectReason}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {orderReceipt.verifiedBy || '门店交接员'} · {orderReceipt.verifiedAt ? formatDateTime(orderReceipt.verifiedAt) : '时间未知'}
                </p>
              </div>
            )}

            {orderDamageRecords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">关联污损记录</h4>
                {orderDamageRecords.map((record: DamageRecord) => (
                  <div key={record.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">{record.position}</span>
                      <span className="text-xs text-red-400 ml-auto">{record.id}</span>
                    </div>
                    <p className="text-sm text-red-600">{record.description}</p>
                    <img src={record.imageUrl} alt="" className="mt-3 rounded-lg w-full h-32 object-cover" />
                    <p className="text-xs text-red-400 mt-2">
                      {record.recordedBy} · {formatDateTime(record.recordedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {orderReceipt && orderReceipt.isRejected && (
              <button
                onClick={() => {
                  const updatedOrders = orders.map((o) =>
                    o.id === orderId
                      ? { ...o, status: 'handover' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
                      : o
                  );
                  setOrders(updatedOrders);
                  handleClose();
                }}
                className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle className="w-4 h-4" />
                重新交接
              </button>
            )}
            <button
              onClick={() => {
                const updatedOrders = orders.map((o) =>
                  o.id === orderId
                    ? { ...o, status: 'inspecting' as const, updatedAt: new Date().toISOString(), assignedTo: 'inspector' as const }
                    : o
                );
                setOrders(updatedOrders);
                handleClose();
              }}
              className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-purple-500 text-white hover:bg-purple-600"
            >
              <RotateCcw className="w-4 h-4" />
              退回质检重检
            </button>
          </div>
        );

      case 'rejected_damage_review':
        return (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                污损赔付审核
              </h3>
              <p className="text-sm text-red-700">
                该订单存在污损问题，请厂长审核处理
              </p>
            </div>

            {orderDamageRecords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">污损记录</h4>
                {orderDamageRecords.map((record: DamageRecord) => (
                  <div key={record.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">{record.position}</span>
                      <span className="text-xs text-red-400 ml-auto">{record.id}</span>
                    </div>
                    <p className="text-sm text-red-600 mb-3">{record.description}</p>
                    <img src={record.imageUrl} alt="" className="rounded-lg w-full h-40 object-cover" />
                    <p className="text-xs text-red-400 mt-3">
                      {record.recordedBy} · {formatDateTime(record.recordedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {orderRewashRecords.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">返洗记录</h4>
                {orderRewashRecords.map((record: RewashRecord, index: number) => (
                  <div key={record.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded">
                        第 {index + 1} 次
                      </span>
                      <RotateCcw className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">{record.reason}</span>
                    </div>
                    <p className="text-sm text-orange-600">{record.description}</p>
                    <p className="text-xs text-orange-400 mt-2">
                      质检员 · {formatDateTime(record.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  const updatedOrders = orders.map((o) =>
                    o.id === orderId
                      ? { ...o, status: 'handover' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
                      : o
                  );
                  setOrders(updatedOrders);
                  handleClose();
                }}
                className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <CheckCircle className="w-4 h-4" />
                赔付后放行
              </button>
              <button
                onClick={() => {
                  const updatedOrders = orders.map((o) =>
                    o.id === orderId
                      ? { ...o, status: 'rewashing' as const, updatedAt: new Date().toISOString(), assignedTo: 'inspector' as const }
                      : o
                  );
                  setOrders(updatedOrders);
                  handleClose();
                }}
                className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
              >
                <RotateCcw className="w-4 h-4" />
                安排返洗修复
              </button>
            </div>
          </div>
        );

      case 'rejected_store_resubmit':
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                门店重新交接
              </h3>
              <p className="text-sm text-amber-700">
                厂长审核通过，请确认交接
              </p>
            </div>

            {orderReceipt && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">历史回单</h4>
                <p className="text-sm text-slate-600">
                  {orderReceipt.isRejected ? '已退回' : '未核验'}
                </p>
                {orderReceipt.rejectReason && (
                  <p className="text-sm text-slate-600 mt-1">退回原因：{orderReceipt.rejectReason}</p>
                )}
                {orderReceipt.verifiedAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    {orderReceipt.verifiedBy || '门店交接员'} · {formatDateTime(orderReceipt.verifiedAt)}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const updatedOrders = orders.map((o) =>
                  o.id === orderId
                    ? { ...o, status: 'verifying' as const, updatedAt: new Date().toISOString(), assignedTo: 'store_handler' as const }
                    : o
                );
                setOrders(updatedOrders);
                handleClose();
              }}
              className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-cyan-500 text-white hover:bg-cyan-600"
            >
              <Send className="w-4 h-4" />
              确认进入核验
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProcessing}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded',
                    mode === 'rejected_review' ? 'text-red-600 bg-red-50' :
                    mode === 'rejected_damage_review' ? 'text-rose-600 bg-rose-50' :
                    mode === 'rejected_store_resubmit' ? 'text-amber-600 bg-amber-50' :
                    'text-amber-600 bg-amber-50'
                  )}>
                    {order?.rejectSource ? (
                      <span className="flex items-center gap-1">
                        {REJECT_SOURCE_LABELS[order.rejectSource]}
                      </span>
                    ) : (
                      MODE_LABELS[mode || '']
                    )}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-2">{order.orderNo}</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="flex border-b border-slate-200">
              {[{ key: 'main', label: '处理' }, { key: 'history', label: '流转记录' }, { key: 'evidence', label: '证据链' }].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium transition-all border-b-2',
                    activeTab === tab.key
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'main' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{order.garmentDesc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Store className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{order.storeName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        当前状态：{STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    {batch && (
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          批次：{batch.batchNo} ({batch.washType})
                        </span>
                      </div>
                    )}
                  </div>

                  {renderMainContent()}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-sm font-medium text-slate-700">收衣登记</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDateTime(order.createdAt)}</p>
                      <p className="text-xs text-slate-400 mt-1">门店交接员 · {order.storeName}</p>
                    </div>
                  </div>

                  {order.batchId && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-slate-700">分拣入批</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {batch ? `${batch.batchNo} (${batch.washType})` : order.batchId}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">厂长 · 分拣指派</p>
                      </div>
                    </div>
                  )}

                  {orderRewashRecords.map((record: RewashRecord, index: number) => (
                    <div key={record.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-slate-700">返洗登记（第 {index + 1} 次）</p>
                        <p className="text-xs text-slate-500 mt-1">{record.reason}：{record.description}</p>
                        <p className="text-xs text-slate-400 mt-1">质检员 · {formatDateTime(record.createdAt)}</p>
                      </div>
                    </div>
                  ))}

                  {orderDamageRecords.map((record: DamageRecord) => (
                    <div key={record.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-slate-700">污损记录（{record.position}）</p>
                        <p className="text-xs text-slate-500 mt-1">{record.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{record.recordedBy} · {formatDateTime(record.recordedAt)}</p>
                      </div>
                    </div>
                  ))}

                  {orderReceipt && orderReceipt.isRejected && orderReceipt.rejectReason && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-red-600" />
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-red-700">门店退回</p>
                        <p className="text-xs text-slate-500 mt-1">{orderReceipt.rejectReason}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {orderReceipt.verifiedBy || '门店交接员'} · {orderReceipt.verifiedAt ? formatDateTime(orderReceipt.verifiedAt) : '时间未知'}
                        </p>
                      </div>
                    </div>
                  )}

                  {orderReceipt && orderReceipt.isVerified && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-sm font-medium text-emerald-700">核验通过</p>
                        <p className="text-xs text-slate-500 mt-1">回单已完成</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {orderReceipt.verifiedBy || '门店交接员'} · {orderReceipt.verifiedAt ? formatDateTime(orderReceipt.verifiedAt) : '时间未知'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        order.status === 'completed' ? 'bg-emerald-500' :
                        order.status === 'rejected' ? 'bg-red-500' :
                        'bg-amber-500'
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">当前状态：{STATUS_LABELS[order.status]}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDateTime(order.updatedAt)}</p>
                      <p className="text-xs text-slate-400 mt-1">{ROLE_LABELS[order.assignedTo]}处理中</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-6">
                  {orderReceipt && orderReceipt.isRejected && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-3">回单退回记录</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">门店退回</span>
                        </div>
                        <p className="text-sm text-slate-600">{orderReceipt.rejectReason}</p>
                        <p className="text-xs text-slate-400 mt-3">
                          {orderReceipt.verifiedBy || '门店交接员'} · {orderReceipt.verifiedAt ? formatDateTime(orderReceipt.verifiedAt) : '时间未知'}
                        </p>
                      </div>
                    </div>
                  )}

                  {orderDamageRecords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-3">污损记录</h4>
                      {orderDamageRecords.map((record: DamageRecord) => (
                        <div key={record.id} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">{record.position}</span>
                            <span className="text-xs text-red-400 ml-auto">{record.id}</span>
                          </div>
                          <p className="text-sm text-red-600">{record.description}</p>
                          <img src={record.imageUrl} alt="" className="mt-3 rounded-lg w-full h-40 object-cover" />
                          <p className="text-xs text-red-400 mt-2">
                            {record.recordedBy} · {formatDateTime(record.recordedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {orderRewashRecords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-3">返洗记录</h4>
                      {orderRewashRecords.map((record: RewashRecord, index: number) => (
                        <div key={record.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded">
                              第 {index + 1} 次
                            </span>
                            <RotateCcw className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-700">{record.reason}</span>
                          </div>
                          <p className="text-sm text-orange-600">{record.description}</p>
                          <p className="text-xs text-orange-400 mt-2">
                            登记：{formatDateTime(record.createdAt)}
                            {record.rewashCompletedAt && ` | 完成：${formatDateTime(record.rewashCompletedAt)}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {orderDamageRecords.length === 0 && orderRewashRecords.length === 0 && (!orderReceipt || !orderReceipt.isRejected) && (
                    <div className="text-center py-12 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无证据记录</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
