import { useState } from 'react';
import { Search, Filter, CheckCircle, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { financeTypeLabels, financeStatusLabels, type FinanceStatus, type FinanceRecord } from '@/types';

export default function FinanceSettlement() {
  const { currentRole, currentUser, financeRecords, ledgerRecords, reconcileFinance, settleFinance } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [settleData, setSettleData] = useState({
    difference: '',
    differenceNote: '',
  });

  const canReconcile = currentRole === 'accountant' || currentRole === 'owner';
  const canSettle = currentRole === 'accountant' || currentRole === 'owner';

  const getRelatedLedger = (ledgerId?: string) => {
    if (!ledgerId) return undefined;
    return ledgerRecords.find((r) => r.id === ledgerId);
  };

  const canReconcileRecord = (record: FinanceRecord) => {
    if (!canReconcile || record.status !== 'pending') return false;
    const relatedLedger = getRelatedLedger(record.ledgerId);
    return relatedLedger && relatedLedger.status !== 'pending';
  };

  const canSettleRecord = (record: FinanceRecord) => {
    if (!canSettle || record.status !== 'reconciled') return false;
    const relatedLedger = getRelatedLedger(record.ledgerId);
    return relatedLedger && (relatedLedger.status === 'reconciled' || relatedLedger.status === 'settled');
  };

  const filteredRecords = financeRecords.filter((record) => {
    const matchSearch =
      record.recordNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.party.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingAmount = financeRecords
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0);
  const reconciledAmount = financeRecords
    .filter((r) => r.status === 'reconciled')
    .reduce((sum, r) => sum + r.amount, 0);
  const settledAmount = financeRecords
    .filter((r) => r.status === 'settled')
    .reduce((sum, r) => sum + r.amount, 0);

  const getStatusBadgeVariant = (status: FinanceStatus) => {
    switch (status) {
      case 'settled':
        return 'success';
      case 'pending':
        return 'warning';
      case 'reconciled':
        return 'info';
      default:
        return 'gray';
    }
  };

  const handleReconcile = (id: string) => {
    reconcileFinance(id, currentUser.name);
  };

  const handleSettle = () => {
    settleFinance(selectedId, settleData.difference ? parseFloat(settleData.difference) : undefined, settleData.differenceNote || undefined);
    setShowSettleModal(false);
    setSelectedId('');
    setSettleData({ difference: '', differenceNote: '' });
  };

  const selectedRecord = financeRecords.find((r) => r.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">财务结算</h1>
        <p className="text-gray-500 mt-1">管理账款对账与结算，跟踪财务流程</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待对账</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{pendingAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {financeRecords.filter((r) => r.status === 'pending').length} 笔
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待结算</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{reconciledAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {financeRecords.filter((r) => r.status === 'reconciled').length} 笔
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已结算</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{settledAmount.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {financeRecords.filter((r) => r.status === 'settled').length} 笔
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card>
        <Card.Header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              {Object.entries(financeStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索编号或往来单位..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">记录编号</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">往来单位</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">对账人</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">差异</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{record.recordNo}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.party}</td>
                    <td className="px-6 py-4">
                      <Badge variant={record.type === 'receivable' ? 'info' : 'default'}>
                        {financeTypeLabels[record.type]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">¥{record.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{record.reconciledBy || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {financeStatusLabels[record.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {record.difference !== undefined ? (
                        <span className={record.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ¥{record.difference}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {record.status === 'pending' && (
                        canReconcileRecord(record) ? (
                          <Button variant="ghost" size="sm" onClick={() => handleReconcile(record.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            对账
                          </Button>
                        ) : (
                          <div className="text-xs text-gray-400">
                            等待台账审核
                          </div>
                        )
                      )}
                      {record.status === 'reconciled' && (
                        canSettleRecord(record) ? (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedId(record.id); setShowSettleModal(true); }}>
                            <DollarSign className="w-4 h-4 mr-1" />
                            结算
                          </Button>
                        ) : (
                          <div className="text-xs text-gray-400">
                            等待台账对账
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      暂无财务记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <Modal isOpen={showSettleModal} onClose={() => setShowSettleModal(false)} title="完成结算" size="md">
        <div className="space-y-4">
          {selectedRecord && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">记录编号</span>
                <span className="font-medium">{selectedRecord.recordNo}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500">往来单位</span>
                <span className="font-medium">{selectedRecord.party}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">对账金额</span>
                <span className="text-xl font-bold text-blue-600">¥{selectedRecord.amount.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">差异金额（可选）</label>
            <input
              type="number"
              value={settleData.difference}
              onChange={(e) => setSettleData({ ...settleData, difference: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如有差异请输入"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">差异说明（可选）</label>
            <textarea
              value={settleData.differenceNote}
              onChange={(e) => setSettleData({ ...settleData, differenceNote: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="说明差异原因..."
            />
          </div>
          {settleData.difference && (
            <div className="p-4 bg-yellow-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                存在差异金额 ¥{settleData.difference}，请确保已记录差异说明
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowSettleModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSettle}>
              <CheckCircle className="w-4 h-4 mr-2" />
              确认结算
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
