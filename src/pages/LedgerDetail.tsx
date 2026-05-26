import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, Clock, User, Camera, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Timeline } from '@/components/ui/Timeline';
import { useStore } from '@/store/useStore';
import { categoryLabels, ledgerStatusLabels, type LedgerStatus } from '@/types';
import { cn } from '@/lib/utils';

export default function LedgerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, currentRole, getLedgerById, updateLedgerStatus, addLedgerRemark } = useStore();
  const [remark, setRemark] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');

  const record = getLedgerById(id || '');

  if (!record) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">台账记录不存在</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/ledger')}>
          返回列表
        </Button>
      </div>
    );
  }

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

  const getNextStatus = () => {
    switch (record.status) {
      case 'pending':
        return { next: 'verified', label: '审核通过' };
      case 'verified':
        return { next: 'reconciled', label: '对账完成' };
      case 'reconciled':
        return { next: 'settled', label: '完成结算' };
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus();
  const canApprove =
    (currentRole === 'owner' && record.status === 'pending') ||
    (currentRole === 'accountant' && (record.status === 'verified' || record.status === 'reconciled')) ||
    (currentRole === 'owner' && (record.status === 'verified' || record.status === 'reconciled'));

  const handleStatusUpdate = (status: LedgerStatus) => {
    updateLedgerStatus(record.id, status, currentUser.id, currentUser.name);
  };

  const handleAddRemark = () => {
    if (!remark.trim()) return;
    addLedgerRemark(record.id, {
      userId: currentUser.id,
      userName: currentUser.name,
      content: remark,
      createdAt: new Date().toISOString(),
    });
    setRemark('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ledger')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{record.recordNo}</h1>
          <p className="text-gray-500 mt-1">创建于 {format(new Date(record.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</p>
        </div>
        <Badge variant={getStatusBadgeVariant(record.status)} className="ml-auto text-sm px-3 py-1">
          {ledgerStatusLabels[record.status]}
        </Badge>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('info')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'info'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          详细信息
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'timeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          操作日志
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>基本信息</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">废品分类</p>
                    <p className="font-medium text-gray-900 mt-1">{categoryLabels[record.category]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">供应商</p>
                    <p className="font-medium text-gray-900 mt-1">{record.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">重量</p>
                    <p className="font-medium text-gray-900 mt-1">{record.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">单价</p>
                    <p className="font-medium text-gray-900 mt-1">¥{record.unitPrice}/kg</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">总金额</span>
                    <span className="text-2xl font-bold text-blue-600">¥{record.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>
                  <Camera className="w-5 h-5 inline mr-2" />
                  现场照片
                </Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">过磅照片</p>
                    <img
                      src={record.weightPhoto}
                      alt="过磅照片"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                  {record.yardPhoto && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">堆场照片</p>
                      <img
                        src={record.yardPhoto}
                        alt="堆场照片"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>
                  <MessageSquare className="w-5 h-5 inline mr-2" />
                  备注信息 ({record.remarks.length})
                </Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                <div className="flex gap-3">
                  <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="添加备注..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" onClick={handleAddRemark} disabled={!remark.trim()}>
                        发送
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  {record.remarks.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{r.userName}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(r.createdAt), 'MM-dd HH:mm', { locale: zhCN })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{r.content}</p>
                      </div>
                    </div>
                  ))}
                  {record.remarks.length === 0 && (
                    <p className="text-center text-gray-500 py-4">暂无备注</p>
                  )}
                </div>
              </Card.Content>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>流程状态</Card.Title>
              </Card.Header>
              <Card.Content className="space-y-4">
                {[
                  { key: 'pending', label: '创建台账', time: record.createdAt, done: true },
                  { key: 'verified', label: '审核通过', time: record.verifiedAt, done: !!record.verifiedAt },
                  { key: 'reconciled', label: '对账完成', time: record.reconciledAt, done: !!record.reconciledAt },
                  { key: 'settled', label: '完成结算', time: record.settledAt, done: !!record.settledAt },
                ].map((step, index, arr) => (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="relative">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        step.done ? 'bg-green-100' : 'bg-gray-100'
                      )}>
                        {step.done ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium text-gray-500">{index + 1}</span>
                        )}
                      </div>
                      {index < arr.length - 1 && (
                        <div className={cn(
                          'absolute left-1/2 top-8 w-0.5 h-6 -translate-x-1/2',
                          step.done ? 'bg-green-200' : 'bg-gray-200'
                        )} />
                      )}
                    </div>
                    <div>
                      <p className={cn('font-medium', step.done ? 'text-gray-900' : 'text-gray-500')}>
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(step.time), 'MM-dd HH:mm', { locale: zhCN })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </Card.Content>
              {nextStatus && canApprove && (
                <Card.Footer>
                  <Button className="w-full" onClick={() => handleStatusUpdate(nextStatus.next as LedgerStatus)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {nextStatus.label}
                  </Button>
                </Card.Footer>
              )}
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>过磅信息</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex items-center gap-3">
                  <img src={currentUser.avatar} alt="" className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium text-gray-900">{record.weigherName}</p>
                    <p className="text-sm text-gray-500">过磅员</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>操作日志</Card.Title>
          </Card.Header>
          <Card.Content>
            <Timeline items={record.operationLogs} />
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
