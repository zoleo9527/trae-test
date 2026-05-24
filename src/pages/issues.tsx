import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { formatDate, statusLabels, issueCategoryLabels, priorityLabels, formatRelativeTime } from '../utils/format';
import { Filter, AlertTriangle, Clock, User, MessageSquare, Send, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function Issues() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [statusChangeComment, setStatusChangeComment] = useState('');
  const [showStatusCommentInput, setShowStatusCommentInput] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      loadIssues();
    }
  }, [user, loading, router, statusFilter, categoryFilter]);

  async function loadIssues() {
    try {
      const res = await api.issues.list({
        status: statusFilter,
        category: categoryFilter,
      });
      setIssues(res.issues);
    } catch (err) {
      console.error('Failed to load issues', err);
    }
  }

  async function loadIssueDetail(issueId: string) {
    try {
      const res = await api.issues.get(issueId);
      setSelectedIssue(res.issue);
    } catch (err) {
      console.error('Failed to load issue detail', err);
    }
  }

  async function updateIssueStatus(issueId: string, status: string, comment: string = '') {
    try {
      await api.issues.update(issueId, { status, comment });
      loadIssues();
      if (selectedIssue?.id === issueId) {
        await loadIssueDetail(issueId);
      }
      setShowStatusCommentInput(false);
      setStatusChangeComment('');
      setPendingStatus(null);
    } catch (err) {
      console.error('Failed to update issue status', err);
    }
  }

  function handleStatusClick(status: string) {
    if (selectedIssue.status === status) return;
    setPendingStatus(status);
    setShowStatusCommentInput(true);
  }

  async function confirmStatusChange() {
    if (pendingStatus) {
      await updateIssueStatus(selectedIssue.id, pendingStatus, statusChangeComment);
    }
  }

  function cancelStatusChange() {
    setShowStatusCommentInput(false);
    setStatusChangeComment('');
    setPendingStatus(null);
  }

  async function handleAddComment() {
    if (!newComment.trim() || !selectedIssue) return;
    
    setAddingComment(true);
    try {
      await api.issues.addComment(selectedIssue.id, newComment.trim());
      setNewComment('');
      await loadIssueDetail(selectedIssue.id);
      loadIssues();
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setAddingComment(false);
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'open', label: '待处理' },
    { value: 'in_progress', label: '处理中' },
    { value: 'resolved', label: '已解决' },
    { value: 'closed', label: '已关闭' },
  ];

  const categoryOptions = [
    { value: 'all', label: '全部分类' },
    { value: 'document_version', label: '版本混乱' },
    { value: 'deadline_missed', label: '截点错过' },
    { value: 'refund_negotiation', label: '退款协商' },
    { value: 'visa_issue', label: '签证问题' },
    { value: 'communication', label: '沟通问题' },
  ];

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">问题追踪</h1>
            <p className="text-gray-500 mt-1">共 {issues.length} 个问题记录</p>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-36"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-36"
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {issues.map(issue => (
              <div
                key={issue.id}
                onClick={() => loadIssueDetail(issue.id)}
                className={`card p-4 cursor-pointer transition-all ${
                  selectedIssue?.id === issue.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className={`${
                      issue.priority === 'critical' ? 'text-red-500' :
                      issue.priority === 'high' ? 'text-orange-500' : 'text-amber-500'
                    }`} />
                    <h3 className="font-medium text-gray-900">{issue.title}</h3>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[issue.priority]}`}>
                    {priorityLabels[issue.priority]}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{issue.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>{issue.studentName}</span>
                    <span>·</span>
                    <span>{issueCategoryLabels[issue.category]}</span>
                  </div>
                  <span className={`status-badge status-${issue.status === 'in_progress' ? 'in_progress' : issue.status}`}>
                    {statusLabels[issue.status]}
                  </span>
                </div>
              </div>
            ))}
            {issues.length === 0 && (
              <div className="card p-12 text-center text-gray-500">
                没有找到匹配的问题
              </div>
            )}
          </div>

          <div>
            {selectedIssue ? (
              <div className="card p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedIssue.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatRelativeTime(selectedIssue.createdAt)} 创建
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${priorityColors[selectedIssue.priority]}`}>
                    {priorityLabels[selectedIssue.priority]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">关联学生</p>
                    <button 
                      onClick={() => router.push(`/students/${selectedIssue.studentId}`)}
                      className="text-primary-600 hover:underline font-medium"
                    >
                      {selectedIssue.studentName}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">问题分类</p>
                    <p className="text-gray-900">{issueCategoryLabels[selectedIssue.category]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">当前状态</p>
                    <span className={`status-badge status-${selectedIssue.status === 'in_progress' ? 'in_progress' : selectedIssue.status}`}>
                      {statusLabels[selectedIssue.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">创建时间</p>
                    <p className="text-gray-900">{formatDate(selectedIssue.createdAt)}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">问题描述</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedIssue.description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">状态更新</h3>
                  <div className="flex gap-2 mb-3">
                    {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusClick(status)}
                        disabled={selectedIssue.status === status}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          selectedIssue.status === status
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${pendingStatus === status ? 'ring-2 ring-primary-500' : ''}`}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                  
                  {showStatusCommentInput && (
                    <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                      <p className="text-sm text-primary-800 mb-2 font-medium">
                        状态将变更为：{statusLabels[pendingStatus || '']}
                      </p>
                      <textarea
                        value={statusChangeComment}
                        onChange={(e) => setStatusChangeComment(e.target.value)}
                        placeholder="添加处理备注（可选）..."
                        className="input mb-3 min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={confirmStatusChange}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          确认变更
                        </button>
                        <button
                          onClick={cancelStatusChange}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">追加协商记录</h3>
                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="输入处理备注或协商记录..."
                      className="input flex-1 min-h-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleAddComment();
                        }
                      }}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addingComment}
                      className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {addingComment ? '发送中...' : '添加记录'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">处理历史</h3>
                  <div className="space-y-3">
                    {selectedIssue.history?.slice().reverse().map((h: any) => (
                      <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium shrink-0">
                          {h.userName?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{h.userName}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(h.timestamp, 'yyyy-MM-dd HH:mm')}
                            </span>
                            {h.action === 'status_change' && (
                              <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                                状态变更
                              </span>
                            )}
                            {h.action === 'comment' && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                协商记录
                              </span>
                            )}
                          </div>
                          {h.action === 'status_change' && (
                            <p className="text-sm text-gray-600 mt-1">
                              状态从 <span className="text-gray-900">{statusLabels[h.oldValue || ''] || h.oldValue}</span> 变更为{' '}
                              <span className="text-gray-900">{statusLabels[h.newValue || ''] || h.newValue}</span>
                            </p>
                          )}
                          {h.comment && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <p className="text-sm text-gray-700">{h.comment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">选择一个问题查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
