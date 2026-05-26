import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';
import { exceptionTypeLabels, exceptionStatusLabels, type ExceptionType, type ExceptionStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function ExceptionList() {
  const navigate = useNavigate();
  const { currentRole, currentUser, getFilteredExceptions, addException } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newException, setNewException] = useState({
    type: 'environment' as ExceptionType,
    title: '',
    description: '',
    relatedLedgerId: '',
  });

  const exceptions = getFilteredExceptions();

  const filteredExceptions = exceptions.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.exceptionNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

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

  const getTypeIconColor = (type: ExceptionType) => {
    switch (type) {
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

  const handleCreateException = () => {
    if (!newException.title || !newException.description) return;

    addException({
      type: newException.type,
      title: newException.title,
      description: newException.description,
      photos: [],
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      relatedLedgerId: newException.relatedLedgerId || undefined,
    });

    setShowCreateModal(false);
    setNewException({ type: 'environment', title: '', description: '', relatedLedgerId: '' });
  };

  const canCreate = true;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">异常上报</h1>
          <p className="text-gray-500 mt-1">跟踪和处理运营中的各类异常情况</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            上报异常
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['pending', 'processing', 'resolved', 'rejected'] as ExceptionStatus[]).map((status) => (
          <Card key={status}>
            <Card.Content className="text-center">
              <p className="text-sm text-gray-500">{exceptionStatusLabels[status]}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {exceptions.filter((e) => e.status === status).length}
              </p>
            </Card.Content>
          </Card>
        ))}
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
              {Object.entries(exceptionStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部类型</option>
              {Object.entries(exceptionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索标题或编号..."
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">异常编号</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">标题</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">上报人</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">处理人</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">创建时间</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExceptions.map((exception) => (
                  <tr key={exception.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{exception.exceptionNo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="gray">{exceptionTypeLabels[exception.type]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{exception.title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-gray-600 text-sm">{exception.reporterName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {exception.handlerName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <span className="text-gray-600 text-sm">{exception.handlerName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">待指派</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(exception.status)}>
                        {exceptionStatusLabels[exception.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {format(new Date(exception.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/exceptions/${exception.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredExceptions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      暂无异常记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="上报异常" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">异常类型</label>
              <select
                value={newException.type}
                onChange={(e) => setNewException({ ...newException, type: e.target.value as ExceptionType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(exceptionTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关联台账（可选）</label>
              <input
                type="text"
                value={newException.relatedLedgerId}
                onChange={(e) => setNewException({ ...newException, relatedLedgerId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入台账编号"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">异常标题</label>
            <input
              type="text"
              value={newException.title}
              onChange={(e) => setNewException({ ...newException, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="简要描述异常"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea
              value={newException.description}
              onChange={(e) => setNewException({ ...newException, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="详细描述异常情况..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleCreateException}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              提交上报
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
