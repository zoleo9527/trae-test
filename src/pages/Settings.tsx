import React from 'react';
import { User, Bell, Shield, Database, RotateCcw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();

  const handleResetData = () => {
    if (confirm('确定要重置所有数据吗？此操作不可撤销。')) {
      localStorage.removeItem('bakery_orders');
      localStorage.removeItem('bakery_schedules');
      localStorage.removeItem('bakery_capacity_configs');
      localStorage.removeItem('bakery_communications');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">系统设置</h1>
        <p className="text-gray-500">管理系统配置和个人偏好</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-bakery-brown-500" />
          个人信息
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500">
                {user?.role === 'manager' && '门店主理人'}
                {user?.role === 'chef' && '后厨负责人'}
                {user?.role === 'customer_service' && '客服'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-bakery-brown-500" />
          通知设置
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">订单状态变更通知</p>
              <p className="text-sm text-gray-500">订单状态变更时收到通知</p>
            </div>
            <div className="w-12 h-6 bg-bakery-brown-500 rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">逾期订单提醒</p>
              <p className="text-sm text-gray-500">订单逾期时收到提醒</p>
            </div>
            <div className="w-12 h-6 bg-bakery-brown-500 rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">改单/退款申请通知</p>
              <p className="text-sm text-gray-500">有新的改单或退款申请时通知</p>
            </div>
            <div className="w-12 h-6 bg-bakery-brown-500 rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-bakery-brown-500" />
          权限说明
        </h2>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-bakery-brown-50 rounded-xl">
            <p className="font-medium text-bakery-brown-800 mb-1">门店主理人</p>
            <p className="text-bakery-brown-600">
              全局概览、订单审核、产能配置、数据复盘、所有权限
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-xl">
            <p className="font-medium text-green-800 mb-1">后厨负责人</p>
            <p className="text-green-600">
              产能排期、生产确认、原料损耗记录、异常上报
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="font-medium text-blue-800 mb-1">客服</p>
            <p className="text-blue-600">
              订单录入、改单处理、退款申请、客户沟通记录
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-bakery-brown-500" />
          数据管理
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">重置演示数据</p>
              <p className="text-sm text-gray-500">
                清除所有本地数据，恢复初始演示状态
              </p>
            </div>
            <button
              onClick={handleResetData}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置数据
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">关于系统</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>手作烘焙坊 - 预订接单与产能排期系统</strong>
          </p>
          <p>版本：1.0.0（演示版）</p>
          <p>
            本系统为演示版本，所有数据存储于浏览器本地存储中。
          </p>
          <p className="text-gray-400">
            简化说明：无真实后端、无真实认证、简化的产能算法、无文件上传
          </p>
        </div>
      </div>
    </div>
  );
};
