import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { formatDate, statusLabels, documentTypeLabels, getDeadlineStatus } from '../../utils/format';
import { ArrowLeft, FileText, Calendar, Passport, MessageSquare, Clock, CheckCircle2, Upload, Send } from 'lucide-react';

export default function StudentDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

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
    } catch (err) {
      console.error('Failed to load student data', err);
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

  async function handleDocumentStatus(docId: string, status: string) {
    try {
      await api.documents.updateStatus(docId, status);
      loadStudentData();
    } catch (err) {
      console.error('Failed to update document status', err);
    }
  }

  if (loading || !user || !data) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const { student, documents, deadlines, visa, messages, activityLogs } = data;
  const tabs = [
    { id: 'documents', label: '文书材料', icon: <FileText size={18} /> },
    { id: 'deadlines', label: '截点日历', icon: <Calendar size={18} /> },
    { id: 'visa', label: '签证进度', icon: <Passport size={18} /> },
    { id: 'messages', label: '沟通记录', icon: <MessageSquare size={18} /> },
    { id: 'activity', label: '操作历史', icon: <Clock size={18} /> },
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

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
                      <p className="text-sm text-amber-700 mt-2 bg-amber-50 p-2 rounded">
                        反馈：{doc.feedback}
                      </p>
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
                        <div key={v.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400" />
                            <span className="text-gray-900">v{v.version} - {v.fileName}</span>
                            {v.comment && <span className="text-gray-500">· {v.comment}</span>}
                          </div>
                          <span className="text-gray-500">{formatDate(v.uploadedAt, 'yyyy-MM-dd HH:mm')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button className="btn-secondary text-sm flex items-center gap-2">
                    <Upload size={16} />
                    上传新版本
                  </button>
                  {doc.status === 'review' && (
                    <>
                      <button 
                        onClick={() => handleDocumentStatus(doc.id, 'approved')}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        通过
                      </button>
                      <button 
                        onClick={() => handleDocumentStatus(doc.id, 'rejected')}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        退回修改
                      </button>
                    </>
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
                    <div>
                      <h3 className="font-medium text-gray-900">{dl.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{dl.description}</p>
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
                        {dl.isCompleted ? '已完成' : status === 'overdue' ? '已逾期' : ''}
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
                <h3 className="font-medium text-gray-900">{visa.country}学生签证</h3>
                <span className={`status-badge status-${visa.status === 'documents_preparing' ? 'in_progress' : visa.status} mt-2`}>
                  {statusLabels[visa.status]}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">预约日期</p>
                <p className="text-gray-900">{visa.appointmentDate || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">提交日期</p>
                <p className="text-gray-900">{visa.submissionDate || '-'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">进度记录</h4>
              <div className="space-y-3">
                {visa.notes.map((note: any) => (
                  <div key={note.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 mt-2 rounded-full ${
                      note.type === 'issue' ? 'bg-red-500' :
                      note.type === 'resolution' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-900">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(note.createdAt, 'yyyy-MM-dd HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
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
      </div>
    </Layout>
  );
}
