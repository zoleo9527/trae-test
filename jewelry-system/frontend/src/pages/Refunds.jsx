import { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { refundCases } from '../data/mockData';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';

export default function Refunds() {
  const [selectedCase, setSelectedCase] = useState(refundCases[0]?.id || null);

  const selectedCaseData = refundCases.find(c => c.id === selectedCase);

  const getStatusColor = (status) => {
    switch (status) {
      case 'reviewing':
        return 'bg-blue-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">退款申请列表</h3>
          </div>
          
          {refundCases.length === 0 ? (
            <EmptyState
              icon="empty"
              title="暂无退款申请"
              description="所有案件进展顺利"
            />
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {refundCases.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedCase === c.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${getStatusColor(c.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{c.studentName}</h4>
                        <StatusBadge status={c.status} text={c.statusText} />
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{c.caseId}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          ¥{c.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">{c.requestedDate}</span>
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
            <div className="card h-full">
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

              <div className="p-6">
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
                  {selectedCaseData.documents.map((doc) => (
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
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">系统</span>
                          <span className="text-xs text-gray-400">2024-01-20 10:30</span>
                        </div>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          退款申请已提交，等待材料审核
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="输入沟通内容..."
                      className="input-field pr-12"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="btn-secondary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    联系学生
                  </button>
                  <button className="btn-danger">拒绝退款</button>
                  <button className="btn-primary">确认退款</button>
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
