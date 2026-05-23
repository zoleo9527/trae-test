import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, Clock, Zap, Filter, ChevronDown, Plus, ArrowUpRight, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import {
  alarmLevelLabels,
  alarmLevelColors,
  alarmStatusLabels,
} from '../utils/status';
import { cn } from '../lib/utils';
import type { AlarmLevel, AlarmStatus } from '../types';
import CreateWorkOrderModal from '../components/CreateWorkOrderModal';

const levelFilters: { value: AlarmLevel | 'all'; label: string }[] = [
  { value: 'all', label: '全部等级' },
  { value: 'critical', label: '严重' },
  { value: 'warning', label: '重要' },
  { value: 'info', label: '一般' },
];

const statusFilters: { value: AlarmStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '活动' },
  { value: 'acknowledged', label: '已确认' },
  { value: 'resolved', label: '已解决' },
];

const chartData = [
  { time: '00:00', value: 1800, threshold: 2000 },
  { time: '02:00', value: 1900, threshold: 2000 },
  { time: '04:00', value: 1950, threshold: 2000 },
  { time: '06:00', value: 1700, threshold: 2000 },
  { time: '08:00', value: 1200, threshold: 2000 },
  { time: '10:00', value: 1100, threshold: 2000 },
  { time: '12:00', value: 1150, threshold: 2000 },
];

export default function Alarms() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<AlarmLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlarmStatus | 'all'>('all');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedAlarmId, setSelectedAlarmId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const navigate = useNavigate();
  const alarms = useStore((state) => state.alarms);
  const selectWorkOrder = useStore((state) => state.selectWorkOrder);
  const currentUser = useStore((state) => state.currentUser);

  const filteredAlarms = alarms.filter((alarm) => {
    const matchesSearch =
      alarm.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alarm.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || alarm.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || alarm.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MM-dd HH:mm', { locale: zhCN });
  };

  const stats = {
    total: alarms.length,
    critical: alarms.filter((a) => a.level === 'critical' && a.status !== 'resolved').length,
    warning: alarms.filter((a) => a.level === 'warning' && a.status !== 'resolved').length,
    active: alarms.filter((a) => a.status !== 'resolved').length,
  };

  const selectedAlarm = alarms.find((a) => a.id === selectedAlarmId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">全部告警</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-xs text-slate-500">严重告警</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.warning}</p>
              <p className="text-xs text-slate-500">重要告警</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              <p className="text-xs text-slate-500">活动告警</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="搜索告警类型或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowLevelDropdown(!showLevelDropdown);
                setShowStatusDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {levelFilters.find((f) => f.value === levelFilter)?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showLevelDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {levelFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setLevelFilter(filter.value);
                      setShowLevelDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                      levelFilter === filter.value ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowLevelDropdown(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-slate-300 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {statusFilters.find((f) => f.value === statusFilter)?.label}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      setStatusFilter(filter.value);
                      setShowStatusDropdown(false);
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                      statusFilter === filter.value ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">告警列表</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredAlarms.map((alarm) => (
              <div
                key={alarm.id}
                onClick={() => setSelectedAlarmId(alarm.id)}
                className={cn(
                  'p-4 cursor-pointer transition-colors',
                  selectedAlarmId === alarm.id ? 'bg-blue-50' : 'hover:bg-slate-50',
                  alarm.status === 'active' && alarm.level === 'critical' && 'bg-red-50/50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-3 h-3 rounded-full mt-1.5 flex-shrink-0', alarmLevelColors[alarm.level])} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-800">{alarm.type}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {alarmStatusLabels[alarm.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-1">{alarm.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{alarm.inverterId}</span>
                      <span>当前值: {alarm.currentValue}</span>
                      <span>{formatDate(alarm.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">告警详情</h3>
          </div>
          {selectedAlarm ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-3 h-3 rounded-full', alarmLevelColors[selectedAlarm.level])} />
                  <span className="font-semibold text-slate-800">{selectedAlarm.type}</span>
                </div>
                <p className="text-sm text-slate-600">{selectedAlarm.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">设备编号</p>
                  <p className="font-medium text-slate-800">{selectedAlarm.inverterId}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">告警等级</p>
                  <p className="font-medium text-slate-800">{alarmLevelLabels[selectedAlarm.level]}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">当前值</p>
                  <p className="font-medium text-red-600">{selectedAlarm.currentValue}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">阈值</p>
                  <p className="font-medium text-slate-800">{selectedAlarm.thresholdValue}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">发电数据趋势</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="threshold"
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {selectedAlarm.workorderId ? (
                <button
                  onClick={() => {
                    navigate('/workorders');
                    setTimeout(() => {
                      selectWorkOrder(selectedAlarm.workorderId!);
                    }, 100);
                  }}
                  className="w-full py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  查看关联工单
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={currentUser?.role === 'engineer'}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  创建巡检工单
                </button>
              )}
              {!selectedAlarm.workorderId && currentUser?.role === 'engineer' && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  请联系运维内勤或站长创建工单
                </p>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>选择一条告警查看详情</p>
            </div>
          )}
        </div>
      </div>

      <CreateWorkOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        alarm={selectedAlarm}
        onSuccess={(workOrderId) => {
          setSelectedAlarmId(null);
          navigate('/workorders');
          setTimeout(() => {
            selectWorkOrder(workOrderId);
          }, 100);
        }}
      />
    </div>
  );
}
