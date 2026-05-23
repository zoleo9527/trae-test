import { useState, useEffect } from 'react';
import withAuth from '../hoc/withAuth';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  supplement: 'bg-orange-100 text-orange-700',
};

const typeNames = {
  acceptance: '验收资料',
  agreement: '协议文件',
  test_report: '检测报告',
  safety: '安全资料',
  other: '其他资料',
};

function GridDocs() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filter, setFilter] = useState({ status: '', type: '', keyword: '' });
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [newRemark, setNewRemark] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const { hasRole, ROLES } = useAuth();
  const isManager = hasRole(ROLES.STATION_MANAGER);
  const isAdmin = hasRole([ROLES.STATION_MANAGER, ROLES.ADMIN_STAFF]);

  useEffect(() => {
    loadDocs();
  }, [filter]);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.type) params.type = filter.type;
      if (filter.keyword) params.keyword = filter.keyword;
      
      const data = await api.gridDocs.list(params);
      setDocs(data);
    } catch (error) {
      console.error('加载资料失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (docId, action) => {
    try {
      if (action === 'approve') {
        await api.gridDocs.approve(docId, reviewNote);
      } else if (action === 'reject') {
        await api.gridDocs.reject(docId, reviewNote);
      } else if (action === 'supplement') {
        await api.gridDocs.supplement(docId, reviewNote);
      }
      setShowReviewModal(false);
      setReviewNote('');
      loadDocs();
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    } catch (error) {
      console.error('审核失败:', error);
    }
  };

  const handleAddRemark = async () => {
    if (!selectedDoc || !newRemark.trim()) return;
    try {
      await api.gridDocs.addRemark(selectedDoc.id, newRemark);
      setNewRemark('');
      setShowRemarkModal(false);
      loadDocs();
    } catch (error) {
      console.error('添加备注失败:', error);
    }
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">并网资料管理</h2>
          <p className="text-sm text-gray-500">管理并网验收相关资料的审核与归档</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              placeholder="搜索资料名称或提交人..."
              value={filter.keyword}
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="supplement">待补录</option>
          </select>
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">全部类型</option>
            {Object.entries(typeNames).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-280px)]">
        <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-spin">⚙️</div>
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto h-full scrollbar-thin">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">资料名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交人</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">提交时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {docs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedDoc?.id === doc.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{doc.title}</div>
                        <div className="text-xs text-gray-400">{doc.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.typeName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[doc.status]}`}>
                          {doc.statusName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.submitter}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {doc.submitTime?.slice(0, 16)}
                      </td>
                    </tr>
                  ))}
                  {docs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        <p className="text-4xl mb-2">📄</p>
                        <p>暂无资料</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedDoc && (
          <div className="w-96 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">资料详情</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">{selectedDoc.title}</h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusColors[selectedDoc.status]}`}>
                    {selectedDoc.statusName}
                  </span>
                  <span className="text-xs text-gray-500">{selectedDoc.id}</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">资料类型</span>
                  <span>{selectedDoc.typeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">提交人</span>
                  <span>{selectedDoc.submitter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">提交时间</span>
                  <span>{selectedDoc.submitTime?.slice(0, 16)}</span>
                </div>
                {selectedDoc.reviewer && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">审核人</span>
                    <span>{selectedDoc.reviewer}</span>
                  </div>
                )}
              </div>

              {selectedDoc.rejectReason && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-600 font-medium mb-1">驳回原因</p>
                  <p className="text-sm text-red-700">{selectedDoc.rejectReason}</p>
                </div>
              )}

              {selectedDoc.supplementNote && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium mb-1">补录要求</p>
                  <p className="text-sm text-orange-700">{selectedDoc.supplementNote}</p>
                </div>
              )}

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">上传文件</p>
                <div className="space-y-2">
                  {selectedDoc.files?.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <span>📄</span>
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-gray-400">{file.size}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">历史备注</p>
                  <button
                    onClick={() => setShowRemarkModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + 添加
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedDoc.remarks?.length > 0 ? (
                    selectedDoc.remarks.map((remark) => (
                      <div key={remark.id} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700">{remark.author}</span>
                          <span className="text-xs text-gray-400">{remark.time?.slice(5, 16)}</span>
                        </div>
                        <p className="text-gray-600">{remark.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">暂无备注</p>
                  )}
                </div>
              </div>
            </div>

            {isManager && selectedDoc.status === 'pending' && (
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => { setReviewAction('approve'); setShowReviewModal(true); }}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  通过
                </button>
                <button
                  onClick={() => { setReviewAction('supplement'); setShowReviewModal(true); }}
                  className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
                >
                  补录
                </button>
                <button
                  onClick={() => { setReviewAction('reject'); setShowReviewModal(true); }}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                >
                  驳回
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showRemarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">添加备注</h3>
            <textarea
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
              placeholder="请输入备注内容..."
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowRemarkModal(false); setNewRemark(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={handleAddRemark}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              {reviewAction === 'approve' ? '通过审核' : 
               reviewAction === 'supplement' ? '要求补录' : '驳回申请'}
            </h3>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm h-24 resize-none"
              placeholder={
                reviewAction === 'approve' ? '填写审核意见（可选）...' :
                reviewAction === 'supplement' ? '请说明需要补录的内容...' :
                '请说明驳回原因...'
              }
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setShowReviewModal(false); setReviewNote(''); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                取消
              </button>
              <button
                onClick={() => handleReview(selectedDoc.id, reviewAction)}
                className={`px-4 py-2 text-white rounded-lg text-sm ${
                  reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  reviewAction === 'supplement' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(GridDocs, ['station_manager', 'admin_staff']);
