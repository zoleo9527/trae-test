'use client';

import MultiConditionFilter, { FilterCondition, FilterValues } from '@/components/filters/MultiConditionFilter';
import AppLayout from '@/components/layout/AppLayout';
import DataTable, { Column } from '@/components/tables/DataTable';
import { api } from '@/services/api';
import { AuditLog, PaginatedResponse } from '@/types';
import { formatDateTime } from '@/utils/format';
import { Eye, History, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const filterConditions: FilterCondition[] = [
  {
    key: 'user_id',
    label: '操作人',
    type: 'select',
    options: [
      { label: '张经理', value: '1' },
      { label: '李教练', value: '2' },
      { label: '王教练', value: '3' },
      { label: '赵前台', value: '4' },
      { label: '钱前台', value: '5' },
    ],
  },
  {
    key: 'module',
    label: '操作模块',
    type: 'select',
    options: [
      { label: '认证', value: 'auth' },
      { label: '会员', value: 'member' },
      { label: '储值', value: 'wallet' },
      { label: '预约', value: 'booking' },
      { label: '器材', value: 'equipment' },
      { label: '对账', value: 'reconciliation' },
      { label: '异常', value: 'exception' },
      { label: '配置', value: 'config' },
    ],
  },
  {
    key: 'action',
    label: '操作类型',
    type: 'select',
    options: [
      { label: '创建', value: 'create' },
      { label: '更新', value: 'update' },
      { label: '删除', value: 'delete' },
      { label: '登录', value: 'login' },
      { label: '登出', value: 'logout' },
      { label: '充值', value: 'recharge' },
      { label: '扣减', value: 'deduct' },
      { label: '审核', value: 'approve' },
      { label: '调账', value: 'adjust' },
    ],
  },
  {
    key: 'target_type',
    label: '操作对象',
    type: 'select',
    options: [
      { label: '用户', value: 'user' },
      { label: '会员', value: 'member' },
      { label: '交易记录', value: 'wallet_transaction' },
      { label: '预约', value: 'booking' },
      { label: '器材记录', value: 'equipment_record' },
      { label: '对账单', value: 'reconciliation' },
      { label: '异常工单', value: 'exception' },
      { label: '系统配置', value: 'config' },
    ],
  },
  { key: 'created_at', label: '操作时间', type: 'dateRange' },
];

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<FilterValues>({});
  const [logs, setLogs] = useState<PaginatedResponse<AuditLog & { user_name: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<(AuditLog & { user_name: string }) | null>(null);

  const loadLogs = async () => {
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

      const res = await api.get<PaginatedResponse<AuditLog & { user_name: string }>>(
        `/audit-logs?${params.toString()}`
      );
      if (res.success) {
        setLogs(res.data || null);
      }
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSearch = () => loadLogs();
  const handleReset = () => {
    setFilters({});
    loadLogs();
  };

  const parseJson = (str: string | null) => {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const getModuleLabel = (module: string) => {
    const labels: Record<string, string> = {
      auth: '认证',
      member: '会员',
      wallet: '储值',
      booking: '预约',
      equipment: '器材',
      reconciliation: '对账',
      exception: '异常',
      config: '配置',
    };
    return labels[module] || module;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      login: '登录',
      logout: '登出',
      recharge: '充值',
      deduct: '扣减',
      approve: '审核',
      adjust: '调账',
      checkin: '签到',
      complete: '完成',
      borrow: '借出',
      return: '归还',
      process: '处理',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (['delete', 'logout'].includes(action)) return 'text-red-600';
    if (['create', 'recharge', 'login'].includes(action)) return 'text-green-600';
    if (['update', 'adjust', 'process', 'checkin', 'complete', 'borrow', 'return'].includes(action)) return 'text-blue-600';
    if (['approve'].includes(action)) return 'text-purple-600';
    return 'text-gray-600';
  };

  const columns: Column<AuditLog & { user_name: string }>[] = [
    {
      key: 'id',
      title: '日志ID',
      width: '90px',
      render: (row) => <span className="font-mono text-xs">#{row.id}</span>,
    },
    {
      key: 'module',
      title: '模块',
      width: '80px',
      render: (row) => <span className="badge bg-gray-100 text-gray-800">{getModuleLabel(row.module)}</span>,
    },
    {
      key: 'action',
      title: '操作',
      width: '80px',
      render: (row) => <span className={`font-medium ${getActionColor(row.action)}`}>{getActionLabel(row.action)}</span>,
    },
    { key: 'target_type', title: '对象类型', width: '120px' },
    { key: 'target_id', title: '对象ID', width: '80px' },
    { key: 'user_name', title: '操作人', width: '100px' },
    { key: 'ip_address', title: 'IP地址', width: '120px' },
    { key: 'created_at', title: '操作时间', sortable: true, width: '160px', render: (row) => formatDateTime(row.created_at) },
    {
      key: 'actions',
      title: '详情',
      width: '80px',
      align: 'center',
      fixed: 'right',
      render: (row) => (
        <button
          onClick={() => setSelectedLog(row)}
          className="text-primary-600 hover:text-primary-800 p-1"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <History size={24} className="text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-800">操作日志审计</h2>
        </div>
        <p className="text-gray-500 text-sm">
          记录系统所有关键操作，支持按操作人、模块、类型、时间多维度筛选回查
        </p>

        <MultiConditionFilter
          conditions={filterConditions}
          value={filters}
          onChange={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable
              columns={columns}
              data={logs?.items || []}
              loading={loading}
              pagination={logs || undefined}
              onPageChange={(page) => {
                setFilters((f) => ({ ...f, page }));
                setTimeout(loadLogs, 0);
              }}
              onPageSizeChange={(pageSize) => {
                setFilters((f) => ({ ...f, pageSize }));
                setTimeout(loadLogs, 0);
              }}
              onRowClick={(row) => setSelectedLog(row)}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            {selectedLog ? (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Eye size={20} className="text-primary-600" />
                  操作详情
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">日志ID</p>
                      <p className="font-mono font-medium">#{selectedLog.id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">操作时间</p>
                      <p className="text-sm">{formatDateTime(selectedLog.created_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">操作模块</p>
                      <p className="font-medium">{getModuleLabel(selectedLog.module)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">操作类型</p>
                      <p className={`font-medium ${getActionColor(selectedLog.action)}`}>
                        {getActionLabel(selectedLog.action)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">操作人</p>
                    <p className="font-medium flex items-center gap-2">
                      <User size={16} />
                      {selectedLog.user_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">IP: {selectedLog.ip_address || 'unknown'}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-2">操作对象</p>
                    <p className="text-sm">
                      类型: <span className="font-medium">{selectedLog.target_type}</span>
                      <br />
                      ID: <span className="font-mono font-medium">{selectedLog.target_id}</span>
                    </p>
                  </div>

                  {selectedLog.old_value && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-600 mb-2 font-medium">变更前数据</p>
                      <pre className="text-xs text-red-700 bg-white p-2 rounded overflow-x-auto">
                        {JSON.stringify(parseJson(selectedLog.old_value), null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.new_value && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-600 mb-2 font-medium">变更后数据</p>
                      <pre className="text-xs text-green-700 bg-white p-2 rounded overflow-x-auto">
                        {JSON.stringify(parseJson(selectedLog.new_value), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Eye size={48} className="mb-3" />
                <p>请选择左侧日志查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
