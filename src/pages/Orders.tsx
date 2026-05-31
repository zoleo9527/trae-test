import React from 'react';
import { OrderList } from '../components/order/OrderList';

export const Orders: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">订单管理</h1>
        <p className="text-gray-500">查看和管理所有预订订单</p>
      </div>
      <div className="flex-1 min-h-0">
        <OrderList />
      </div>
    </div>
  );
};
