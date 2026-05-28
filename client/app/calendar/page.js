'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Layout from '../../components/Layout';
import { api } from '../../lib/api';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Ship,
  CreditCard,
  Users,
  Package
} from 'lucide-react';

const EVENT_TYPES = {
  berth: { label: '靠泊', color: 'bg-blue-500', icon: Ship },
  payment: { label: '付款到期', color: 'bg-green-500', icon: CreditCard },
  document: { label: '证件到期', color: 'bg-red-500', icon: Users },
  supply: { label: '补给交付', color: 'bg-purple-500', icon: Package },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
      const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');

      const [berths, payments, alerts] = await Promise.all([
        api.berth.list({ startDate: startOfMonth, endDate: endOfMonth }),
        api.payments.list(),
        api.alerts.list({ status: 'pending' }),
      ]);

      const allEvents = [];

      berths.forEach(b => {
        if (b.arrival_date) {
          allEvents.push({
            id: `berth-${b.id}`,
            type: 'berth',
            title: `${b.ship_name} 靠泊`,
            date: dayjs(b.arrival_date).format('YYYY-MM-DD'),
            data: b,
            status: b.status
          });
        }
      });

      payments.forEach(p => {
        if (p.due_date) {
          allEvents.push({
            id: `payment-${p.id}`,
            type: p.status === 'overdue' ? 'document' : 'payment',
            title: `${p.supplier} 到期`,
            date: dayjs(p.due_date).format('YYYY-MM-DD'),
            data: p,
            status: p.status
          });
        }
      });

      alerts.forEach(a => {
        if (a.due_date) {
          allEvents.push({
            id: `alert-${a.id}`,
            type: a.type,
            title: a.title,
            date: dayjs(a.due_date).format('YYYY-MM-DD'),
            data: a,
            priority: a.priority
          });
        }
      });

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const startDay = startOfMonth.startOf('week');
    const endDay = endOfMonth.endOf('week');
    
    const days = [];
    let day = startDay;

    while (day.isBefore(endDay)) {
      const dayEvents = events.filter(e => dayjs(e.date).isSame(day, 'day'));
      days.push({
        date: day,
        events: dayEvents,
        isCurrentMonth: day.isSame(currentDate, 'month'),
        isToday: day.isSame(dayjs(), 'day'),
      });
      day = day.add(1, 'day');
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const goToPrevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const goToNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));
  const goToToday = () => setCurrentDate(dayjs());

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日历视图</h1>
          <p className="text-gray-500 mt-1">查看靠泊、费用、证件等重要日程</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold">
                {currentDate.format('YYYY年 M月')}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="btn btn-secondary text-sm ml-4"
              >
                今天
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {Object.entries(EVENT_TYPES).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${value.color}`} />
                  <span className="text-sm text-gray-600">{value.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            
            {calendarDays.map((day, index) => {
              const dayStr = day.date.format('D');
              const isWeekend = day.date.day() === 0 || day.date.day() === 6;
              
              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border rounded-lg cursor-pointer transition-colors ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${
                    day.isToday ? 'border-primary-500 border-2' : 'border-gray-200'} ${
                    isWeekend ? 'text-gray-400' : ''}
                  `}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className={`text-sm font-medium ${
                    day.isToday ? 'text-primary-600' : ''}
                  `}>
                    {dayStr}
                  </div>
                  <div className="mt-1 space-y-1">
                    {day.events.slice(0, 2).map(event => {
                      const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.berth;
                      return (
                        <div
                          key={event.id}
                          className={`text-xs px-1.5 py-0.5 rounded text-white truncate ${eventType.color}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {day.events.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{day.events.length - 2} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDay.date.format('YYYY年 M月 D日')} 日程
            </h3>
            {selectedDay.events.length === 0 ? (
              <p className="text-gray-500">当日无日程安排</p>
            ) : (
              <div className="space-y-3">
                {selectedDay.events.map(event => {
                  const eventType = EVENT_TYPES[event.type] || EVENT_TYPES.berth;
                  const Icon = eventType.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${eventType.color} bg-opacity-20`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        {event.data?.ship_name && (
                          <p className="text-sm text-gray-500">{event.data.ship_name}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
