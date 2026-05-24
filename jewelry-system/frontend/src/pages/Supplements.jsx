import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Upload,
  Check,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Send,
  Filter,
  ChevronDown,
  Search,
  RefreshCw
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';

export default function Supplements() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [supplements, setSupplements] = useState([]);
  const [loading, setLoading] = useState(true);

  const filterOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'required', label: '待提交' },
    { value: 'under_review', label: '审核中' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' }
  ];

  const loadSupplements = async () => {
    setLoading(true);
    try {
      const res = await api.getSupplements();
      setSupplements(res.data || []);
    } catch (err) {
      toast.error(`加载补件数据失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplements();
  }, []);

  const filteredSupplements = supplements.filter(s => {
    const matchesSearch = s.studentName?.includes(searchTerm) || 
                          s.name?.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: supplements.length,
    required: supplements.filter(s => s.status === 'required').length,
    underReview: supplements.filter(s => s.status === 'under_review').length,
    approved: supplements.filter(s => s.status === 'approved').length
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'required':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'under_review':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState text="正在加载补件数据..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">补件回查</h2>
        <button 
          onClick={loadSupplements}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">补件总数</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">待提交</p>
          <p className="text-2xl font-bold text-amber-600">{stats.required}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">审核中</p>
          <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500 mb-1">已通过</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索学生或材料名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>{filterOptions.find(f => f.value === filterStatus)?.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilterDropdown && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setFilterStatus(option.value);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                    filterStatus === option.value ? 'bg-primary-50 text-primary-700 font-medium' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        {filteredSupplements.length === 0 ? (
          <EmptyState
            icon="noData"
            title="暂无补件记录"
            description="所有材料都已通过审核"
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSupplements.map((supplement) => (
              <div key={`${supplement.caseId}-${supplement.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(supplement.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-medium text-gray-900">{supplement.name}</h4>
                      <StatusBadge 
                        status={supplement.status} 
                        text={
                          supplement.status === 'required' ? '待提交' :
                          supplement.status === 'under_review' ? '审核中' :
                          supplement.status === 'approved' ? '已通过' : '已驳回'
                        } 
                      />
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{supplement.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>学生: <Link to={`/cases/${supplement.caseId}`} className="text-primary-600 hover:underline">{supplement.studentName}</Link></span>
                      <span>截止日期: {supplement.requiredDate}</span>
                    </div>
                    
                    {supplement.uploads && supplement.uploads.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {supplement.uploads.map(upload => (
                          <div key={upload.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-white rounded border border-gray-200 flex items-center justify-center">
                                <Eye className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{upload.name}</p>
                                <p className="text-xs text-gray-400">
                                  v{upload.version} · {upload.uploader} · {upload.uploadDate}
                                  {upload.size && ` · ${upload.size}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {upload.status && (
                                <StatusBadge 
                                  status={upload.status} 
                                  text={upload.status === 'reviewing' ? '审核中' : '已驳回'} 
                                />
                              )}
                              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {supplement.status === 'required' || supplement.status === 'rejected' ? (
                      <>
                        <button 
                          onClick={() => navigate(`/cases/${supplement.caseId}`)}
                          className="btn-primary flex items-center gap-2 text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          上传
                        </button>
                        <button className="btn-secondary flex items-center gap-2 text-sm">
                          <Send className="w-4 h-4" />
                          催办
                        </button>
                      </>
                    ) : supplement.status === 'under_review' ? (
                      <button 
                        onClick={() => navigate(`/cases/${supplement.caseId}`)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        查看
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/cases/${supplement.caseId}`)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        下载
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
