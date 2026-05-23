import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import withAuth from '../hoc/withAuth';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [powerData, setPowerData] = useState([]);
  const [powerByArea, setPowerByArea] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewRes, activitiesRes, powerDataRes, powerByAreaRes] = await Promise.all([
        api.dashboard.getOverview(),
        api.dashboard.getActivities(),
        api.powerData.getHourly(),
        api.powerData.getByArea(),
      ]);

      setOverview(overviewRes);
      setActivities(activitiesRes);
      setPowerData(powerDataRes);
      setPowerByArea(powerByAreaRes);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('zh-CN', { 
      style: 'currency', 
      currency: 'CNY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPower = (watts) => {
    if (watts >= 1000000) return (watts / 1000000).toFixed(2) + ' MW';
    if (watts >= 1000) return (watts / 1000).toFixed(1) + ' kW';
    return watts + ' W';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">早上好，{user?.name}</p>
            <h1 className="text-2xl font-bold mt-1">{user?.stationName}</h1>
            <p className="text-blue-100 mt-2">今日是并网运维的关键时期，请注意跟进资料审核与回款进度</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">今日发电量</p>
            <p className="text-4xl font-bold">{(overview?.power?.generated / 1000).toFixed(1)} kWh</p>
            <p className="text-blue-200 text-sm">完成率 {overview?.power?.completionRate}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📄</span>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
              {overview?.gridDocs?.pending + overview?.gridDocs?.supplement} 待处理
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">并网资料</p>
          <p className="text-2xl font-bold text-gray-800">{overview?.gridDocs?.total} 份</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-green-600">✓ {overview?.gridDocs?.total - overview?.gridDocs?.pending - overview?.gridDocs?.rejected - overview?.gridDocs?.supplement} 已通过</span>
            <span className="text-red-600">✕ {overview?.gridDocs?.rejected} 已驳回</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">💰</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {overview?.payment?.paymentRate}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">回款进度</p>
          <p className="text-2xl font-bold text-gray-800">{formatMoney(overview?.payment?.paidAmount)}</p>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${overview?.payment?.paymentRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">待回款 {formatMoney(overview?.payment?.pendingAmount)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">🔧</span>
            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full">
              {overview?.workOrders?.inProgress} 处理中
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">工单数</p>
          <p className="text-2xl font-bold text-gray-800">{overview?.workOrders?.total}</p>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-orange-600">⏳ {overview?.workOrders?.pending} 待分配</span>
            <span className="text-red-600">⚠️ 停机 {Math.floor(overview?.workOrders?.todayDowntime / 60)}小时</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xl">📦</span>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
              {overview?.spareParts?.lowStock} 库存低
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">备件种类</p>
          <p className="text-2xl font-bold text-gray-800">{overview?.spareParts?.total} 种</p>
          <p className="text-xs text-gray-400 mt-3">请及时补充库存不足的备件</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">📈 今日发电曲线</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={powerData}>
              <defs>
                <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatPower(value)} />
              <Area type="monotone" dataKey="power" stroke="#3B82F6" fill="url(#colorPower)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">📊 各区域发电</h3>
          <div className="space-y-4">
            {powerByArea.map((area, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{area.name}</span>
                  <span className="text-sm text-gray-500">{area.rate}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      area.rate >= 95 ? 'bg-green-500' : area.rate >= 90 ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${area.rate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>实时 {formatPower(area.power)}</span>
                  <span>今日 {(area.today / 1000).toFixed(1)} kWh</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">📋 最近动态</h3>
        <div className="grid grid-cols-2 gap-4">
          {activities.slice(0, 6).map((activity, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-xl">
                {activity.type === 'workorder' ? '🔧' : activity.type === 'griddoc' ? '📄' : '💰'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.content}</p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {activity.time?.slice(5, 16)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
