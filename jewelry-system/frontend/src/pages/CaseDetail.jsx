import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Download
} from 'lucide-react';
import { visaCases } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorState } from '../components/common/ErrorState';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function CaseDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('timeline');
  const [newNote, setNewNote] = useState('');
  
  const caseData = visaCases.find(c => c.id === id);

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

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/cases" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{caseData.studentName}</h1>
            <StatusBadge status={caseData.status} text={caseData.statusText} />
            <StatusBadge status={caseData.priority} text={caseData.priority === 'urgent' ? '紧急' : caseData.priority === 'high' ? '高' : caseData.priority === 'medium' ? '中' : '低'} variant="priority" />
          </div>
          <p className="text-sm text-gray-500">{caseData.id} · {caseData.country} · {caseData.visaType}</p>
        </div>
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
                  { id: 'notes', label: '备注' }
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
                          <StatusBadge status={supplement.status} text={
                            supplement.status === 'required' ? '待提交' :
                            supplement.status === 'under_review' ? '审核中' :
                            supplement.status === 'approved' ? '已通过' : '已驳回'
                          } />
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>截止日期: {supplement.requiredDate}</span>
                          </div>
                        </div>

                        {supplement.uploads.length > 0 && (
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
                                        v{upload.version} · {upload.uploadDate} · {upload.uploader}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {upload.status && (
                                      <StatusBadge status={upload.status} text={
                                        upload.status === 'reviewing' ? '审核中' : '已驳回'
                                      } />
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
                          <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            上传材料
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
                      />
                      <div className="flex justify-end mt-2">
                        <button className="btn-primary flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          添加备注
                        </button>
                      </div>
                    </div>
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
