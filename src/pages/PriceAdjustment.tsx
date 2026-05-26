import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, User, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { categoryLabels, type Category } from '@/types';
import { cn } from '@/lib/utils';

export default function PriceAdjustment() {
  const { currentRole, currentUser, priceChanges, currentPrices, addPriceChange, approvePriceChange, rejectPriceChange } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [newChange, setNewChange] = useState({
    category: 'paper' as Category,
    newPrice: '',
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  const canCreate = currentRole === 'accountant' || currentRole === 'owner';
  const canApprove = currentRole === 'owner';

  const currentPrice = currentPrices.find((p) => p.category === newChange.category);
  const priceDiff = currentPrice ? parseFloat(newChange.newPrice || '0') - currentPrice.price : 0;

  const handleCreate = () => {
    if (!newChange.newPrice || !newChange.reason) return;

    addPriceChange({
      category: newChange.category,
      oldPrice: currentPrice?.price || 0,
      newPrice: parseFloat(newChange.newPrice),
      effectiveDate: newChange.effectiveDate,
      reason: newChange.reason,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
    });

    setShowCreateModal(false);
    setNewChange({ category: 'paper', newPrice: '', effectiveDate: format(new Date(), 'yyyy-MM-dd'), reason: '' });
  };

  const handleApprove = (id: string) => {
    approvePriceChange(id, currentUser.id, currentUser.name);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    rejectPriceChange(selectedId, currentUser.id, currentUser.name, rejectReason);
    setShowRejectModal(false);
    setSelectedId('');
    setRejectReason('');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">价格调整</h1>
          <p className="text-gray-500 mt-1">管理废品回收价格，跟踪调价审批流程</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            申请调价
          </Button>
        )}
      </div>

      <Card>
        <Card.Header>
          <Card.Title>当前价格</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentPrices.map((price) => (
              <div key={price.category} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">{categoryLabels[price.category]}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">¥{price.price}</p>
                <p className="text-xs text-gray-400 mt-1">/kg</p>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>调价记录</Card.Title>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">品类</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">原价</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">新价</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">变动</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">生效日期</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">申请人</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priceChanges.map((change) => (
                  <tr key={change.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{categoryLabels[change.category]}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">¥{change.oldPrice}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">¥{change.newPrice}</td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        'flex items-center gap-1',
                        change.newPrice > change.oldPrice ? 'text-green-600' : 'text-red-600'
                      )}>
                        {change.newPrice > change.oldPrice ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{change.newPrice > change.oldPrice ? '+' : ''}{(change.newPrice - change.oldPrice).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{change.effectiveDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-gray-600 text-sm">{change.applicantName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(change.status)}>
                        {change.status === 'approved' ? '已批准' : change.status === 'pending' ? '待审批' : '已驳回'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {change.status === 'pending' && canApprove && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(change.id)}>
                            <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                            批准
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedId(change.id); setShowRejectModal(true); }}>
                            <XCircle className="w-4 h-4 mr-1 text-red-600" />
                            驳回
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {priceChanges.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      暂无调价记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="申请价格调整" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">废品分类</label>
              <select
                value={newChange.category}
                onChange={(e) => setNewChange({ ...newChange, category: e.target.value as Category })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生效日期</label>
              <input
                type="date"
                value={newChange.effectiveDate}
                onChange={(e) => setNewChange({ ...newChange, effectiveDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前价格</label>
              <div className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500">
                ¥{currentPrice?.price || 0}/kg
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新价格</label>
              <input
                type="number"
                step="0.1"
                value={newChange.newPrice}
                onChange={(e) => setNewChange({ ...newChange, newPrice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入新价格"
              />
            </div>
          </div>
          {priceDiff !== 0 && (
            <div className={cn(
              'p-4 rounded-lg',
              priceDiff > 0 ? 'bg-green-50' : 'bg-red-50'
            )}>
              <div className="flex items-center justify-between">
                <span className={cn('text-sm', priceDiff > 0 ? 'text-green-700' : 'text-red-700')}>
                  价格变动
                </span>
                <span className={cn('font-bold', priceDiff > 0 ? 'text-green-700' : 'text-red-700')}>
                  {priceDiff > 0 ? '+' : ''}¥{priceDiff.toFixed(2)}/kg
                </span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调价原因</label>
            <textarea
              value={newChange.reason}
              onChange={(e) => setNewChange({ ...newChange, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="请说明调价原因..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreate}>
              <DollarSign className="w-4 h-4 mr-2" />
              提交申请
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="驳回调价申请" size="md">
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
              <XCircle className="w-4 h-4 mr-2" />
              确认驳回
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
