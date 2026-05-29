import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Clock, User, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { getAllTrainings } from '@/services/training.service';
import { useAppStore } from '@/store/app.store';
import {
  getTrainingTypeLabel,
  getTrainingStatusLabel,
  getTrainingStatusVariant,
} from '@/utils/labels';
import type { UserRole, TrainingType, TrainingStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待学习' },
  { value: 'in_progress', label: '学习中' },
  { value: 'completed', label: '已完成' },
  { value: 'expired', label: '已过期' },
];

const typeOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'mandatory', label: '强制培训' },
  { value: 'remedial', label: '强化培训' },
  { value: 'optional', label: '选修培训' },
];

const rolePageConfig: Record<UserRole, { title: string; description: string }> = {
  manager: { title: '培训管理', description: '查看所有培训，跟踪骑手学习进度' },
  dispatcher: { title: '培训跟踪', description: '跟踪骑手培训完成情况' },
  customer_service: { title: '培训查询', description: '查询培训记录，了解骑手情况' },
};

export function TrainingPage() {
  const navigate = useNavigate();
  const { pendingCounts, userRole } = useAppStore();

  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    type: 'all',
  });
  const [searchValue, setSearchValue] = useState('');

  const allTrainings = useMemo(() => getAllTrainings(), []);

  const filteredTrainings = useMemo(() => {
    return allTrainings.filter(training => {
      if (filters.status !== 'all' && training.status !== filters.status) return false;
      if (filters.type !== 'all' && training.type !== filters.type) return false;
      if (searchValue) {
        const lowerSearch = searchValue.toLowerCase();
        return training.title.toLowerCase().includes(lowerSearch) ||
          training.riderName.toLowerCase().includes(lowerSearch) ||
          (training.orderId && training.orderId.toLowerCase().includes(lowerSearch));
      }
      return true;
    });
  }, [allTrainings, filters, searchValue]);

  const overdueTrainings = useMemo(() => {
    return filteredTrainings.filter(t => 
      (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')).length;
  }, [filteredTrainings]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: 'all', type: 'all' });
    setSearchValue('');
  };

  const isOverdue = (training: any) => {
    return training.dueDate && new Date(training.dueDate) < new Date() && training.status !== 'completed';
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
          <Tag variant="info" size="md">
            <Clock className="w-3 h-3 mr-1" />
            待学习 {pendingCounts.trainings} 条
          </Tag>
          {overdueTrainings > 0 && (
            <Tag variant="danger" size="md">
              <AlertCircle className="w-3 h-3 mr-1" />
              已过期 {overdueTrainings} 条
            </Tag>
          )}
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: '学习状态', options: statusOptions },
          { key: 'type', label: '培训类型', options: typeOptions },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="搜索培训标题、骑手、订单号"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">培训列表（共 {filteredTrainings.length} 条）</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          {filteredTrainings.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无培训数据</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTrainings.map(training => (
                <div
                  key={training.id}
                  className={cn(
                    'p-4 hover:bg-gray-50 transition-colors cursor-pointer',
                    isOverdue(training) && 'bg-red-50/50'
                  )}
                  onClick={() => training.orderId && navigate(`/orders/${training.orderId}/process`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{training.title}</span>
                          <Tag variant="info" size="sm">{getTrainingTypeLabel(training.type as TrainingType)}</Tag>
                          <StatusBadge
                            status={training.status}
                            label={getTrainingStatusLabel(training.status as TrainingStatus)}
                            variant={getTrainingStatusVariant(training.status as TrainingStatus)}
                          />
                          {isOverdue(training) && (
                            <Tag variant="danger" size="sm">已逾期</Tag>
                          )}
                          {training.score !== undefined && (
                            <Tag variant="success" size="sm">
                              得分 {training.score} 分
                            </Tag>
                          )}
                        </div>
                        {training.description && (
                          <p className="text-sm text-gray-600 mb-2">{training.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {training.riderName}
                          </span>
                          {training.orderId && (
                            <span className="font-mono">订单：{training.orderId}</span>
                          )}
                          {training.dueDate && (
                            <span className={isOverdue(training) ? 'text-red-600 font-medium' : ''}>
                              截止：{new Date(training.dueDate).toLocaleDateString('zh-CN')}
                            </span>
                          )}
                          {training.completedAt && (
                            <span>完成时间：{new Date(training.completedAt).toLocaleDateString('zh-CN')}</span>
                          )}
                        </div>
                        {training.content && (
                          <div className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-600">
                            <span className="font-medium text-gray-700">培训内容：</span>
                            {training.content.substring(0, 100)}...
                          </div>
                        )}
                      </div>
                    </div>
                    {training.orderId && (
                      <Button variant="ghost" size="sm">
                        查看
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
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
