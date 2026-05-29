import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { getAllRiders } from '@/services/rider.service';
import { useAppStore } from '@/store/app.store';
import type { UserRole, RiderStatus } from '@/types';

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '在职' },
  { value: 'inactive', label: '离职' },
  { value: 'suspended', label: '停职' },
];

const zoneOptions = [
  { value: 'all', label: '全部区域' },
  { value: '朝阳区', label: '朝阳区' },
  { value: '海淀区', label: '海淀区' },
  { value: '东城区', label: '东城区' },
  { value: '西城区', label: '西城区' },
  { value: '丰台区', label: '丰台区' },
];

const rolePageConfig: Record<UserRole, { title: string; description: string }> = {
  manager: { title: '骑手管理', description: '查看所有骑手档案，跟踪考核与培训记录' },
  dispatcher: { title: '骑手信息', description: '查看责任区域骑手信息，协调配送' },
  customer_service: { title: '骑手信息', description: '查询骑手信息，协助用户沟通' },
};

export function RidersPage() {
  const navigate = useNavigate();
  const { userRole, currentUser } = useAppStore();

  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    zone: 'all',
  });
  const [searchValue, setSearchValue] = useState('');

  const allRiders = useMemo(() => getAllRiders(), []);

  const filteredRiders = useMemo(() => {
    return allRiders.filter(rider => {
      if (filters.status !== 'all' && rider.status !== filters.status) return false;
      if (filters.zone !== 'all' && rider.zone !== filters.zone) return false;
      if (searchValue) {
        const lowerSearch = searchValue.toLowerCase();
        return rider.name.toLowerCase().includes(lowerSearch) ||
          rider.id.toLowerCase().includes(lowerSearch) ||
          rider.phone.includes(searchValue);
      }
      return true;
    });
  }, [allRiders, filters, searchValue]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: 'all', zone: 'all' });
    setSearchValue('');
  };

  const getStatusVariant = (status: RiderStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: RiderStatus) => {
    switch (status) {
      case 'active': return '在职';
      case 'inactive': return '离职';
      case 'suspended': return '停职';
      default: return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const needAttentionCount = useMemo(() => {
    return filteredRiders.filter(r => r.status === 'active' && (r.currentScore < 75 || r.trainingCount.pending > 0 || r.trainingCount.overdue > 0)).length;
  }, [filteredRiders]);

  const pageConfig = userRole ? rolePageConfig[userRole] : rolePageConfig.manager;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageConfig.title}</h1>
          <p className="text-gray-500 mt-1">{pageConfig.description}</p>
        </div>
        {needAttentionCount > 0 && (
          <Tag variant="danger" size="md">
            <AlertTriangle className="w-3 h-3 mr-1" />
            需关注 {needAttentionCount} 人
          </Tag>
        )}
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: '骑手状态', options: statusOptions },
          { key: 'zone', label: '负责区域', options: zoneOptions },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="搜索骑手姓名、工号、手机号"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">骑手列表（共 {filteredRiders.length} 人）</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          {filteredRiders.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无骑手数据</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRiders.map(rider => (
                <div
                  key={rider.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                    rider.currentScore < 75 && rider.status === 'active' && 'bg-amber-50/50'
                  )}
                  onClick={() => navigate(`/riders/${rider.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg">
                        {rider.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{rider.name}</span>
                          <span className="text-sm text-gray-500 font-mono">{rider.id}</span>
                          <Tag variant={getStatusVariant(rider.status)} size="sm">
                            {getStatusLabel(rider.status)}
                          </Tag>
                          {rider.currentScore < 75 && rider.status === 'active' && (
                            <Tag variant="danger" size="sm">需关注</Tag>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {rider.zone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            入职：{new Date(rider.joinDate).toLocaleDateString('zh-CN')}
                          </span>
                          <span>{rider.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className={cn('text-2xl font-bold', getScoreColor(rider.currentScore))}>
                            {rider.currentScore}
                          </p>
                          <p className="text-xs text-gray-500">当前积分</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{rider.totalOrders}</p>
                          <p className="text-xs text-gray-500">累计订单</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-amber-600">{rider.trainingCount.completed}</p>
                          <p className="text-xs text-gray-500">已完成培训</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      查看档案
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
