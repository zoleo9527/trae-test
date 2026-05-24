import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { statusLabels } from '../utils/format';
import { Search, Filter, ChevronRight } from 'lucide-react';

export default function Students() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      loadStudents();
    }
  }, [user, loading, router, search, statusFilter]);

  async function loadStudents() {
    try {
      const res = await api.students.list({
        search: search || undefined,
        status: statusFilter,
      });
      setStudents(res.students);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'consulting', label: '咨询中' },
    { value: 'contract_signed', label: '已签约' },
    { value: 'document_prep', label: '文书准备中' },
    { value: 'application_submitted', label: '申请已提交' },
    { value: 'visa_processing', label: '签证办理中' },
    { value: 'completed', label: '已完成' },
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">学生列表</h1>
          <p className="text-gray-500 mt-1">共 {students.length} 位学生</p>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索学生姓名、目标院校..."
                className="input pl-10"
              />
            </div>
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-10 pr-8 appearance-none"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">学生</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">目标</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">签约日期</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/students/${student.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{student.targetSchool}</p>
                    <p className="text-sm text-gray-500">{student.targetCountry} · {student.targetMajor}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`status-badge status-${student.status}`}>
                      {statusLabels[student.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {student.contractDate || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <ChevronRight size={20} className="text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的学生
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
