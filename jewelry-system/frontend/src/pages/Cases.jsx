import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Eye,
  Edit,
  MoreHorizontal,
  Flag,
  MapPin
} from 'lucide-react';
import { visaCases } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const today = new Date('2024-01-26');

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'pending_supplement', label: '待补件' },
  { value: 'under_review', label: '审核中' },
  { value: 'rejected', label: '已驳回' },
  { value: 'approved', label: '已通过' },
  { value: 'overdue', label: '已逾期' },
  { value: 'urgent', label: '紧急' }
];

export default function Cases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('filter') || 'all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const filteredCases = visaCases.filter(c => {
    const matchesSearch = c.studentName.includes(searchTerm) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.university.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = ['pending_supplement', 'processing', 'in_progress', 'under_review'].includes(c.status);
    } else if (statusFilter === 'urgent') {
      const deadline = new Date(c.deadline);
      matchesStatus = differenceInDays(deadline, today) <= 7 && c.status !== 'approved';
    } else if (statusFilter !== 'all') {
      matchesStatus = c.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名、案件编号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>{statusFilters.find(f => f.value === statusFilter)?.label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {statusFilters.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      statusFilter === option.value ? 'bg-primary-50 text-primary-700 font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新建案件
        </button>
      </div>

      <div className="card overflow-hidden">
        {filteredCases.length === 0 ? (
          <EmptyState
            icon="search"
            title="未找到匹配的案件"
            description="尝试调整搜索条件或筛选器"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">案件信息</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目的地</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负责人</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">进度</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">截止日期</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">优先级</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCases.map((c) => {
                  const daysLeft = differenceInDays(new Date(c.deadline), today);
                  const isOverdue = daysLeft < 0;
                  
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium text-sm">
                              {c.studentName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.studentName}</p>
                            <p className="text-sm text-gray-500">{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{c.country}</p>
                            <p className="text-xs text-gray-500">{c.university}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">{c.consultant}</p>
                          <p className="text-gray-500">{c.visaAssistant}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>进度</span>
                            <span>{c.currentStep}/{c.totalSteps}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${(c.currentStep / c.totalSteps) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={isOverdue ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-gray-600'}>
                          <p className="text-sm font-medium">
                            {format(new Date(c.deadline), 'yyyy-MM-dd')}
                          </p>
                          <p className="text-xs">
                            {isOverdue ? `已逾期 ${Math.abs(daysLeft)} 天` : `剩余 ${daysLeft} 天`}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Flag className={`w-5 h-5 ${priorityColors[c.priority]}`} />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.status} text={c.statusText} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/cases/${c.id}`}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
