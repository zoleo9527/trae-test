import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Clock, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { getAllSubsidies } from '@/services/subsidy.service';
import { useAppStore } from '@/store/app.store';
import {
  getSubsidyTypeLabel,
  getSubsidyStatusLabel,
  getSubsidyStatusVariant,
} from '@/utils/labels';
import type { UserRole, SubsidyType, SubsidyStatus } from '@/types';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

const typeOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'merchant_delay', label: '商家出餐慢' },
  { value: 'weather', label: '恶劣天气' },
  { value: 'traffic', label: '交通异常' },
  { value: 'address', label: '地址错误' },
  { value: 'other', label: '其他' },
];

const rolePageConfig: Record<UserRole, { title: string; description: string }> = {
  manager: { title: '补贴管理', description: '审核所有补贴申请，保障骑手权益' },
  dispatcher: { title: '补贴审核', description: '审核骑手补贴申请，确认补贴金额' },
  customer_service: { title: '补贴查询', description: '查询补贴记录，协助用户咨询' },
};

export function SubsidiesPage() {
  const navigate = useNavigate();
  const { pendingCounts, userRole } = useAppStore();

  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    type: 'all',
  });
  const [searchValue, setSearchValue] = useState('');

  const allSubsidies = useMemo(() => getAllSubsidies(), []);

  const filteredSubsidies = useMemo(() => {
    return allSubsidies.filter(subsidy => {
      if (userRole === 'dispatcher' && subsidy.status !== 'pending') {
        return false;
      }
      if (filters.status !== 'all' && subsidy.status !== filters.status) return false;
      if (filters.type !== 'all' && subsidy.type !== filters.type) return false;
      if (searchValue) {
        const lowerSearch = searchValue.toLowerCase();
        return subsidy.orderId.toLowerCase().includes(lowerSearch) ||
          subsidy.riderName.toLowerCase().includes(lowerSearch) ||
          subsidy.reason.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  }, [allSubsidies, filters, searchValue, userRole]);

  const totalAmount = useMemo(() => {
    return filteredSubsidies
      .filter(s => s.status === 'approved')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [filteredSubsidies]);

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
          <Tag variant="success" size="md">
            <Clock className="w-3 h-3 mr-1" />
            待审核 {pendingCounts.subsidies} 条
          </Tag>
          <Tag variant="primary" size="md">
            累计已发放 ¥{totalAmount.toFixed(2)}
          </Tag>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: '审核状态', options: statusOptions },
          { key: 'type', label: '补贴类型', options: typeOptions },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="搜索订单号、骑手、补贴原因"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">补贴列表（共 {filteredSubsidies.length} 条）</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          {filteredSubsidies.length === 0 ? (
            <div className="p-12 text-center">
              <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无补贴数据</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSubsidies.map(subsidy => (
                <div
                  key={subsidy.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${subsidy.orderId}/process`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Coins className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-primary-700 font-medium">{subsidy.orderId}</span>
                          <Tag variant="success" size="sm">{getSubsidyTypeLabel(subsidy.type as SubsidyType)}</Tag>
                          <StatusBadge
                            status={subsidy.status}
                            label={getSubsidyStatusLabel(subsidy.status as SubsidyStatus)}
                            variant={getSubsidyStatusVariant(subsidy.status as SubsidyStatus)}
                          />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-lg font-bold text-green-600">¥{subsidy.amount.toFixed(2)}</span>
                          <span className="text-sm text-gray-500">{subsidy.reason}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {subsidy.riderName}
                          </span>
                          <span>申请时间：{new Date(subsidy.createdAt).toLocaleString('zh-CN')}</span>
                          {subsidy.notes && (
                            <span className="text-gray-400 truncate max-w-xs">备注：{subsidy.notes}</span>
                          )}
                        </div>
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
