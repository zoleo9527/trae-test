'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  AlertTriangle,
  CheckCircle,
  FileCheck
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
  const { hasRole } = useAuth();
  const [crewChanges, setCrewChanges] = useState([]);
  const [berths, setBerths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    berth_plan_id: '',
    type: 'sign_on',
    crew_name: '',
    rank: '',
    nationality: '中国',
    arrival_flight: '',
    departure_flight: '',
    visa_expiry: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canCreate = hasRole('field_coordinator');
  const canProcessDocs = hasRole('document_specialist');

  const [showDocModal, setShowDocModal] = useState(false);
  const [docFormData, setDocFormData] = useState({
    id: null,
    crew_name: '',
    documents_status: 'pending',
    notes: '',
  });
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState('');

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const [crewData, berthsData] = await Promise.all([
        api.crew.list(params),
        api.berth.list(),
      ]);
      
      setCrewChanges(crewData);
      setBerths(berthsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        berth_plan_id: parseInt(formData.berth_plan_id),
      };
      await api.crew.create(submitData);
      setShowModal(false);
      setFormData({
        berth_plan_id: '',
        type: 'sign_on',
        crew_name: '',
        rank: '',
        nationality: '中国',
        arrival_flight: '',
        departure_flight: '',
        visa_expiry: '',
        notes: '',
      });
      fetchData();
    } catch (err) {
      setError(err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCrew = crewChanges.filter(c => 
    c.crew_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const docIssues = crewChanges.filter(c => c.documents_status === 'rejected' || c.documents_status === 'pending').length;

  const openDocModal = (crew) => {
    setDocFormData({
      id: crew.id,
      crew_name: crew.crew_name,
      documents_status: crew.documents_status || 'pending',
      notes: crew.notes || '',
    });
    setDocError('');
    setShowDocModal(true);
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    setDocError('');
    setDocSubmitting(true);

    try {
      await api.crew.update(docFormData.id, {
        status: docFormData.documents_status === 'approved' ? 'in_progress' : undefined,
        documents_status: docFormData.documents_status,
        notes: docFormData.notes,
      });
      setShowDocModal(false);
      fetchData();
    } catch (err) {
      setDocError(err.message || '操作失败');
    } finally {
      setDocSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">船员换班</h1>
            <p className="text-gray-500 mt-1">管理船员上下船安排和证件审核</p>
          </div>
          {canCreate && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增换班
            </button>
          )}
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
                  {canProcessDocs && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  )}
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
                    {canProcessDocs && (
                      <td className="px-6 py-4">
                        {crew.documents_status !== 'approved' && (
                          <button
                            onClick={() => openDocModal(crew)}
                            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
                          >
                            <FileCheck className="w-4 h-4" />
                            处理证件
                          </button>
                        )}
                        {crew.documents_status === 'approved' && (
                          <span className="text-xs text-green-600">已审核</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="新增船员换班">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关联靠泊计划 *</label>
            <select
              value={formData.berth_plan_id}
              onChange={(e) => setFormData({ ...formData, berth_plan_id: e.target.value })}
              className="input"
              required
            >
              <option value="">请选择靠泊计划</option>
              {berths.map(b => (
                <option key={b.id} value={b.id}>{b.ship_name} ({b.arrival_date?.split(' ')[0]})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">换班类型 *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
                required
              >
                <option value="sign_on">上船</option>
                <option value="sign_off">下船</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">船员姓名 *</label>
              <input
                type="text"
                value={formData.crew_name}
                onChange={(e) => setFormData({ ...formData, crew_name: e.target.value })}
                className="input"
                placeholder="请输入姓名"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">职务</label>
              <input
                type="text"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="input"
                placeholder="如: 船长、大副、水手"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">国籍</label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                className="input"
                placeholder="请输入国籍"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">入境航班</label>
              <input
                type="text"
                value={formData.arrival_flight}
                onChange={(e) => setFormData({ ...formData, arrival_flight: e.target.value })}
                className="input"
                placeholder="如: MU501"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">签证到期日</label>
              <input
                type="date"
                value={formData.visa_expiry}
                onChange={(e) => setFormData({ ...formData, visa_expiry: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? '创建中...' : '创建换班'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDocModal} onClose={() => setShowDocModal(false)} title="处理船员证件">
        <form onSubmit={handleDocSubmit} className="space-y-4">
          {docError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {docError}
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">船员姓名</p>
            <p className="font-semibold text-gray-900">{docFormData.crew_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">证件审核结果 *</label>
            <select
              value={docFormData.documents_status}
              onChange={(e) => setDocFormData({ ...docFormData, documents_status: e.target.value })}
              className="input"
              required
            >
              <option value="pending">待审核</option>
              <option value="approved">审核通过</option>
              <option value="rejected">审核拒绝</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={docFormData.notes}
              onChange={(e) => setDocFormData({ ...docFormData, notes: e.target.value })}
              className="input"
              rows="3"
              placeholder="请输入审核备注，如：签证已确认、缺少海员证等"
            />
          </div>
          {docFormData.documents_status === 'approved' && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
              审核通过后，相关证件到期提醒将自动标记为已处理
            </div>
          )}
          {docFormData.documents_status === 'rejected' && (
            <div className="bg-orange-50 text-orange-700 px-4 py-3 rounded-lg text-sm">
              审核拒绝后，现场协调将收到通知重新处理
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={docSubmitting} className="btn btn-primary flex-1">
              {docSubmitting ? '提交中...' : '确认提交'}
            </button>
            <button
              type="button"
              onClick={() => setShowDocModal(false)}
              className="btn btn-secondary"
            >
              取消
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
