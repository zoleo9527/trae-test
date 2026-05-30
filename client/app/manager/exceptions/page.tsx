'use client';

import MultiConditionFilter, { FilterCondition, FilterValues } from '@/components/filters/MultiConditionFilter';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/tables/DataTable';
import Timeline from '@/components/timeline/Timeline';
import { api } from '@/services/api';
import { Exception, PaginatedResponse, TimelineEvent } from '@/types';
import {
    formatDateTime,
    getExceptionStatusColor,
    getExceptionStatusLabel,
    getExceptionTypeLabel,
} from '@/utils/format';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    MessageSquare,
    Plus,
    User,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const filterConditions: FilterCondition[] = [
  { key: 'member_name_like', label: '会员姓名', type: 'text' },
  {
    key: 'type',
    label: '异常类型',
    type: 'select',
    options: [
      { label: '账单争议', value: 'billing_dispute' },
      { label: '器材损坏', value: 'equipment_damage' },
      { label: '预约错误', value: 'booking_error' },
      { label: '服务投诉', value: 'service_complaint' },
      { label: '其他', value: 'other' },
    ],
  },
  {
    key: 'status',
    label: '处理状态',
    type: 'select',
    options: [
      { label: '待处理', value: 'pending' },
      { label: '处理中', value: 'processing' },
      { label: '已解决', value: 'resolved' },
      { label: '已关闭', value: 'closed' },
    ],
  },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
  {
    key: 'created_by',
    label: '创建人',
    type: 'select',
    options: [
      { label: '张经理', value: '1' },
      { label: '赵前台', value: '4' },
    ],
  },
];

export default function ExceptionsPage() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [exceptions, setExceptions] = useState<PaginatedResponse<Exception & { member_name?: string; creator_name: string; handler_name?: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedException, setSelectedException] = useState<(Exception & { member_name?: string; creator_name: string; handler_name?: string }) | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processStatus, setProcessStatus] = useState<'processing' | 'resolved' | 'closed'>('processing');
  const [processResult, setProcessResult] = useState('');

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const res = await api.get<PaginatedResponse<Exception & { member_name?: string; creator_name: string; handler_name?: string }>>(
        `/exceptions?${params.toString()}`
      );
      if (res.success) {
        setExceptions(res.data || null);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExceptions();
  }, []);

  const handleSearch = () => loadExceptions();
  const handleReset = () => {
    setFilters({});
    loadExceptions();
  };

  const handleViewDetail = async (exception: Exception & { member_name?: string; creator_name: string; handler_name?: string }) => {
    setSelectedException(exception);
    if (exception.member_id) {
      const res = await api.get<TimelineEvent[]>(`/members/${exception.member_id}/timeline`);
      if (res.success) {
        setTimeline(res.data || []);
      }
    }
  };

  const handleProcess = async () => {
    if (!selectedException || !processResult.trim()) {
      alert('请填写处理结果');
      return;
    }

    try {
      await api.put(`/exceptions/${selectedException.id}/process`, {
        status: processStatus,
        handling_result: processResult,
      });
      alert('处理成功，操作已记录');
      setShowProcessModal(false);
      setProcessResult('');
      loadExceptions();
    } catch (e: any) {
      alert(e.response?.data?.message || '处理失败');
    }
  };

  const handleCreateException = async () => {
    const title = prompt('请输入异常标题：');
    if (!title) return;

    const description = prompt('请输入异常描述：');
    if (!description) return;

    try {
      await api.post('/exceptions', {
        type: 'other',
        title,
        description,
      });
      alert('创建成功');
      loadExceptions();
    } catch (e: any) {
      alert(e.response?.data?.message || '创建失败');
    }
  };

  const columns: Column<Exception & { member_name?: string; creator_name: string; handler_name?: string }>[] = [
    {
      key: 'id',
      title: '工单号',
      width: '100px',
      render: (row) => <span className="font-mono">#{row.id.toString().padStart(6, '0')}</span>,
    },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (row) => (
        <span className={`badge ${
          row.type === 'billing_dispute' ? 'bg-blue-100 text-blue-800' :
          row.type === 'equipment_damage' ? 'bg-red-100 text-red-800' :
          row.type === 'booking_error' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {getExceptionTypeLabel(row.type)}
        </span>
      ),
    },
    { key: 'title', title: '标题', sortable: true, render: (row) => <span className="font-medium">{row.title}</span> },
    { key: 'member_name', title: '关联会员', sortable: true },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      render: (row) => <span className={`badge ${getExceptionStatusColor(row.status)}`}>{getExceptionStatusLabel(row.status)}</span>,
    },
    { key: 'creator_name', title: '创建人', width: '100px' },
    { key: 'created_at', title: '创建时间', sortable: true, render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      align: 'center',
      fixed: 'right',
      render: (row) => (
        <button
          onClick={() => handleViewDetail(row)}
          className="text-primary-600 hover:text-primary-800 text-sm flex items-center gap-1 mx-auto"
        >
          <Eye size={16} />
          处理
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">异常工单处理</h2>
          <button onClick={handleCreateException} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            新建工单
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 mb-1">待处理</p>
                <p className="text-3xl font-bold text-yellow-700">2</p>
              </div>
              <Clock size={28} className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">处理中</p>
                <p className="text-3xl font-bold text-blue-700">1</p>
              </div>
              <MessageSquare size={28} className="text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">已解决</p>
                <p className="text-3xl font-bold text-green-700">1</p>
              </div>
              <CheckCircle size={28} className="text-green-500" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 mb-1">已关闭</p>
                <p className="text-3xl font-bold text-gray-700">0</p>
              </div>
              <XCircle size={28} className="text-gray-500" />
            </div>
          </div>
        </div>

        <MultiConditionFilter
          conditions={filterConditions}
          value={filters}
          onChange={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <DataTable
              columns={columns}
              data={exceptions?.items || []}
              loading={loading}
              pagination={exceptions || undefined}
              onPageChange={(page) => {
                setFilters((f) => ({ ...f, page }));
                setTimeout(loadExceptions, 0);
              }}
              onPageSizeChange={(pageSize) => {
                setFilters((f) => ({ ...f, pageSize }));
                setTimeout(loadExceptions, 0);
              }}
              highlightRows={(row) => row.status === 'pending' || row.status === 'processing'}
              onRowClick={(row) => handleViewDetail(row)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            {selectedException ? (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={20} className="text-yellow-500" />
                      <h3 className="font-semibold text-lg">{selectedException.title}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} /> {selectedException.creator_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {formatDateTime(selectedException.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${getExceptionStatusColor(selectedException.status)}`}>
                    {getExceptionStatusLabel(selectedException.status)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">问题描述</h4>
                  <p className="text-gray-600">{selectedException.description}</p>
                </div>

                {selectedException.handling_result && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-green-700 mb-2">处理结果</h4>
                    <p className="text-green-600">{selectedException.handling_result}</p>
                    {selectedException.handled_at && (
                      <p className="text-xs text-green-500 mt-2">
                        处理人：{selectedException.handler_name} · {formatDateTime(selectedException.handled_at)}
                      </p>
                    )}
                  </div>
                )}

                {(selectedException.status === 'pending' || selectedException.status === 'processing') && (
                  <button
                    onClick={() => setShowProcessModal(true)}
                    className="w-full btn-primary mb-6"
                  >
                    处理工单
                  </button>
                )}

                {selectedException.member_id && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">会员全链路时间线</h4>
                    <div className="max-h-96 overflow-y-auto pr-2">
                      <Timeline events={timeline} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <AlertTriangle size={48} className="mb-3" />
                <p>请选择左侧工单查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProcessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">处理工单</h3>
            <div className="space-y-4">
              <div>
                <label className="label">处理状态</label>
                <select
                  value={processStatus}
                  onChange={(e) => setProcessStatus(e.target.value as any)}
                  className="input-field"
                >
                  <option value="processing">处理中</option>
                  <option value="resolved">已解决</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>
              <div>
                <label className="label">处理结果</label>
                <textarea
                  value={processResult}
                  onChange={(e) => setProcessResult(e.target.value)}
                  placeholder="请详细描述处理结果..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowProcessModal(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleProcess} className="btn-primary">
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
