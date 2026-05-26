import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { categoryLabels, ledgerStatusLabels, type Category, type LedgerStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function LedgerList() {
  const navigate = useNavigate();
  const { currentRole, currentUser, getFilteredLedger, addLedgerRecord, currentPrices } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    category: 'paper' as Category,
    weight: '',
    supplier: '',
    weightPhoto: '',
  });

  const ledgerRecords = getFilteredLedger();

  const filteredRecords = ledgerRecords.filter((record) => {
    const matchSearch =
      record.recordNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || record.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const getStatusBadgeVariant = (status: LedgerStatus) => {
    switch (status) {
      case 'settled':
        return 'success';
      case 'pending':
        return 'warning';
      case 'verified':
      case 'reconciled':
        return 'info';
      default:
        return 'gray';
    }
  };

  const currentPrice = currentPrices.find((p) => p.category === newRecord.category);
  const calculatedAmount = currentPrice ? parseFloat(newRecord.weight || '0') * currentPrice.price : 0;

  const handleCreateRecord = () => {
    if (!newRecord.weight || !newRecord.supplier) return;

    addLedgerRecord({
      category: newRecord.category,
      weight: parseFloat(newRecord.weight),
      unitPrice: currentPrice?.price || 0,
      totalAmount: calculatedAmount,
      weigherId: currentUser.id,
      weigherName: currentUser.name,
      supplier: newRecord.supplier,
      weightPhoto: newRecord.weightPhoto || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop',
      status: 'pending',
    });

    setShowCreateModal(false);
    setNewRecord({ category: 'paper', weight: '', supplier: '', weightPhoto: '' });
  };

  const canCreate = currentRole === 'weigher' || currentRole === 'owner';
  const canVerify = currentRole === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">环保台账</h1>
          <p className="text-gray-500 mt-1">管理废品回收记录，跟踪审核流程</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建台账
          </Button>
        )}
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
              {Object.entries(ledgerStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部分类</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索编号或供应商..."
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">台账编号</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">品类</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">重量</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">供应商</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">过磅员</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">创建时间</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{record.recordNo}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{categoryLabels[record.category]}</td>
                    <td className="px-6 py-4 text-gray-600">{record.weight} kg</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">¥{record.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{record.supplier}</td>
                    <td className="px-6 py-4 text-gray-600">{record.weigherName}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {ledgerStatusLabels[record.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {format(new Date(record.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/ledger/${record.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      暂无台账记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="新建台账记录">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">废品分类</label>
            <select
              value={newRecord.category}
              onChange={(e) => setNewRecord({ ...newRecord, category: e.target.value as Category })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {currentPrice && (
              <p className="text-sm text-gray-500 mt-1">当前单价：¥{currentPrice.price}/kg</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重量 (kg)</label>
            <input
              type="number"
              value={newRecord.weight}
              onChange={(e) => setNewRecord({ ...newRecord, weight: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入重量"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">供应商</label>
            <input
              type="text"
              value={newRecord.supplier}
              onChange={(e) => setNewRecord({ ...newRecord, supplier: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入供应商名称"
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">预估金额</span>
              <span className="text-xl font-bold text-blue-600">¥{calculatedAmount.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreateRecord}>
              <CheckCircle className="w-4 h-4 mr-2" />
              创建记录
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
