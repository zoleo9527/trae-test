import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Tag } from '@/components/common/Tag';
import { Button } from '@/components/common/Button';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { getAllAssessments } from '@/services/assessment.service';
import { useAppStore } from '@/store/app.store';
import {
  getAssessmentTypeLabel,
  getAssessmentStatusLabel,
  getAssessmentStatusVariant,
  getSeverityLabel,
  getResponsiblePartyLabel,
} from '@/utils/labels';
import type { UserRole, AssessmentType, AssessmentStatus } from '@/types';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_approval', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'appealed', label: '已申诉' },
];

const typeOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部类型' },
  { value: 'timeout', label: '配送超时' },
  { value: 'complaint', label: '用户投诉' },
  { value: 'violation', label: '违规操作' },
  { value: 'service_issue', label: '服务问题' },
];

const rolePageConfig: Record<UserRole, { title: string; description: string }> = {
  manager: { title: '考核管理', description: '审核考核记录，执行考核规则' },
  dispatcher: { title: '考核发起', description: '发起骑手考核，记录违规行为' },
  customer_service: { title: '考核查询', description: '查询考核记录，了解骑手情况' },
};

export function AssessmentsPage() {
  const navigate = useNavigate();
  const { pendingCounts, userRole } = useAppStore();

  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'all',
    type: 'all',
  });
  const [searchValue, setSearchValue] = useState('');

  const allAssessments = useMemo(() => getAllAssessments(), []);

  const filteredAssessments = useMemo(() => {
    return allAssessments.filter(assessment => {
      if (userRole === 'dispatcher' && assessment.status === 'approved') {
        return false;
      }
      if (filters.status !== 'all' && assessment.status !== filters.status) return false;
      if (filters.type !== 'all' && assessment.type !== filters.type) return false;
      if (searchValue) {
        const lowerSearch = searchValue.toLowerCase();
        return assessment.orderId.toLowerCase().includes(lowerSearch) ||
          assessment.riderName.toLowerCase().includes(lowerSearch) ||
          assessment.createdBy.toLowerCase().includes(lowerSearch);
      }
      return true;
    });
  }, [allAssessments, filters, searchValue, userRole]);

  const totalDeducted = useMemo(() => {
    return filteredAssessments
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + a.scoreDeducted, 0);
  }, [filteredAssessments]);

  const totalFined = useMemo(() => {
    return filteredAssessments
      .filter(a => a.status === 'approved')
      .reduce((sum, a) => sum + (a.fineAmount || 0), 0);
  }, [filteredAssessments]);

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
          <Tag variant="danger" size="md">
            <Clock className="w-3 h-3 mr-1" />
            待审核 {pendingCounts.assessments} 条
          </Tag>
          <Tag variant="warning" size="md">
            累计扣分 {totalDeducted} 分
          </Tag>
          <Tag variant="danger" size="md">
            累计罚款 ¥{totalFined.toFixed(2)}
          </Tag>
        </div>
      </div>

      <FilterBar
        filters={[
          { key: 'status', label: '审核状态', options: statusOptions },
          { key: 'type', label: '违规类型', options: typeOptions },
        ]}
        selectedFilters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        searchPlaceholder="搜索订单号、骑手、处理人"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">考核列表（共 {filteredAssessments.length} 条）</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          {filteredAssessments.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无考核数据</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredAssessments.map(assessment => (
                <div
                  key={assessment.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/orders/${assessment.orderId}/process`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <ClipboardCheck className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-primary-700 font-medium">{assessment.orderId}</span>
                          <Tag variant="danger" size="sm">{getAssessmentTypeLabel(assessment.type as AssessmentType)}</Tag>
                          <Tag variant="warning" size="sm">{getSeverityLabel(assessment.severity)}</Tag>
                          <StatusBadge
                            status={assessment.status}
                            label={getAssessmentStatusLabel(assessment.status as AssessmentStatus)}
                            variant={getAssessmentStatusVariant(assessment.status as AssessmentStatus)}
                          />
                          {assessment.requiresTraining && (
                            <Tag variant="info" size="sm">需培训</Tag>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-lg font-bold text-red-600">
                            -{assessment.scoreDeducted} 分</span>
                          {assessment.fineAmount > 0 && (
                            <span className="text-lg font-bold text-red-600">
                              罚款 ¥{assessment.fineAmount.toFixed(2)}</span>
                          )}
                          <span className="text-sm text-gray-500">
                            责任方：{getResponsiblePartyLabel(assessment.responsibleParty)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            骑手：{assessment.riderName}
                          </span>
                          <span>处理人：{assessment.createdBy}</span>
                          <span>创建时间：{new Date(assessment.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        {assessment.notes && (
                          <p className="text-sm text-gray-600 mt-2">{assessment.notes}</p>
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
