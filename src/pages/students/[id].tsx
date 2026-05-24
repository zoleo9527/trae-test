import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatDate, statusLabels, documentTypeLabels, getDeadlineStatus } from '../../utils/format';
import { 
  ArrowLeft, FileText, Calendar, Globe, MessageSquare, Clock, 
  CheckCircle2, Upload, Send, X, Plus, AlertCircle
} from 'lucide-react';

export default function StudentDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<any>(null);
  const [uploadForm, setUploadForm] = useState({ fileName: '', fileSize: 0, comment: '' });
  const [uploading, setUploading] = useState(false);
  
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingDoc, setRejectingDoc] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [showVisaStatusModal, setShowVisaStatusModal] = useState(false);
  const [newVisaStatus, setNewVisaStatus] = useState('');
  const [visaStatusNote, setVisaStatusNote] = useState('');
  const [updatingVisa, setUpdatingVisa] = useState(false);

  const [showVisaNoteModal, setShowVisaNoteModal] = useState(false);
  const [newVisaNote, setNewVisaNote] = useState('');
  const [newVisaNoteType, setNewVisaNoteType] = useState('update');
  const [addingVisaNote, setAddingVisaNote] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user && id) {
      loadStudentData();
    }
  }, [user, loading, id, router]);
  
  async function loadStudentData() {
    try {
      const res = await api.students.get(id as string);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load student data', err);
      if (err.message === '无权访问此学生数据') {
        alert('无权访问此学生数据');
        router.push('/students');
      }
    }
  }
  
  async function handleSendMessage() {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await api.messages.add(id as string, newMessage);
      setNewMessage('');
      loadStudentData();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMessage(false);
    }
  }
  
  async function handleApproveDocument(docId: string) {
    if (!confirm('确定通过此文档审核吗？通过后关联截点将自动标记完成。')) return;
    
    try {
      await api.documents.updateStatus(docId, 'approved');
      loadStudentData();
    } catch (err) {
      console.error('Failed to approve document', err);
    }
  }
  
  function openRejectModal(doc: any) {
    setRejectingDoc(doc);
    setRejectFeedback(doc.feedback || '');
    setShowRejectModal(true);
  }
  
  async function handleRejectDocument() {
    if (!rejectFeedback.trim()) {
      alert('请填写退回原因');
      return;
    }
    
    setRejecting(true);
    try {
      await api.documents.updateStatus(rejectingDoc.id, 'rejected', rejectFeedback);
      setShowRejectModal(false);
      setRejectingDoc(null);
      setRejectFeedback('');
      loadStudentData();
    } catch (err) {
      console.error('Failed to reject document', err);
    } finally {
      setRejecting(false);
    }
  }
  
  function openUploadModal(doc: any) {
    setUploadingDoc(doc);
    setUploadForm({ fileName: `${doc.name}_v${doc.currentVersion + 1}.docx`, fileSize: 25000, comment: '' });
    setShowUploadModal(true);
  }
  
  async function handleUploadVersion() {
    if (!uploadForm.fileName.trim()) {
      alert('请填写文件名');
      return;
    }
    
    setUploading(true);
    try {
      await api.documents.addVersion(uploadingDoc.id, uploadForm);
      setShowUploadModal(false);
      setUploadingDoc(null);
      setUploadForm({ fileName: '', fileSize: 0, comment: '' });
      loadStudentData();
    } catch (err) {
      console.error('Failed to upload version', err);
    } finally {
      setUploading(false);
    }
  }
  
  function openVisaStatusModal(currentStatus: string) {
    setNewVisaStatus(currentStatus);
    setVisaStatusNote('');
    setShowVisaStatusModal(true);
  }
  
  async function handleUpdateVisaStatus() {
    if (!newVisaStatus) return;
    
    setUpdatingVisa(true);
    try {
      await Promise.all([
        api.visa.updateStatus(id as string, newVisaStatus),
        visaStatusNote ? api.visa.addNote(id as string, visaStatusNote, 'update') : null
      ]);
      setShowVisaStatusModal(false);
      setNewVisaStatus('');
      setVisaStatusNote('');
      loadStudentData();
    } catch (err) {
      console.error('Failed to update visa status', err);
    } finally {
      setUpdatingVisa(false);
    }
  }
  
  function openVisaNoteModal() {
    setNewVisaNote('');
    setNewVisaNoteType('update');
    setShowVisaNoteModal(true);
  }
  
  async function handleAddVisaNote() {
    if (!newVisaNote.trim()) {
      alert('请填写记录内容');
      return;
    }
    
    setAddingVisaNote(true);
    try {
      await api.visa.addNote(id as string, newVisaNote, newVisaNoteType);
      setShowVisaNoteModal(false);
      setNewVisaNote('');
      setNewVisaNoteType('update');
      loadStudentData();
    } catch (err) {
      console.error('Failed to add visa note', err);
    } finally {
      setAddingVisaNote(false);
    }
  }

  if (loading || !user || !data) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }
  
  const { student, documents, deadlines, visa, messages, activityLogs } = data;
  const tabs = [
    { id: 'documents', label: '文书材料', icon: <FileText size={18} /> },
    { id: 'deadlines', label: '截点日历', icon: <Calendar size={18} /> },
    { id: 'visa', label: '签证进度', icon: <Globe size={18} /> },
    { id: 'messages', label: '沟通记录', icon: <MessageSquare size={18} /> },
    { id: 'activity', label: '操作历史', icon: <Clock size={18} /> },
  ];
  
  const visaStatusOptions = [
    { value: 'not_started', label: '未开始' },
    { value: 'documents_preparing', label: '材料准备中' },
    { value: 'submitted', label: '已提交' },
    { value: 'interview_scheduled', label: '面试已预约' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已拒签' },
    { value: 'refund_in_progress', label: '退款中' },
  ];

  return (
    <Layout>
      <div className="p-6">
        <button 
          onClick={() => router.push('/students')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          返回学生列表
        </button>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                {student.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-gray-500">{student.englishName || ''}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`status-badge status-${student.status}`}>
                    {statusLabels[student.status]}
                  </span>
                  <span className="text-sm text-gray-500">{student.targetSchool}</span>
                  <span className="text-sm text-gray-500">·</span>
                  <span className="text-sm text-gray-500">{student.targetCountry} · {student.targetMajor}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">邮箱</p>
              <p className="text-gray-900">{student.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">电话</p>
              <p className="text-gray-900">{student.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">签约日期</p>
              <p className="text-gray-900">{student.contractDate || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">预计入学</p>
              <p className="text-gray-900">{student.expectedStartDate || '-'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {documents.map((doc: any) => (
              <div key={doc.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {documentTypeLabels[doc.type]} · 当前版本 v{doc.currentVersion}
                    </p>
                    {doc.feedback && (
                      <div className="flex items-start gap-2 mt-2 bg-amber-50 p-3 rounded-lg">
                        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">审核反馈</p>
                          <p className="text-sm text-amber-700">{doc.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`status-badge status-${doc.status}`}>
                      {statusLabels[doc.status]}
                    </span>
                    {doc.deadline && (
                      <span className={`text-sm ${getDeadlineStatus(doc.deadline) === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                        截止：{formatDate(doc.deadline)}
                      </span>
                    )}
                  </div>
                </div>
                
                {doc.versions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">版本历史</p>
                    <div className="space-y-2">
                      {doc.versions.slice().reverse().map((v: any) => (
                        <div key={v.id} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                              <FileText size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-gray-900 font-medium">v{v.version} · {v.fileName}</p>
                              {v.comment && <p className="text-gray-500 text-xs">{v.comment}</p>}
                            </div>
                          </div>
                          <span className="text-gray-500">{formatDate(v.uploadedAt, 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    onClick={() => openUploadModal(doc)}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <Upload size={16} />
                    上传新版本
                  </button>
                  {doc.status === 'review' && user?.role === 'consultant_manager' && (
                    <>
                      <button 
                        onClick={() => handleApproveDocument(doc.id)}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        通过审核
                      </button>
                      <button 
                        onClick={() => openRejectModal(doc)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <AlertCircle size={16} />
                        退回修改
                      </button>
                    </>
                  )}
                  {doc.status === 'review' && user?.role === 'copywriter' && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={14} />
                      等待主管审核
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-3">
            {deadlines.map((dl: any) => {
              const status = getDeadlineStatus(dl.date);
              return (
                <div key={dl.id} className={`card p-4 ${status === 'overdue' && !dl.isCompleted ? 'border-red-200' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        dl.isCompleted ? 'bg-green-100' :
                        status === 'overdue' ? 'bg-red-100' :
                        status === 'upcoming' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {dl.isCompleted ? <CheckCircle2 size={18} className="text-green-600" /> :
                         status === 'overdue' ? <AlertCircle size={18} className="text-red-600" /> :
                         <Calendar size={18} className="text-gray-600" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{dl.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{dl.description}</p>
                        {dl.relatedDocumentId && (
                          <p className="text-xs text-primary-600 mt-1">关联文档：{documents.find((d: any) => d.id === dl.relatedDocumentId)?.name || '-'}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        dl.isCompleted ? 'text-green-600' :
                        status === 'overdue' ? 'text-red-600' :
                        status === 'upcoming' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {formatDate(dl.date)}
                      </p>
                      <span className={`text-xs ${
                        dl.isCompleted ? 'text-green-600' :
                        status === 'overdue' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {dl.isCompleted ? '已完成' : status === 'overdue' ? '已逾期' : status === 'upcoming' ? '7天内' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'visa' && visa && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-medium text-gray-900 text-lg">{visa.country}学生签证</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`status-badge status-${visa.status === 'documents_preparing' ? 'in_progress' : visa.status}`}>
                    {statusLabels[visa.status]}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={openVisaNoteModal}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Plus size={16} />
                  添加记录
                </button>
                <button 
                  onClick={() => openVisaStatusModal(visa.status)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  更新状态
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">预约日期</p>
                <p className="text-gray-900 font-medium">{visa.appointmentDate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">提交日期</p>
                <p className="text-gray-900 font-medium">{visa.submissionDate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">通过日期</p>
                <p className="text-gray-900 font-medium">{visa.approvalDate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">拒签原因</p>
                <p className="text-gray-900 font-medium">{visa.rejectionReason || '-'}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">进度记录</h4>
              <div className="space-y-3">
                {visa.notes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">暂无进度记录</p>
                ) : (
                  visa.notes.map((note: any) => (
                    <div key={note.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                        note.type === 'issue' ? 'bg-red-500' :
                        note.type === 'resolution' ? 'bg-green-500' : 
                        note.type === 'refund' ? 'bg-purple-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                            {note.type === 'issue' ? '问题' :
                             note.type === 'resolution' ? '解决' :
                             note.type === 'refund' ? '退款' : '更新'}
                          </span>
                        </div>
                        <p className="text-gray-900">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(note.createdAt, 'yyyy-MM-dd HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900">沟通记录</h3>
            </div>
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderId === user?.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm font-medium mb-1">{msg.senderName}</p>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-primary-100' : 'text-gray-500'}`}>
                      {formatDate(msg.timestamp, 'HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
                className="input flex-1"
              />
              <button 
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
                className="btn-primary disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                发送
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card p-6">
            <h3 className="font-medium text-gray-900 mb-4">操作历史</h3>
            <div className="space-y-4">
              {activityLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium shrink-0">
                    {log.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-gray-900">
                      <span className="font-medium">{log.userName}</span> {log.action}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(log.timestamp, 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">上传新版本</h3>
                <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">文档：{uploadingDoc?.name}</p>
                  <p className="text-sm text-gray-500">新版本：v{(uploadingDoc?.currentVersion || 0) + 1}</p>
                </div>
                <div>
                  <label className="label">文件名</label>
                  <input
                    type="text"
                    value={uploadForm.fileName}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                    className="input"
                    placeholder="输入文件名"
                  />
                </div>
                <div>
                  <label className="label">版本说明（可选）</label>
                  <textarea
                    value={uploadForm.comment}
                    onChange={(e) => setUploadForm({ ...uploadForm, comment: e.target.value })}
                    className="input min-h-[80px]"
                    placeholder="描述本次修改内容..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button 
                  onClick={handleUploadVersion}
                  disabled={uploading}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading ? '上传中...' : '确认上传'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">退回修改</h3>
                <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-4">
                  文档：{rejectingDoc?.name}
                </p>
                <div>
                  <label className="label">退回原因 <span className="text-red-500">*</span></label>
                  <textarea
                    value={rejectFeedback}
                    onChange={(e) => setRejectFeedback(e.target.value)}
                    className="input min-h-[120px]"
                    placeholder="请详细说明需要修改的内容..."
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button 
                  onClick={handleRejectDocument}
                  disabled={rejecting || !rejectFeedback.trim()}
                  className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {rejecting ? '提交中...' : '确认退回'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showVisaStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">更新签证状态</h3>
                <button onClick={() => setShowVisaStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="label">新状态</label>
                  <select
                    value={newVisaStatus}
                    onChange={(e) => setNewVisaStatus(e.target.value)}
                    className="input"
                  >
                    {visaStatusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">更新说明（可选）</label>
                  <textarea
                    value={visaStatusNote}
                    onChange={(e) => setVisaStatusNote(e.target.value)}
                    className="input min-h-[80px]"
                    placeholder="添加进度记录..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowVisaStatusModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button 
                  onClick={handleUpdateVisaStatus}
                  disabled={updatingVisa}
                  className="btn-primary disabled:opacity-50"
                >
                  {updatingVisa ? '更新中...' : '确认更新'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showVisaNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">添加进度记录</h3>
                <button onClick={() => setShowVisaNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="label">记录类型</label>
                  <select
                    value={newVisaNoteType}
                    onChange={(e) => setNewVisaNoteType(e.target.value)}
                    className="input"
                  >
                    <option value="update">正常更新</option>
                    <option value="issue">发现问题</option>
                    <option value="resolution">问题解决</option>
                    <option value="refund">退款相关</option>
                  </select>
                </div>
                <div>
                  <label className="label">记录内容 <span className="text-red-500">*</span></label>
                  <textarea
                    value={newVisaNote}
                    onChange={(e) => setNewVisaNote(e.target.value)}
                    className="input min-h-[100px]"
                    placeholder="详细描述..."
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowVisaNoteModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button 
                  onClick={handleAddVisaNote}
                  disabled={addingVisaNote || !newVisaNote.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {addingVisaNote ? '添加中...' : '添加记录'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
