'use client';

import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/services/api';
import { Booking } from '@/types';
import { formatCurrency, getBookingStatusColor, getBookingStatusLabel } from '@/utils/format';
import { AlertCircle, Calendar, CheckCircle, Clock, TrendingUp, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CoachPage() {
  const [bookings, setBookings] = useState<(Booking & { member_name?: string; bay_name?: string })[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    todayLessons: 0,
    completedLessons: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
  });

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const loadBookings = async () => {
    try {
      const res = await api.get<{ items: Booking[] }>(
        `/bookings?booking_date_start=${selectedDate}&booking_date_end=${selectedDate}&pageSize=50`
      );
      if (res.success) {
        setBookings(res.data?.items || []);
      }

      const membersRes = await api.get<{ total: number }>('/members?pageSize=1');
      if (membersRes.success) {
        setStats((s) => ({ ...s, totalStudents: membersRes.data?.total || 0 }));
      }
    } catch (e) {
      console.error('Load error:', e);
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.put(`/bookings/${id}/checkin`);
      loadBookings();
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await api.put(`/bookings/${id}/complete`);
      loadBookings();
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const getBookingsForSlot = (time: string) => {
    return bookings.filter((b) => b.start_time <= time && b.end_time > time);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日课程</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{bookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Calendar size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {bookings.filter((b) => b.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学员总数</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <User size={24} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月营收</p>
                <p className="text-3xl font-bold text-gold-800 mt-1">—</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-800 text-lg">课程时间表</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  ‹
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field w-40"
                />
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {getTimeSlots().map((time) => {
                const slotBookings = getBookingsForSlot(time);
                return (
                  <div key={time} className="flex min-h-16 border-b border-gray-100 py-2">
                    <div className="w-20 flex-shrink-0 text-sm text-gray-500 pt-2">{time}</div>
                    <div className="flex-1 flex gap-2 flex-wrap">
                      {slotBookings.length > 0 ? (
                        slotBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className={`flex-1 min-w-48 p-3 rounded-lg border-l-4 ${
                              booking.status === 'completed'
                                ? 'bg-gray-50 border-gray-400'
                                : booking.status === 'checked_in'
                                ? 'bg-yellow-50 border-yellow-500'
                                : 'bg-blue-50 border-blue-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{booking.member_name}</span>
                              <span className={`badge ${getBookingStatusColor(booking.status)}`}>
                                {getBookingStatusLabel(booking.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <Clock size={12} />
                              {booking.start_time} - {booking.end_time} · {booking.bay_name} ·{' '}
                              {booking.duration_minutes}分钟
                            </div>
                            <div className="flex gap-2">
                              {booking.status === 'booked' && (
                                <button
                                  onClick={() => handleConfirm(booking.id)}
                                  className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                >
                                  确认签到
                                </button>
                              )}
                              {booking.status === 'checked_in' && (
                                <button
                                  onClick={() => handleComplete(booking.id)}
                                  className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                >
                                  完成课程
                                </button>
                              )}
                              <span className="text-xs font-medium text-primary-600">
                                {formatCurrency(booking.total_amount)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex-1 flex items-center text-gray-300 text-sm">
                          <AlertCircle size={14} className="mr-2" />
                          空闲时段
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">今日学员</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                        {booking.member_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{booking.member_name}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {booking.start_time} · {booking.bay_name}
                        </p>
                      </div>
                      <span className={`badge ${getBookingStatusColor(booking.status)} text-xs`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">今日暂无课程安排</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">快捷操作</h3>
              <div className="space-y-2">
                <button className="w-full btn-primary text-left flex items-center gap-3">
                  <Calendar size={18} />
                  预约课程
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <User size={18} />
                  学员管理
                </button>
                <button className="w-full btn-secondary text-left flex items-center gap-3">
                  <TrendingUp size={18} />
                  个人绩效
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
