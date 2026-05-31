import React, { useState, useMemo } from 'react';
import { Calendar, Clock, ChefHat, AlertCircle, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useAuthStore } from '../../store/useAuthStore';
import { mockUsers } from '../../utils/mockData';
import { cn } from '../../lib/utils';
import type { Order } from '../../types';

interface ScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  existingScheduleId?: string;
}

const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  isOpen, 
  onClose, 
  order,
  existingScheduleId 
}) => {
  const { createSchedule, updateSchedule, checkCapacity, getSchedulesByDate, schedules } = useScheduleStore();
  const { updateOrderStatus, addOrderHistory, selectOrder } = useOrderStore();
  const { user } = useAuthStore();
  
  const existingSchedule = useMemo(() => {
    if (!existingScheduleId) return null;
    return schedules.find((s) => s.id === existingScheduleId) || null;
  }, [existingScheduleId, schedules]);

  const defaultDate = existingSchedule?.date || order.pickupTime.split(' ')[0];
  const [scheduleDate, setScheduleDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(existingSchedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingSchedule?.endTime || '11:00');
  const [chefId, setChefId] = useState(existingSchedule?.chefId || 'user-2');
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen && existingSchedule) {
      setScheduleDate(existingSchedule.date);
      setStartTime(existingSchedule.startTime);
      setEndTime(existingSchedule.endTime);
      setChefId(existingSchedule.chefId);
    } else if (isOpen && !existingSchedule) {
      setScheduleDate(order.pickupTime.split(' ')[0]);
      setStartTime('09:00');
      setEndTime('11:00');
      setChefId('user-2');
    }
  }, [isOpen, existingSchedule, order.pickupTime]);

  const capacity = useMemo(() => checkCapacity(scheduleDate), [scheduleDate, checkCapacity]);
  const daySchedules = useMemo(() => getSchedulesByDate(scheduleDate), [scheduleDate, getSchedulesByDate]);

  const chefs = mockUsers.filter((u) => u.role === 'chef');

  const isTimeSlotOccupied = (time: string) => {
    return daySchedules.some((s) => {
      if (existingScheduleId && s.id === existingScheduleId) return false;
      return s.startTime <= time && s.endTime > time;
    });
  };

  const getChefLoad = (chefId: string) => {
    return capacity.chefLoads[chefId] || { assigned: 0, max: 3 };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!scheduleDate) newErrors.date = '请选择排期日期';
    if (!startTime) newErrors.startTime = '请选择开始时间';
    if (!endTime) newErrors.endTime = '请选择结束时间';
    if (startTime >= endTime) newErrors.time = '结束时间必须晚于开始时间';
    if (!chefId) newErrors.chef = '请选择负责人';

    if (capacity.remainingCapacity <= 0 && !existingScheduleId) {
      newErrors.capacity = '当日产能已满，请选择其他日期';
    }

    const chefLoad = getChefLoad(chefId);
    if (chefLoad.assigned >= chefLoad.max && !existingScheduleId) {
      newErrors.chef = '该主厨当日产能已满';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (existingScheduleId) {
      updateSchedule(existingScheduleId, {
        date: scheduleDate,
        startTime,
        endTime,
        chefId,
      });
      
      if (['pending_review', 'reviewed'].includes(order.status)) {
        updateOrderStatus(
          order.id, 
          'scheduled', 
          `排期已确认：${scheduleDate} ${startTime}-${endTime}，负责人：${chefs.find(c => c.id === chefId)?.name}`,
          user?.name || '',
          user?.role || 'manager'
        );
      } else {
        addOrderHistory(order.id, {
          orderId: order.id,
          action: '更新排期',
          operator: user?.name || '',
          operatorRole: user?.role || 'manager',
          timestamp: new Date().toISOString(),
          remarks: `排期更新为 ${scheduleDate} ${startTime}-${endTime}，负责人：${chefs.find(c => c.id === chefId)?.name}`,
        });
      }
    } else {
      createSchedule({
        date: scheduleDate,
        orderId: order.id,
        chefId,
        startTime,
        endTime,
        status: 'scheduled',
      });
      updateOrderStatus(
        order.id, 
        'scheduled', 
        `排期已安排：${scheduleDate} ${startTime}-${endTime}，负责人：${chefs.find(c => c.id === chefId)?.name}`,
        user?.name || '',
        user?.role || 'manager'
      );
    }

    selectOrder(order.id);
    onClose();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleDate(e.target.value);
    if (errors.date || errors.capacity) {
      setErrors({ ...errors, date: '', capacity: '' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingScheduleId ? '调整排期' : '安排生产排期'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-bakery-brown-50 border border-bakery-brown-200 rounded-lg p-4">
          <p className="text-sm text-bakery-brown-800">
            <strong>订单：</strong>{order.orderNo} - {order.customerName}
          </p>
          <p className="text-xs text-bakery-brown-600 mt-1">
            取货时间：{order.pickupTime}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              排期日期 *
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={handleDateChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none ${
                errors.date || errors.capacity ? 'border-red-300' : 'border-gray-200'
              }`}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
            
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="text-gray-500">
                当日产能：{capacity.currentOrders}/{capacity.maxOrders} 单
              </span>
              <span className={cn(
                'font-medium',
                capacity.remainingCapacity <= 1 ? 'text-orange-500' : 'text-green-500'
              )}>
                剩余 {capacity.remainingCapacity} 单
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                开始时间 *
              </label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (errors.startTime || errors.time) {
                    setErrors({ ...errors, startTime: '', time: '' });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none bg-white ${
                  errors.startTime || errors.time ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                {timeSlots.slice(0, -1).map((time) => (
                  <option 
                    key={time} 
                    value={time}
                    disabled={isTimeSlotOccupied(time)}
                  >
                    {time} {isTimeSlotOccupied(time) ? '(已占用)' : ''}
                  </option>
                ))}
              </select>
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                结束时间 *
              </label>
              <select
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (errors.endTime || errors.time) {
                    setErrors({ ...errors, endTime: '', time: '' });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-bakery-brown-500 focus:border-transparent transition-all outline-none bg-white ${
                  errors.endTime || errors.time ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                {timeSlots.slice(1).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ChefHat className="w-4 h-4 inline mr-2" />
              负责人 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {chefs.map((chef) => {
                const load = getChefLoad(chef.id);
                const isFull = load.assigned >= load.max && !existingScheduleId;
                return (
                  <button
                    key={chef.id}
                    type="button"
                    onClick={() => {
                      if (!isFull) {
                        setChefId(chef.id);
                        if (errors.chef) setErrors({ ...errors, chef: '' });
                      }
                    }}
                    disabled={isFull}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                      chefId === chef.id
                        ? 'border-bakery-brown-500 bg-bakery-brown-50'
                        : isFull
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-bakery-brown-300'
                    )}
                  >
                    <img
                      src={chef.avatar}
                      alt={chef.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">{chef.name}</p>
                      <p className="text-xs text-gray-500">
                        {load.assigned}/{load.max} 单
                      </p>
                    </div>
                    {chefId === chef.id && (
                      <Check className="w-5 h-5 text-bakery-brown-500 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
            {errors.chef && <p className="text-xs text-red-500 mt-1">{errors.chef}</p>}
          </div>

          {daySchedules.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">当日已有排期</p>
              <div className="space-y-2">
                {daySchedules.map((s) => {
                  if (existingScheduleId && s.id === existingScheduleId) return null;
                  const orderInfo = order.id === s.orderId ? order : null;
                  return (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="bg-bakery-brown-100 text-bakery-brown-700 px-2 py-0.5 rounded">
                        {s.startTime}-{s.endTime}
                      </span>
                      <span>{orderInfo?.customerName || '订单 ' + s.orderId.slice(-4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="flex-1 py-3 bg-bakery-brown-500 text-white rounded-xl font-medium hover:bg-bakery-brown-600 transition-colors"
          >
            {existingScheduleId ? '确认调整' : '确认排期'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
