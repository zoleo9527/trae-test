import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { formatDate, getDeadlineStatus, deadlineTypeLabels, issueCategoryLabels, priorityLabels, statusLabels } from '../utils/format';
import { Users, FileText, Calendar, AlertTriangle, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  async function loadData() {
    try {
      const res = await api.dashboard.getStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }

  if (loading || !user || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  const { stats, roleSpecificData, recentDeadlines, recentIssues, recentDocsForCopywriter } = data;

  const getStatCards = () => {
    const baseCards = [
      { label: '学生总数', value: stats.students, icon: <Users size={24} />, color: 'bg-blue-50 text-blue-600' },
      { label: '待处理文档', value: stats.pendingDocs, icon: <FileText size={24} />, color: 'bg-amber-50 text-amber-600' },
      { label: '即将到期', value: stats.upcomingDeadlines, icon: <Calendar size={24} />, color: 'bg-purple-50 text-purple-600' },
      { label: '待解决问题', value: stats.openIssues, icon: <AlertTriangle size={24} />, color: 'bg-red-50 text-red-600' },
    ];

    if (user.role === 'consultant_manager') {
      return [
        ...baseCards,
        { label: '已逾期截点', value: stats.overdueCount, icon: <XCircle size={24} />, color: 'bg-red-100 text-red-700' },
      ];
    }
    if (user.role === 'copywriter') {
      return [
        ...baseCards.slice(0, 2),
        { label: '待审核文档', value: roleSpecificData.docsByStatus?.review || 0, icon: <FileText size={24} />, color: 'bg-purple-50 text-purple-600' },
        { label: '已逾期', value: roleSpecificData.docsByStatus?.overdue || 0, icon: <XCircle size={24} />, color: 'bg-red-50 text-red-600' },
      ];
    }
    if (user.role === 'visa_assistant') {
      return [
        ...baseCards.slice(0, 3),
        { label: '即将面签', value: roleSpecificData.upcomingAppointments, icon: <Clock size={24} />, color: 'bg-green-50 text-green-600' },
        { label: '退款中', value: roleSpecificData.visaByStatus?.refund_in_progress || 0, icon: <AlertTriangle size={24} />, color: 'bg-orange-50 text-orange-600' },
      ];
    }
    return baseCards;
  };

  const statCards = getStatCards();

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{user.name}</h1>
          <p className="text-gray-500 mt-1">
            {user.role === 'consultant_manager' && '顾问主管视图 - 全局进度概览'}
            {user.role === 'copywriter' && '文案老师视图 - 专注文书任务'}
            {user.role === 'visa_assistant' && '签证助理视图 - 签证进度管理'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((stat) => (
            <div key={stat.label} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {user.role === 'consultant_manager' && roleSpecificData.studentByStatus && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">学生进度分布</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(roleSpecificData.studentByStatus).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{value as number}</p>
                  <p className="text-xs text-gray-500 mt-1">{statusLabels[key] || key}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.role === 'copywriter' && roleSpecificData.docsByStatus && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">我的文档状态</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(roleSpecificData.docsByStatus).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{value as number}</p>
                  <p className="text-xs text-gray-500 mt-1">{statusLabels[key] || key}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {user.role === 'visa_assistant' && roleSpecificData.visaByStatus && (
          <div className="card p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">签证进度分布</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(roleSpecificData.visaByStatus).map(([key, value]) => (
                <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{value as number}</p>
                  <p className="text-xs text-gray-500 mt-1">{statusLabels[key] || key}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {user.role === 'visa_assistant' ? '签证预约' : '即将到来的截点'}
              </h2>
              <button onClick={() => router.push('/calendar')} className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              {recentDeadlines.map((deadline: any) => {
                const status = getDeadlineStatus(deadline.date);
                return (
                  <div 
                    key={deadline.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/students/${deadline.studentId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        deadline.isCompleted ? 'bg-green-100' :
                        status === 'overdue' ? 'bg-red-100' : status === 'upcoming' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {deadline.isCompleted ? <CheckCircle size={18} className="text-green-600" /> :
                         status === 'overdue' ? <XCircle size={18} className="text-red-600" /> :
                         status === 'upcoming' ? <Clock size={18} className="text-amber-600" /> :
                         <Calendar size={18} className="text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{deadline.title}</p>
                        <p className="text-sm text-gray-500">
                          {deadline.studentName} · {deadlineTypeLabels[deadline.type]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        deadline.isCompleted ? 'text-green-600' :
                        status === 'overdue' ? 'text-red-600' : status === 'upcoming' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {formatDate(deadline.date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {deadline.isCompleted ? '已完成' : status === 'overdue' ? '已逾期' : status === 'upcoming' ? '7天内' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              {recentDeadlines.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无即将到期的截点</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {user.role === 'copywriter' ? '待审核文书' : 
                 user.role === 'visa_assistant' ? '退款处理中' : '待处理问题'}
              </h2>
              <button onClick={() => router.push(
                user.role === 'copywriter' ? '/students' : 
                user.role === 'visa_assistant' ? '/students' : '/issues'
              )} className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              {user.role === 'copywriter' && recentDocsForCopywriter && recentDocsForCopywriter.length > 0 ? (
                recentDocsForCopywriter.map((doc: any) => (
                  <div 
                    key={doc.id} 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/students/${doc.studentId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{doc.studentName}</p>
                      </div>
                      <span className="status-badge status-review">待审核</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">版本 v{doc.currentVersion}</span>
                      {doc.deadline && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className={`text-xs ${getDeadlineStatus(doc.deadline) === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                            截止 {formatDate(doc.deadline)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : user.role === 'visa_assistant' && roleSpecificData.refundInProgressList && roleSpecificData.refundInProgressList.length > 0 ? (
                roleSpecificData.refundInProgressList.map((visa: any) => (
                  <div 
                    key={visa.id} 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 border-l-4 border-orange-400"
                    onClick={() => router.push(`/students/${visa.studentId}?tab=visa`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{visa.studentName}</p>
                        <p className="text-xs text-gray-500 mt-1">{visa.country}学生签证</p>
                      </div>
                      <span className="status-badge status-rejected">退款中</span>
                    </div>
                    <div className="mt-2">
                      {visa.refundAmount && (
                        <p className="text-xs text-orange-700 font-medium">退款金额: ¥{visa.refundAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                recentIssues.map((issue: any) => (
                  <div 
                    key={issue.id} 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/issues`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{issue.studentName}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        issue.priority === 'critical' ? 'bg-red-100 text-red-700' :
                        issue.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        issue.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {priorityLabels[issue.priority]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{issueCategoryLabels[issue.category]}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{statusLabels[issue.status]}</span>
                    </div>
                  </div>
                ))
              )}
              {((user.role === 'copywriter' && (!recentDocsForCopywriter || recentDocsForCopywriter.length === 0)) ||
                (user.role === 'visa_assistant' && (!roleSpecificData.refundInProgressList || roleSpecificData.refundInProgressList.length === 0)) ||
                (user.role !== 'copywriter' && user.role !== 'visa_assistant' && recentIssues.length === 0)) && (
                <p className="text-center text-gray-500 py-8">
                  {user.role === 'copywriter' ? '暂无待审核文书' : 
                   user.role === 'visa_assistant' ? '暂无退款中签证' : '暂无待处理问题'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
