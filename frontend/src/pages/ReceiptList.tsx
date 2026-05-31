import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, FileCheck, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useRole } from '@/hooks/useRole';
import { useFilteredData } from '@/hooks/useFilteredData';
import type { ReceiptStatus } from '@/types';

export function ReceiptList() {
  const { state } = useApp();
  const { receipts } = useFilteredData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canSignReceipt, canVerifyReceipt } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus | 'all'>('all');

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter && filter !== 'all') {
      setStatusFilter(filter as ReceiptStatus);
    }
  }, [searchParams]);

  const getShippingInfo = (shippingId: string) => {
    return state.shippingOrders.find(s => s.id === shippingId);
  };

  const filteredReceipts = receipts.filter(receipt => {
    const shipping = getShippingInfo(receipt.shippingId);
    const matchesSearch = shipping?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipping?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: receipts.length,
    pending: receipts.filter(r => r.status === 'pending').length,
    signed: receipts.filter(r => r.status === 'signed').length,
    has_difference: receipts.filter(r => r.status === 'has_difference').length,
    verified: receipts.filter(r => r.status === 'verified').length,
    disputed: receipts.filter(r => r.status === 'disputed').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">回单核验</h1>
        <p className="text-sm text-gray-500 mt-1">材料回单签收、差异处理与核验</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as ReceiptStatus | 'all')}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              statusFilter === status
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? '全部' :
             status === 'pending' ? '待签收' :
             status === 'signed' ? '已签收' :
             status === 'has_difference' ? '有差异' :
             status === 'verified' ? '已核验' :
             status === 'disputed' ? '有争议' : status}
            <span className="ml-1.5 text-gray-400">({count})</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索对应发货单号..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                对应发货单
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                材料名称
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                差异
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                签收时间
              </th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReceipts.map((receipt) => {
              const shipping = getShippingInfo(receipt.shippingId);
              return (
                <tr
                  key={receipt.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/receipt/${receipt.id}`)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{shipping?.code}</div>
                        <div className="text-xs text-gray-500">{shipping?.title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700">
                      {shipping?.materialItems.map(m => m.name).join(', ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={receipt.status} type="receipt" />
                  </td>
                  <td className="px-5 py-4">
                    {receipt.differences.length > 0 ? (
                      <div className="flex items-center gap-1 text-danger-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{receipt.differences.length} 项差异</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-success-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">无差异</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-500">
                      {receipt.signedAt
                        ? new Date(receipt.signedAt).toLocaleDateString()
                        : '-'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {receipt.status === 'pending' && canSignReceipt && (
                        <button className="btn-primary text-xs py-1.5">
                          签收
                        </button>
                      )}
                      {receipt.status === 'signed' && canVerifyReceipt && (
                        <button className="btn-success text-xs py-1.5">
                          核验
                        </button>
                      )}
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        详情
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredReceipts.length === 0 && (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">暂无回单数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
