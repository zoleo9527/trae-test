'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import { 
  Users, 
  Plus, 
  Search, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
  };
  const labels = {
    completed: '已完成',
    pending: '待处理',
    in_progress: '进行中',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const DocStatusBadge = ({ status }) => {
  const styles = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const labels = {
    approved: '已审核',
    pending: '待审核',
    rejected: '被拒绝',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function CrewPage() {
  const [crewChanges, setCrewChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCrewChanges();
  }, [statusFilter]);

  const fetchCrewChanges = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.crew.list(params);
      setCrewChanges(data);
    } catch (err) {
      console.error('Failed to fetch crew changes:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCrew = crewChanges.filter(c => 
    c.crew_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const docIssues = crewChanges.filter(c => c.documents_status === 'rejected' || c.documents_status === 'pending').length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">船员换班</h1>
            <p className="text-gray-500 mt-1">管理船员上下船安排和证件审核</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增换班
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待处理换班</p>
                <p className="text-2xl font-bold text-gray-900">
                  {crewChanges.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">证件问题</p>
                <p className="text-2xl font-bold text-red-600">{docIssues}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-gray-900">
                  {crewChanges.filter(c => c.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索船员姓名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">船员姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">职务</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">国籍</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">关联船舶</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">证件状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCrew.map((crew) => (
                  <tr key={crew.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <span className="font-medium text-gray-900">{crew.crew_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{crew.rank}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{crew.nationality}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        crew.type === 'sign_on' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {crew.type === 'sign_on' ? '上船' : '下船'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{crew.ship_name}</td>
                    <td className="px-6 py-4">
                      <DocStatusBadge status={crew.documents_status} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={crew.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
