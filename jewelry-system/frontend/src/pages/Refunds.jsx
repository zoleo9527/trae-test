import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Download,
  Upload,
  User,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';

export default function Refunds() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.getRefunds();
      setRefunds(res.data || []);
      if (res.data && res.data.length > 0 && !selectedCase) {
        setSelectedCase(res.data[0].id);
      }
    } catch (err) {
      toast.error(`加载退款数据失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, []);

  const selectedCaseData = refunds.find(r => r.id === selectedCase);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedCase) return;

    setSendingMessage(true);
    try {
      await api.addRefundMessage(selectedCase, messageInput);
      toast.success('消息发送成功');
      setMessageInput('');
      
      const res = await api.getRefunds();
      setRefunds(res.data || []);
    } catch (err) {
      toast.error(`发送失败: ${err.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleApprove = async () => {
    toast.info('确认退款功能开发中');
  };

  const handleReject = async () => {
    toast.info('拒绝退款功能开发中');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'reviewing':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'pending':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState text="正在加载退款申请..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">退款协商</h2>
        <button 
          onClick={loadRefunds}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">退款申请列表</h3>
          </div>
          
          {refunds.length === 0 ? (
            <EmptyState
              icon="empty"
              title="暂无退款申请"
              description="所有案件进展顺利"
            />
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {refunds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedCase(r.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedCase === r.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getStatusColor(r.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{r.studentName}</h4>
                        <StatusBadge status={r.status} text={r.statusText} />
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{r.caseId}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          ¥{r.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">{r.requestedDate}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedCaseData ? (
            <div className="card h-full flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedCaseData.studentName} 的退款申请
                    </h2>
                    <StatusBadge status={selectedCaseData.status} text={selectedCaseData.statusText} />
                  </div>
                  <p className="text-sm text-gray-500">{selectedCaseData.caseId}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ¥{selectedCaseData.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">申请金额</p>
                </div>
              </div>

              {selectedCaseData.case && (
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">关联签证案件</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-blue-600">国家</p>
                      <p className="text-sm font-medium text-blue-900">{selectedCaseData.case.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">签证类型</p>
                      <p className="text-sm font-medium text-blue-900">{selectedCaseData.case.visaType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">院校</p>
                      <p className="text-sm font-medium text-blue-900">{selectedCaseData.case.university}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">顾问</p>
                      <p className="text-sm font-medium text-blue-900">{selectedCaseData.case.consultant}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link 
                      to={`/cases/${selectedCaseData.caseId}`}
                      className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      查看案件详情
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">申请原因</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{selectedCaseData.reason}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">申请日期</p>
                        <p className="font-medium text-gray-900">{selectedCaseData.requestedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">处理截止</p>
                        <p className="font-medium text-amber-600">{selectedCaseData.deadline}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="text-sm font-medium text-gray-500 mb-3">所需材料</h3>
                <div className="space-y-2 mb-6">
                  {selectedCaseData.documents?.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${doc.uploaded ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`${doc.uploaded ? 'text-gray-900' : 'text-gray-500'}`}>
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.uploaded ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors">
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button className="btn-secondary text-sm py-1 px-3 flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            上传
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-medium text-gray-500 mb-3">沟通记录</h3>
                <div className="border border-gray-200 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                  <div className="space-y-4">
                    {selectedCaseData.messages?.map((msg) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{msg.author}</span>
                            <span className="text-xs text-gray-400">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="输入沟通内容..."
                      className="input-field pr-12"
                      disabled={sendingMessage}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {sendingMessage ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <button className="btn-secondary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    联系学生
                  </button>
                  <button onClick={handleReject} className="btn-danger">拒绝退款</button>
                  <button onClick={handleApprove} className="btn-primary">确认退款</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-full flex items-center justify-center">
              <EmptyState
                icon="empty"
                title="请选择退款申请"
                description="从左侧列表选择一个退款申请查看详情"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
