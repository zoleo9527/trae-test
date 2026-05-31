'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { 
  ClipboardList, ChefHat, Package, AlertTriangle,
  TrendingDown, Clock, Users, DollarSign
} from 'lucide-react';

interface DashboardData {
  pendingOrders: number;
  todayProductions: number;
  lowStockMaterials: number;
  pendingRefunds: number;
  recentWaste: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get('/common/dashboard/summary');
      setData(res.data);
    } catch (error) {
      console.error('加载仪表盘失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: '待处理订单', value: data?.pendingOrders || 0, icon: <ClipboardList />, color: 'bg-blue-500' },
    { label: '今日生产任务', value: data?.todayProductions || 0, icon: <ChefHat />, color: 'bg-amber-500' },
    { label: '库存预警原料', value: data?.lowStockMaterials || 0, icon: <Package />, color: 'bg-red-500' },
    { label: '待审批退款', value: data?.pendingRefunds || 0, icon: <DollarSign />, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-red-500" />
            最近损耗记录
          </h3>
          <div className="space-y-3">
            {data?.recentWaste.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium text-sm">{item.material?.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.recordedBy?.name} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-medium">-{item.quantity} {item.material?.unit}</p>
                  <p className="text-xs text-gray-500">¥{item.totalAmount}</p>
                </div>
              </div>
            ))}
            {(!data?.recentWaste || data.recentWaste.length === 0) && (
              <p className="text-gray-400 text-center py-4">暂无损耗记录</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            快捷操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <ClipboardList size={24} className="text-blue-500 mb-2" />
              <p className="font-medium text-sm">新建订单</p>
              <p className="text-xs text-gray-500">快速录入客户订单</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <ChefHat size={24} className="text-amber-500 mb-2" />
              <p className="font-medium text-sm">生产排期</p>
              <p className="text-xs text-gray-500">安排今日生产任务</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <Package size={24} className="text-green-500 mb-2" />
              <p className="font-medium text-sm">原料入库</p>
              <p className="text-xs text-gray-500">登记原料采购入库</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <AlertTriangle size={24} className="text-red-500 mb-2" />
              <p className="font-medium text-sm">记录损耗</p>
              <p className="text-xs text-gray-500">登记生产损耗情况</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
