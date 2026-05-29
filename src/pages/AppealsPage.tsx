import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { getAllAppeals } from '@/services/appeal.service';
import { useAppStore } from '@/store/app.store';
import {
  getAppealTypeLabel,
  getAppealStatusLabel,
  getAppealStatusVariant,
} from '@/utils/labels';
import type { UserRole } from '@/types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'rejected', label: '已驳回' },
];

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'timeout', label: '超时' },
  { value: 'wrong_item', label: '错送漏送' },
  { value: 'damage', label: '物品损坏' },
  { value: 'rude', label: '服务态度' },
  { value: 'refund', label: '退款申请' },
  { value: 'other', label: '其他' },
];

const rolePageConfig: Record<UserRole, { title: string; description: string }> = {
  manager: { title: '申诉管理', description: '查看所有申诉，监控处理进度' },
  dispatcher: { title: '申诉查询', description: '查询申诉记录，协助客服处理' },
  customer_service: { title: '申诉处理', description: '处理用户申诉，判定责任归属' },
};

export function AppealsPage() {
  const navigate = useNavigate();
  const { pendingCounts, userRole } = useAppStore();

  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    type: 'all',
  });
  const [searchValue, setSearchValue] = useState('');

  const allAppeals = useMemo(() => getAllAppeals(), []);

  const filteredAppeals = useMemo(() => {
    return allAppeals.filter(appeal => {
      if (userRole === 'customer_service' && appeal.status !== 'pending' && appeal.status !== 'processing') {
        return false;
      }
      if (filters.status !== 'all' && appeal.status !== filters.status) return false;
      if (filters.type !== 'all' && appeal.type !== filters.type) return false;
      if (searchValue) {
        const lowerSearch = searchValue.toLowerCase();
        return appeal.orderId.toLowerCase().includes(lowerSearch) ||
          appeal.reason.toLowerCase().includes(lowerSearch) ||
          appeal.userId.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  }, [allAppeals, filters, searchValue, userRole]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: 'all', type: 'all' });
    setSearchValue('');
  };

  const pageConfig = userRole ? rolePageConfig[userRole] : rolePageConfig.manager;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageConfig.title}</h1>
          <p className="text-gray-500 mt-1">{pageConfig.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Tag variant="warning" size="md">
            <Clock className="w-3 h-3 mr-1" />
            待处理 {pendingCounts.appeals} 条
          </Tag>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: '处理状态', options: statusOptions },
          { key: 'type', label: '申诉类型', options: typeOptions },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="搜索订单号、申诉原因"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">申诉列表（共 {filteredAppeals.length} 条）</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          {filteredAppeals.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无申诉数据</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAppeals.map(appeal => (
                <div
                  key={appeal.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${appeal.orderId}/process`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-primary-700 font-medium">{appeal.orderId}</span>
                          <Tag variant="warning" size="sm">{getAppealTypeLabel(appeal.type)}</Tag>
                          <StatusBadge
                            status={appeal.status}
                            label={getAppealStatusLabel(appeal.status)}
                            variant={getAppealStatusVariant(appeal.status)}
                          />
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{appeal.reason}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {appeal.userName}
                          </span>
                          <span>提交时间：{new Date(appeal.createdAt).toLocaleString('zh-CN')}</span>
                          {appeal.description && (
                            <span className="text-gray-400 truncate max-w-xs">描述：{appeal.description}</span>
                          )}
                        </div>
                        {appeal.images && appeal.images.length > 0 && (
                          <div className="mt-2 flex gap-2">
                            {appeal.images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt=""
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            ))}
                            {appeal.images.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                                +{appeal.images.length - 3} 张
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      处理
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
