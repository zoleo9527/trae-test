import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  FileText,
  Send,
  MessageSquare,
  User,
  Calendar,
  Edit,
  Download,
  RefreshCw,
  X,
  FileCheck,
  Trash2
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const caseDocuments = [
  { id: 'DOC001', name: '护照扫描件.pdf', category: '个人材料', status: 'approved', uploadedAt: '2024-01-10', uploader: '王顾问', size: '2.3 MB' },
  { id: 'DOC002', name: '身份证正反面.pdf', category: '个人材料', status: 'approved', uploadedAt: '2024-01-10', uploader: '王顾问', size: '1.1 MB' },
  { id: 'DOC003', name: '大学成绩单.pdf', category: '学术材料', status: 'under_review', uploadedAt: '2024-01-15', uploader: '李文案', size: '1.5 MB' },
  { id: 'DOC004', name: '在读证明.pdf', category: '学术材料', status: 'approved', uploadedAt: '2024-01-12', uploader: '李文案', size: '890 KB' },
  { id: 'DOC005', name: '银行存款证明.pdf', category: '资金证明', status: 'required', uploadedAt: null, uploader: null, size: null },
  { id: 'DOC006', name: '收入证明.pdf', category: '资金证明', status: 'rejected', uploadedAt: '2024-01-18', uploader: '张助理', size: '560 KB', rejectReason: '需要英文版盖章' },
  { id: 'DOC007', name: '语言成绩.pdf', category: '学术材料', status: 'approved', uploadedAt: '2024-01-08', uploader: '王顾问', size: '450 KB' },
  { id: 'DOC008', name: '推荐信.pdf', category: '学术材料', status: 'under_review', uploadedAt: '2024-01-20', uploader: '李文案', size: '1.2 MB' }
];

const caseNotes = [
  { id: 1, content: '学生已提供护照扫描件，开始处理材料收集', author: '王顾问', createdAt: '2024-01-10 10:30' },
  { id: 2, content: '文书初稿完成，已发送给学生确认', author: '李文案', createdAt: '2024-01-15 14:20' },
  { id: 3, content: '材料审核发现资金证明不足，已通知学生补充', author: '张助理', createdAt: '2024-01-25 09:15' }
];

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState(caseNotes);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [uploadingSupplement, setUploadingSupplement] = useState(null);
  const [selectedUploadSupplement, setSelectedUploadSupplement] = useState(null);

  const loadCaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getCaseById(id);
      setCaseData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.warning('请输入备注内容');
      return;
    }

    setSubmittingNote(true);
    try {
      await api.addCaseNote(id, newNote);
      const newNoteItem = {
        id: Date.now(),
        content: newNote,
        author: '当前用户',
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm')
      };
      setNotes(prev => [newNoteItem, ...prev]);
      setNewNote('');
      toast.success('备注添加成功');
    } catch (err) {
      toast.error(`添加备注失败: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUploadClick = (supplementId) => {
    setSelectedUploadSupplement(supplementId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUploadSupplement) return;

    setUploadingSupplement(selectedUploadSupplement);
    try {
      await api.uploadSupplement(id, selectedUploadSupplement, file);
      
      setCaseData(prev => ({
        ...prev,
        supplements: prev.supplements.map(s => 
          s.id === selectedUploadSupplement
            ? {
                ...s,
                status: 'under_review',
                uploads: [
                  ...(s.uploads || []),
                  {
                    id: `U${Date.now()}`,
                    name: file.name,
                    uploadDate: format(new Date(), 'yyyy-MM-dd'),
                    uploader: '当前用户',
                    version: (s.uploads?.length || 0) + 1,
                    status: 'reviewing'
                  }
                ]
              }
            : s
        )
      }));
      
      toast.success('文件上传成功，等待审核');
    } catch (err) {
      toast.error(`上传失败: ${err.message}`);
    } finally {
      setUploadingSupplement(null);
      setSelectedUploadSupplement(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getTimelineIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'returned':
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 bg-gray-200 rounded-full" />;
    }
  };

  const getDocStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'under_review': return 'text-blue-600 bg-blue-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDocStatusText = (status) => {
    switch (status) {
      case 'approved': return '已通过';
      case 'under_review': return '审核中';
      case 'rejected': return '已驳回';
      case 'required': return '待上传';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState text="正在加载案件详情..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="案件不存在"
          message={error}
          onRetry={loadCaseData}
        />
        <div className="mt-4 text-center">
          <Link to="/cases" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <ErrorState
          title="案件不存在"
          message="未找到该签证案件，请检查案件编号是否正确"
        />
        <div className="mt-4 text-center">
          <Link to="/cases" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />

      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/cases')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{caseData.studentName}</h1>
            <StatusBadge status={caseData.status} text={caseData.statusText} />
            <StatusBadge status={caseData.priority} text={caseData.priority === 'urgent' ? '紧急' : caseData.priority === 'high' ? '高' : caseData.priority === 'medium' ? '中' : '低'} variant="priority" />
          </div>
          <p className="text-sm text-gray-500">{caseData.id} · {caseData.country} · {caseData.visaType}</p>
        </div>
        <button onClick={loadCaseData} className="btn-secondary flex items-center gap-2" title="刷新">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
        <button className="btn-secondary flex items-center gap-2">
          <Edit className="w-4 h-4" />
          编辑
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">签证进度</h2>
            <div className="relative">
              {caseData.timeline.map((step, index) => (
                <div key={step.step} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    {getTimelineIcon(step.status)}
                    {index < caseData.timeline.length - 1 && (
                      <div className={`w-0.5 h-full mt-1 ${
                        step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${
                        step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </h3>
                      {step.status === 'in_progress' && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          进行中
                        </span>
                      )}
                    </div>
                    {step.date && (
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(step.date), 'yyyy年MM月dd日', { locale: zhCN })} · {step.operator}
                      </p>
                    )}
                    {step.note && (
                      <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm text-red-700">{step.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="border-b border-gray-100">
              <div className="flex">
                {[
                  { id: 'timeline', label: '时间线' },
                  { id: 'supplements', label: `补件 (${caseData.supplements.length})` },
                  { id: 'documents', label: '材料' },
                  { id: 'notes', label: `备注 (${notes.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {activeTab === 'supplements' && (
                <div className="space-y-4">
                  {caseData.supplements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p>该案件暂无补件要求</p>
                    </div>
                  ) : (
                    caseData.supplements.map(supplement => (
                      <div key={supplement.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <h4 className="font-medium text-gray-900">{supplement.name}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{supplement.description}</p>
                          </div>
                          <StatusBadge 
                            status={supplement.status} 
                            text={
                              supplement.status === 'required' ? '待提交' :
                              supplement.status === 'under_review' ? '审核中' :
                              supplement.status === 'approved' ? '已通过' : '已驳回'
                            } 
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>截止日期: {supplement.requiredDate}</span>
                          </div>
                        </div>

                        {supplement.uploads && supplement.uploads.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">已上传文件</p>
                            <div className="space-y-2">
                              {supplement.uploads.map(upload => (
                                <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{upload.name}</p>
                                      <p className="text-xs text-gray-500">
                                        v{upload.version} · {upload.uploader} · {upload.uploadDate}
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
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUploadClick(supplement.id)}
                            disabled={uploadingSupplement === supplement.id}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {uploadingSupplement === supplement.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            {uploadingSupplement === supplement.id ? '上传中...' : '上传材料'}
                          </button>
                          <button className="btn-secondary flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            发送提醒
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">材料清单</h3>
                    <span className="text-sm text-gray-500">
                      共 {caseDocuments.length} 项 · 
                      已通过 {caseDocuments.filter(d => d.status === 'approved').length} 项
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {caseDocuments.map(doc => (
                      <div 
                        key={doc.id} 
                        className={`p-4 rounded-lg border ${
                          doc.status === 'rejected' ? 'border-red-200 bg-red-50/30' :
                          doc.status === 'required' ? 'border-dashed border-gray-300' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDocStatusColor(doc.status)}`}>
                              {doc.status === 'approved' ? (
                                <FileCheck className="w-5 h-5" />
                              ) : doc.status === 'rejected' ? (
                                <X className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{doc.name}</h4>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDocStatusColor(doc.status)}`}>
                                  {getDocStatusText(doc.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span>{doc.category}</span>
                                {doc.uploadedAt && <span>{doc.uploadedAt}</span>}
                                {doc.uploader && <span>{doc.uploader}</span>}
                                {doc.size && <span>{doc.size}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.status === 'required' ? (
                              <button className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                上传
                              </button>
                            ) : (
                              <>
                                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                                  <Download className="w-4 h-4" />
                                </button>
                                {doc.status === 'rejected' && (
                                  <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {doc.rejectReason && (
                          <div className="mt-3 ml-13 pl-13">
                            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
                              驳回原因：{doc.rejectReason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="添加备注..."
                        className="input-field resize-none h-24"
                        disabled={submittingNote}
                      />
                      <div className="flex justify-end mt-2">
                        <button 
                          onClick={handleAddNote}
                          disabled={submittingNote || !newNote.trim()}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                          {submittingNote ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageSquare className="w-4 h-4" />
                          )}
                          {submittingNote ? '提交中...' : '添加备注'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>暂无备注</p>
                      </div>
                    ) : (
                      notes.map(note => (
                        <div key={note.id} className="flex gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{note.author}</span>
                              <span className="text-xs text-gray-400">{note.createdAt}</span>
                            </div>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {note.content}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">学生信息</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">学生姓名</p>
                <p className="font-medium text-gray-900">{caseData.studentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">学生编号</p>
                <p className="font-medium text-gray-900">{caseData.studentId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">申请院校</p>
                <p className="font-medium text-gray-900">{caseData.university}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">团队成员</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{caseData.consultant}</p>
                  <p className="text-xs text-gray-500">顾问主管</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{caseData.copywriter}</p>
                  <p className="text-xs text-gray-500">文案老师</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{caseData.visaAssistant}</p>
                  <p className="text-xs text-gray-500">签证助理</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
