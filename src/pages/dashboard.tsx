import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { formatDate, statusLabels, getDeadlineStatus, deadlineTypeLabels, issueCategoryLabels, priorityLabels } from '../utils/format';
import { Users, FileText, Calendar, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ students: 0, pendingDocs: 0, upcomingDeadlines: 0, openIssues: 0 });
  const [recentDeadlines, setRecentDeadlines] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

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
      const [studentsRes, deadlinesRes, issuesRes] = await Promise.all([
        api.students.list(),
        api.deadlines.list(),
        api.issues.list(),
      ]);

      setStudents(studentsRes.students);
      
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcoming = deadlinesRes.deadlines
        .filter(d => !d.isCompleted && new Date(d.date) <= sevenDaysLater)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

      setRecentDeadlines(upcoming);
      setIssues(issuesRes.issues.filter(i => i.status !== 'resolved' && i.status !== 'closed').slice(0, 5));

      const pendingDocs = studentsRes.students.reduce((acc, s) => {
        return acc;
      }, 0);

      setStats({
        students: studentsRes.students.length,
        pendingDocs: 6,
        upcomingDeadlines: upcoming.length,
        openIssues: issuesRes.issues.filter(i => i.status === 'open' || i.status === 'in_progress').length,
      });
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  const statCards = [
    { label: '学生总数', value: stats.students, icon: <Users size={24} />, color: 'bg-blue-50 text-blue-600' },
    { label: '待处理文档', value: stats.pendingDocs, icon: <FileText size={24} />, color: 'bg-amber-50 text-amber-600' },
    { label: '即将到期截点', value: stats.upcomingDeadlines, icon: <Calendar size={24} />, color: 'bg-purple-50 text-purple-600' },
    { label: '待解决问题', value: stats.openIssues, icon: <AlertTriangle size={24} />, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{user.name}</h1>
          <p className="text-gray-500 mt-1">这是您的工作概览</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">即将到来的截点</h2>
              <button onClick={() => router.push('/calendar')} className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              {recentDeadlines.map((deadline) => {
                const status = getDeadlineStatus(deadline.date);
                const student = students.find(s => s.id === deadline.studentId);
                return (
                  <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        status === 'overdue' ? 'bg-red-100' : status === 'upcoming' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {status === 'overdue' ? <XCircle size={18} className="text-red-600" /> : 
                         status === 'upcoming' ? <Clock size={18} className="text-amber-600" /> :
                         <CheckCircle size={18} className="text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{deadline.title}</p>
                        <p className="text-sm text-gray-500">
                          {student?.name} · {deadlineTypeLabels[deadline.type]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        status === 'overdue' ? 'text-red-600' : status === 'upcoming' ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {formatDate(deadline.date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {status === 'overdue' ? '已逾期' : status === 'upcoming' ? '7天内' : ''}
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
              <h2 className="text-lg font-semibold text-gray-900">待处理问题</h2>
              <button onClick={() => router.push('/issues')} className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </button>
            </div>
            <div className="space-y-3">
              {issues.map((issue) => (
                <div key={issue.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
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
              ))}
              {issues.length === 0 && (
                <p className="text-center text-gray-500 py-8">暂无待处理问题</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
