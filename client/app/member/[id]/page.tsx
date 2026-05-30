'use client';

import AppLayout from '@/components/layout/AppLayout';
import Timeline from '@/components/timeline/Timeline';
import { api } from '@/services/api';
import { Booking, EquipmentRecord, Member, TimelineEvent, WalletTransaction } from '@/types';
import {
    formatCurrency,
    formatDateTime,
    getBookingStatusColor,
    getBookingStatusLabel,
    getMemberTypeColor,
    getMemberTypeLabel,
    getReturnStatusColor,
    getReturnStatusLabel,
} from '@/utils/format';
import {
    ArrowLeft,
    Calendar,
    Clock,
    CreditCard,
    Gift,
    Package,
    Phone,
    Shield,
    User,
    Wallet
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = parseInt(params.id as string);

  const [member, setMember] = useState<Member | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [equipmentRecords, setEquipmentRecords] = useState<EquipmentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'transactions' | 'bookings' | 'equipment'>('timeline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (memberId) {
      loadData();
    }
  }, [memberId]);

  const loadData = async () => {
    try {
      const [memberRes, timelineRes, txRes, bookingRes, equipRes] = await Promise.all([
        api.get<Member>(`/members/${memberId}`),
        api.get<TimelineEvent[]>(`/members/${memberId}/timeline`),
        api.get<{ items: WalletTransaction[] }>(`/wallet/transactions?member_id=${memberId}&pageSize=20`),
        api.get<{ items: Booking[] }>(`/bookings?member_id=${memberId}&pageSize=20`),
        api.get<{ items: EquipmentRecord[] }>(`/equipment/records?member_id=${memberId}&pageSize=20`),
      ]);

      if (memberRes.success) setMember(memberRes.data || null);
      if (timelineRes.success) setTimeline(timelineRes.data || []);
      if (txRes.success) setTransactions(txRes.data?.items || []);
      if (bookingRes.success) setBookings(bookingRes.data?.items || []);
      if (equipRes.success) setEquipmentRecords(equipRes.data?.items || []);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!member) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">会员不存在</p>
          <button onClick={() => router.back()} className="btn-primary mt-4">
            返回
          </button>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { key: 'timeline', label: '全链路时间线', icon: <Clock size={18} /> },
    { key: 'transactions', label: '储值流水', icon: <CreditCard size={18} /> },
    { key: 'bookings', label: '预约记录', icon: <Calendar size={18} /> },
    { key: 'equipment', label: '器材借还', icon: <Package size={18} /> },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} />
          返回
        </button>

        <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-medium">
                {member.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-semibold">{member.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm ${getMemberTypeColor(member.member_type)}`}>
                    {getMemberTypeLabel(member.member_type)}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-primary-200">
                  <span className="flex items-center gap-2">
                    <Phone size={16} />
                    {member.phone}
                  </span>
                  {member.birthday && (
                    <span className="flex items-center gap-2">
                      <User size={16} />
                      {member.birthday}
                    </span>
                  )}
                </div>
                {member.remark && (
                  <p className="text-primary-300 mt-2 text-sm">备注: {member.remark}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={20} className="text-primary-200" />
                  <span className="text-primary-200 text-sm">本金余额</span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(member.wallet.principal_balance)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={20} className="text-gold-800" />
                  <span className="text-primary-200 text-sm">赠送金</span>
                </div>
                <p className="text-3xl font-bold text-gold-800">{formatCurrency(member.wallet.gift_balance)}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={20} className="text-primary-200" />
                  <span className="text-primary-200 text-sm">冻结金额</span>
                </div>
                <p className="text-3xl font-bold">{formatCurrency(member.wallet.frozen_balance)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-primary-600 border-primary-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'timeline' && (
              <div className="max-w-3xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-6">全链路操作记录</h3>
                <p className="text-sm text-gray-500 mb-6">
                  按时间倒序展示该会员的所有操作记录，包括储值、消费、预约、器材借还、异常工单等，所有操作均留痕可追溯。
                </p>
                <Timeline events={timeline} />
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="table-header">流水号</th>
                        <th className="table-header">类型</th>
                        <th className="table-header text-right">金额</th>
                        <th className="table-header text-right">本金</th>
                        <th className="table-header text-right">赠送金</th>
                        <th className="table-header">来源</th>
                        <th className="table-header">对账状态</th>
                        <th className="table-header">备注</th>
                        <th className="table-header">操作人</th>
                        <th className="table-header">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-sm">#{tx.id.toString().padStart(6, '0')}</td>
                          <td className="table-cell">
                            <span className={`badge ${tx.type === 'recharge' ? 'badge-green' : 'badge-red'}`}>
                              {tx.type === 'recharge' ? '充值' : tx.type === 'consume' ? '消费' : tx.type === 'refund' ? '退款' : '调账'}
                            </span>
                          </td>
                          <td className={`table-cell text-right font-semibold ${tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.type === 'recharge' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td className="table-cell text-right">{formatCurrency(tx.principal_amount)}</td>
                          <td className="table-cell text-right text-gold-800">{formatCurrency(tx.gift_amount)}</td>
                          <td className="table-cell">{tx.source}</td>
                          <td className="table-cell">
                            <span className={`badge ${
                              tx.reconciliation_status === 'matched' ? 'badge-green' :
                              tx.reconciliation_status === 'mismatched' ? 'badge-red' :
                              tx.reconciliation_status === 'adjusted' ? 'badge bg-purple-100 text-purple-800' :
                              'badge-yellow'
                            }`}>
                              {tx.reconciliation_status === 'matched' ? '已匹配' :
                               tx.reconciliation_status === 'mismatched' ? '不匹配' :
                               tx.reconciliation_status === 'adjusted' ? '已调账' : '待对账'}
                            </span>
                          </td>
                          <td className="table-cell max-w-48 truncate">{tx.remark || '-'}</td>
                          <td className="table-cell">{(tx as any).operator_name || '-'}</td>
                          <td className="table-cell">{formatDateTime(tx.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transactions.length === 0 && (
                  <p className="text-center text-gray-500 py-12">暂无储值流水</p>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="table-header">预约号</th>
                        <th className="table-header">球道</th>
                        <th className="table-header">日期</th>
                        <th className="table-header">时段</th>
                        <th className="table-header text-right">时长</th>
                        <th className="table-header text-right">金额</th>
                        <th className="table-header">状态</th>
                        <th className="table-header">签到时间</th>
                        <th className="table-header">完成时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-sm">#{booking.id.toString().padStart(6, '0')}</td>
                          <td className="table-cell">{(booking as any).bay_name || booking.bay_id}</td>
                          <td className="table-cell">{booking.booking_date}</td>
                          <td className="table-cell">{booking.start_time} - {booking.end_time}</td>
                          <td className="table-cell text-right">{booking.duration_minutes}分钟</td>
                          <td className="table-cell text-right font-semibold">{formatCurrency(booking.total_amount)}</td>
                          <td className="table-cell">
                            <span className={`badge ${getBookingStatusColor(booking.status)}`}>
                              {getBookingStatusLabel(booking.status)}
                            </span>
                          </td>
                          <td className="table-cell">{booking.checkin_at ? formatDateTime(booking.checkin_at) : '-'}</td>
                          <td className="table-cell">{booking.completed_at ? formatDateTime(booking.completed_at) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bookings.length === 0 && (
                  <p className="text-center text-gray-500 py-12">暂无预约记录</p>
                )}
              </div>
            )}

            {activeTab === 'equipment' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="table-header">记录号</th>
                        <th className="table-header">器材名称</th>
                        <th className="table-header">借出时间</th>
                        <th className="table-header">借出操作人</th>
                        <th className="table-header">归还时间</th>
                        <th className="table-header">归还操作人</th>
                        <th className="table-header">归还状态</th>
                        <th className="table-header text-right">损坏赔偿</th>
                        <th className="table-header">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {equipmentRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="table-cell font-mono text-sm">#{record.id.toString().padStart(6, '0')}</td>
                          <td className="table-cell">{(record as any).equipment_name || record.equipment_id}</td>
                          <td className="table-cell">{formatDateTime(record.borrow_at)}</td>
                          <td className="table-cell">{(record as any).borrower_name || '-'}</td>
                          <td className="table-cell">{record.return_at ? formatDateTime(record.return_at) : '-'}</td>
                          <td className="table-cell">{(record as any).returner_name || '-'}</td>
                          <td className="table-cell">
                            <span className={`badge ${getReturnStatusColor(record.return_status)}`}>
                              {getReturnStatusLabel(record.return_status)}
                            </span>
                          </td>
                          <td className="table-cell text-right font-semibold">
                            {record.damage_fee > 0 ? formatCurrency(record.damage_fee) : '-'}
                          </td>
                          <td className="table-cell max-w-48 truncate">{record.damage_remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {equipmentRecords.length === 0 && (
                  <p className="text-center text-gray-500 py-12">暂无器材借还记录</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
