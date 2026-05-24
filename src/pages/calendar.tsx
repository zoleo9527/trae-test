import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { formatDate, getDeadlineStatus, deadlineTypeLabels } from '../utils/format';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, XCircle, Clock, CheckCircle, Calendar as CalendarIcon } from 'lucide-react';

export default function Calendar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router, currentMonth, typeFilter]);

  async function loadData() {
    try {
      const start = formatDate(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = formatDate(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const [deadlinesRes, studentsRes] = await Promise.all([
        api.deadlines.list({ start, end, type: typeFilter }),
        api.students.list(),
      ]);
      
      setDeadlines(deadlinesRes.deadlines);
      setStudents(studentsRes.students);
    } catch (err) {
      console.error('Failed to load calendar data', err);
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const firstDayOfWeek = monthStart.getDay();
  const paddedDays = [...Array(firstDayOfWeek).fill(null), ...days];

  function getDeadlinesForDay(day: Date) {
    return deadlines.filter(d => isSameDay(new Date(d.date), day));
  }

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'document_submission', label: '材料提交' },
    { value: 'application_deadline', label: '申请截止' },
    { value: 'visa_appointment', label: '签证预约' },
    { value: 'tuition_payment', label: '学费缴纳' },
    { value: 'embarkation', label: '行前准备' },
  ];

  const overdueCount = deadlines.filter(d => !d.isCompleted && getDeadlineStatus(d.date) === 'overdue').length;
  const upcomingCount = deadlines.filter(d => !d.isCompleted && getDeadlineStatus(d.date) === 'upcoming').length;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">日历视图</h1>
            <p className="text-gray-500 mt-1">查看所有截点与重要日期</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
              <XCircle size={16} className="text-red-600" />
              <span className="text-sm text-red-700">已逾期 {overdueCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
              <Clock size={16} className="text-amber-600" />
              <span className="text-sm text-amber-700">7天内 {upcomingCount}</span>
            </div>
          </div>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
                {formatDate(currentMonth, 'yyyy年MM月')}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="btn-secondary text-sm"
              >
                今天
              </button>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-40"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {paddedDays.map((day, idx) => {
              if (!day) return <div key={idx} className="min-h-[120px] border-b border-r border-gray-100 bg-gray-50" />;
              
              const dayDeadlines = getDeadlinesForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] border-b border-r border-gray-100 p-2 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday(day) ? 'bg-primary-50' : ''}`}
                >
                  <div className={`text-sm mb-1 ${
                    isToday(day) 
                      ? 'w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center' 
                      : isCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayDeadlines.slice(0, 2).map(dl => {
                      const status = getDeadlineStatus(dl.date);
                      const student = students.find(s => s.id === dl.studentId);
                      return (
                        <div
                          key={dl.id}
                          className={`text-xs p-1.5 rounded truncate cursor-pointer hover:opacity-80 ${
                            dl.isCompleted 
                              ? 'bg-green-100 text-green-700' 
                              : status === 'overdue' 
                                ? 'bg-red-100 text-red-700' 
                                : status === 'upcoming'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                          }`}
                          onClick={() => router.push(`/students/${dl.studentId}`)}
                        >
                          <span className="font-medium">{student?.name}：</span>
                          {dl.title}
                        </div>
                      );
                    })}
                    {dayDeadlines.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayDeadlines.length - 2} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">本月截点列表</h3>
          <div className="space-y-3">
            {deadlines
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(dl => {
                const status = getDeadlineStatus(dl.date);
                const student = students.find(s => s.id === dl.studentId);
                return (
                  <div 
                    key={dl.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/students/${dl.studentId}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        dl.isCompleted ? 'bg-green-100' :
                        status === 'overdue' ? 'bg-red-100' :
                        status === 'upcoming' ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {dl.isCompleted ? <CheckCircle size={16} className="text-green-600" /> :
                         status === 'overdue' ? <XCircle size={16} className="text-red-600" /> :
                         <CalendarIcon size={16} className="text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{dl.title}</p>
                        <p className="text-sm text-gray-500">
                          {student?.name} · {deadlineTypeLabels[dl.type]}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      dl.isCompleted ? 'text-green-600' :
                      status === 'overdue' ? 'text-red-600' :
                      status === 'upcoming' ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      {formatDate(dl.date)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
