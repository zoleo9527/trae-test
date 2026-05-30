'use client';

import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/services/api';
import { Bay, Booking, Equipment, EquipmentRecord, Member, WalletTransaction } from '@/types';
import {
    formatCurrency,
    getBayStatusColor,
    getBookingStatusColor,
    getBookingStatusLabel,
    getMemberTypeColor,
    getMemberTypeLabel
} from '@/utils/format';
import {
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Package,
    Plus,
    Search,
    UserPlus,
    X,
    XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReceptionPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [bays, setBays] = useState<(Bay & { current_booking?: Booking | null })[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<WalletTransaction[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [activeTab, setActiveTab] = useState<'booking' | 'equipment'>('booking');
  const [loading, setLoading] = useState(false);
  const [todayRechargeTotal, setTodayRechargeTotal] = useState(0);
  const [todayRechargeGift, setTodayRechargeGift] = useState(0);
  const [todayConsumeTotal, setTodayConsumeTotal] = useState(0);
  const [todayConsumeCount, setTodayConsumeCount] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    bay_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
  });
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeForm, setRechargeForm] = useState({ amount: 0, remark: '' });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState<{ record_id: number; return_status: 'normal' | 'damaged' | 'lost'; damage_remark: string; damage_fee: number }>({
    record_id: 0, return_status: 'normal', damage_remark: '', damage_fee: 0,
  });
  const [activeRecords, setActiveRecords] = useState<EquipmentRecord[]>([]);
  const [memberBookings, setMemberBookings] = useState<Booking[]>([]);
  const [memberEquipRecords, setMemberEquipRecords] = useState<EquipmentRecord[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [calculatedGift, setCalculatedGift] = useState({ amount: 0, gift_amount: 0, total: 0 });
  const [bookingCalc, setBookingCalc] = useState<{
    base_amount: number;
    discount_amount: number;
    coefficient_amount: number;
    final_amount: number;
    discount_rate: number;
    coefficient: number;
    member_type: string;
    is_weekend: boolean;
    is_holiday: boolean;
    holiday_name: string | null;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      loadMemberData(selectedMember.id);
    } else {
      setMemberBookings([]);
      setMemberEquipRecords([]);
    }
  }, [selectedMember]);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [baysRes, txRes, eqRes, rechargeRes, consumeRes, activeRes] = await Promise.all([
        api.get<(Bay & { current_booking?: Booking | null })[]>('/bays/status'),
        api.get<{ items: WalletTransaction[] }>(`/wallet/transactions?created_at_start=${today}&created_at_end=${today}&pageSize=10`),
        api.get<Equipment[]>('/equipment'),
        api.get<{ items: WalletTransaction[] }>(`/wallet/transactions?type=recharge&created_at_start=${today}&created_at_end=${today}&pageSize=1000`),
        api.get<{ items: WalletTransaction[]; total: number }>(`/wallet/transactions?type=consume&created_at_start=${today}&created_at_end=${today}&pageSize=1000`),
        api.get<{ items: EquipmentRecord[] }>('/equipment/records?return_status=null&pageSize=50'),
      ]);

      if (baysRes.success) setBays(baysRes.data || []);
      if (txRes.success) setTodayTransactions(txRes.data?.items || []);
      if (eqRes.success) setEquipments(eqRes.data || []);
      if (activeRes.success) setActiveRecords(activeRes.data?.items || []);
      if (rechargeRes.success) {
        const rechargeItems = rechargeRes.data?.items || [];
        setTodayRechargeTotal(rechargeItems.reduce((sum, tx) => sum + tx.principal_amount, 0));
        setTodayRechargeGift(rechargeItems.reduce((sum, tx) => sum + tx.gift_amount, 0));
      }
      if (consumeRes.success) {
        const consumeItems = consumeRes.data?.items || [];
        setTodayConsumeTotal(consumeItems.reduce((sum, tx) => sum + tx.amount, 0));
        setTodayConsumeCount(consumeItems.length);
      }
    } catch (e) {
      console.error('Load data error:', e);
    }
  };

  const refreshMember = async (memberId: number) => {
    try {
      const res = await api.get<Member>(`/members/${memberId}`);
      if (res.success && res.data) {
        setSelectedMember(res.data);
      }
    } catch (e) {
      console.error('Refresh member error:', e);
    }
  };

  const loadMemberData = async (memberId: number) => {
    try {
      const [bookingsRes, equipRes] = await Promise.all([
        api.get<{ items: Booking[] }>(`/bookings?member_id=${memberId}&pageSize=20`),
        api.get<{ items: EquipmentRecord[] }>(`/equipment/records?member_id=${memberId}&pageSize=50`),
      ]);
      if (bookingsRes.success) setMemberBookings(bookingsRes.data?.items || []);
      if (equipRes.success) setMemberEquipRecords(equipRes.data?.items || []);
    } catch (e) {
      console.error('Load member data error:', e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ items: Member[] }>(
        `/members?name_like=${encodeURIComponent(searchQuery)}&pageSize=10`
      );
      if (res.success) {
        setSearchResults(res.data?.items || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCheckin = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/checkin`);
      loadData();
      if (selectedMember) {
        refreshMember(selectedMember.id);
        loadMemberData(selectedMember.id);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const handleComplete = async (bookingId: number) => {
    try {
      await api.put(`/bookings/${bookingId}/complete`);
      loadData();
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const handleBorrow = async (equipmentId: number) => {
    if (!selectedMember) {
      alert('请先选择会员');
      return;
    }
    try {
      await api.post('/equipment/borrow', {
        equipment_id: equipmentId,
        member_id: selectedMember.id,
      });
      loadData();
      if (selectedMember) {
        refreshMember(selectedMember.id);
        loadMemberData(selectedMember.id);
      }
      alert('借出成功');
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const handleCalculateGift = async (amount: number) => {
    if (amount <= 0) {
      setCalculatedGift({ amount: 0, gift_amount: 0, total: 0 });
      return;
    }
    try {
      const res = await api.get<{ amount: number; gift_amount: number; total: number }>(`/wallet/calculate-gift?amount=${amount}`);
      if (res.success && res.data) {
        setCalculatedGift(res.data);
      }
    } catch (e) {
      console.error('Calculate gift error:', e);
    }
  };

  useEffect(() => {
    if (showRechargeModal && rechargeForm.amount > 0) {
      handleCalculateGift(rechargeForm.amount);
    } else {
      setCalculatedGift({ amount: 0, gift_amount: 0, total: 0 });
    }
  }, [rechargeForm.amount, showRechargeModal]);

  const handleRecharge = async () => {
    if (!selectedMember) {
      alert('请先选择会员');
      return;
    }
    if (rechargeForm.amount <= 0) {
      alert('请输入有效充值金额');
      return;
    }
    try {
      await api.post('/wallet/recharge', {
        member_id: selectedMember.id,
        amount: rechargeForm.amount,
        remark: rechargeForm.remark || undefined,
      });
      setShowRechargeModal(false);
      setRechargeForm({ amount: 0, remark: '' });
      loadData();
      if (selectedMember) {
        refreshMember(selectedMember.id);
        loadMemberData(selectedMember.id);
      }
      alert('充值成功');
    } catch (e: any) {
      alert(e.response?.data?.message || '充值失败');
    }
  };

  const handleEquipmentReturn = async () => {
    try {
      await api.post('/equipment/return', {
        record_id: returnForm.record_id,
        return_status: returnForm.return_status,
        damage_remark: returnForm.damage_remark || undefined,
        damage_fee: returnForm.damage_fee || undefined,
      });
      setShowReturnModal(false);
      setReturnForm({ record_id: 0, return_status: 'normal', damage_remark: '', damage_fee: 0 });
      loadData();
      if (selectedMember) {
        refreshMember(selectedMember.id);
        loadMemberData(selectedMember.id);
      }
      alert('归还成功');
    } catch (e: any) {
      alert(e.response?.data?.message || '操作失败');
    }
  };

  const handleCalculateBooking = async () => {
    if (!bookingForm.bay_id || !bookingForm.start_time || !bookingForm.end_time || !selectedMember) {
      setBookingCalc(null);
      return;
    }

    const startHour = parseInt(bookingForm.start_time.split(':')[0]);
    const endHour = parseInt(bookingForm.end_time.split(':')[0]);
    const duration = (endHour - startHour) * 60;

    if (duration <= 0) {
      setBookingCalc(null);
      return;
    }

    try {
      const res = await api.get<{
        base_amount: number;
        discount_amount: number;
        coefficient_amount: number;
        final_amount: number;
        discount_rate: number;
        coefficient: number;
        member_type: string;
        is_weekend: boolean;
        is_holiday: boolean;
        holiday_name: string | null;
      }>(`/bookings/calculate?bay_id=${bookingForm.bay_id}&booking_date=${bookingForm.booking_date}&duration_minutes=${duration}&member_type=${selectedMember.member_type}`);
      if (res.success && res.data) {
        setBookingCalc(res.data);
      }
    } catch (e) {
      console.error('Calculate booking error:', e);
    }
  };

  useEffect(() => {
    handleCalculateBooking();
  }, [bookingForm.bay_id, bookingForm.booking_date, bookingForm.start_time, bookingForm.end_time, selectedMember]);

  const handleCreateBooking = async () => {
    if (!selectedMember) {
      alert('请先选择会员');
      return;
    }
    if (!bookingForm.bay_id || !bookingForm.start_time || !bookingForm.end_time) {
      alert('请填写完整的预约信息');
      return;
    }
    try {
      const startHour = parseInt(bookingForm.start_time.split(':')[0]);
      const endHour = parseInt(bookingForm.end_time.split(':')[0]);
      const duration = (endHour - startHour) * 60;
      await api.post('/bookings', {
        member_id: selectedMember.id,
        bay_id: parseInt(bookingForm.bay_id),
        booking_date: bookingForm.booking_date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        duration_minutes: duration,
      });
      setShowBookingModal(false);
      setBookingForm({ bay_id: '', booking_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '' });
      setBookingCalc(null);
      loadData();
      if (selectedMember) loadMemberData(selectedMember.id);
      alert('预约创建成功');
    } catch (e: any) {
      alert(e.response?.data?.message || '创建失败');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索会员姓名或手机号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12 py-3 text-base"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <button className="btn-primary flex items-center gap-2 px-6">
              <UserPlus size={20} />
              新增会员
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                    selectedMember?.id === member.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        <span className={getMemberTypeColor(member.member_type)}>
                          {getMemberTypeLabel(member.member_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-700">
                      {formatCurrency(member.wallet.principal_balance + member.wallet.gift_balance)}
                    </p>
                    <p className="text-xs text-gray-500">可用余额</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMember && (
          <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-medium">
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-medium">{selectedMember.name}</h3>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                      {getMemberTypeLabel(selectedMember.member_type)}
                    </span>
                  </div>
                  <p className="text-primary-200">{selectedMember.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold">{formatCurrency(selectedMember.wallet.principal_balance)}</p>
                  <p className="text-sm text-primary-200">本金余额</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-800">{formatCurrency(selectedMember.wallet.gift_balance)}</p>
                  <p className="text-sm text-primary-200">赠送金余额</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!selectedMember) {
                        alert('请先选择会员');
                        return;
                      }
                      setRechargeForm({ amount: 0, remark: '' });
                      setShowRechargeModal(true);
                    }}
                    className="bg-gold-800 hover:bg-amber-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    储值充值
                  </button>
                  <button
                    onClick={() => router.push(`/member/${selectedMember.id}`)}
                    className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    查看详情
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMember && (() => {
          const steps = [
            { label: '查会员', done: true },
            { label: '充储值', done: selectedMember.wallet.principal_balance > 0 || selectedMember.wallet.gift_balance > 0 },
            { label: '建预约', done: memberBookings.length > 0 },
            { label: '签到', done: memberBookings.some(b => b.status === 'checked_in' || b.status === 'completed') },
            { label: '借器材', done: memberEquipRecords.length > 0 },
            { label: '归还', done: memberEquipRecords.some(r => r.return_status !== null) },
            { label: '完成', done: memberBookings.some(b => b.status === 'completed') },
          ];
          const currentIdx = steps.findIndex(s => !s.done);
          return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.done
                          ? 'bg-green-500 text-white'
                          : idx === currentIdx
                          ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step.done ? <CheckCircle size={16} /> : idx + 1}
                      </div>
                      <span className={`text-xs mt-1 ${step.done ? 'text-green-600 font-medium' : idx === currentIdx ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-8 sm:w-12 md:w-16 h-0.5 mx-1 ${steps[idx + 1].done || idx + 1 === currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">球道状态</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> 空闲</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> 已预约</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> 使用中</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> 维护中</span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
                  {bays.map((bay) => {
                    const status = bay.current_booking?.status || bay.status;
                    const isInUse = bay.current_booking?.status === 'checked_in';
                    const isBooked = bay.current_booking?.status === 'booked';

                    return (
                      <div
                        key={bay.id}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all hover:scale-105 cursor-pointer ${
                          isInUse
                            ? 'border-yellow-500 bg-yellow-50'
                            : isBooked
                            ? 'border-blue-500 bg-blue-50'
                            : bay.status === 'maintenance'
                            ? 'border-red-500 bg-red-50 opacity-50'
                            : 'border-gray-200 bg-white hover:border-primary-500'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full mb-1 ${getBayStatusColor(
                            isInUse ? 'checked_in' : isBooked ? 'booked' : bay.status
                          )}`}
                        ></div>
                        <span className="text-sm font-medium">{bay.bay_number}</span>
                        <span className="text-xs text-gray-500">{bay.type === 'vip' ? 'VIP' : bay.type === 'coach' ? '教练' : ''}</span>
                        {bay.current_booking?.member_name && (
                          <span className="text-xs text-gray-600 truncate w-full text-center mt-1">
                            {bay.current_booking.member_name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100">
                <div className="flex border-b border-gray-100">
                  <button
                    onClick={() => setActiveTab('booking')}
                    className={`flex-1 py-3 text-center font-medium transition-colors ${
                      activeTab === 'booking' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Calendar size={18} className="inline mr-2" />
                    今日预约
                  </button>
                  <button
                    onClick={() => setActiveTab('equipment')}
                    className={`flex-1 py-3 text-center font-medium transition-colors ${
                      activeTab === 'equipment' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Package size={18} className="inline mr-2" />
                    器材借还
                  </button>
                </div>

                <div className="p-4 max-h-64 overflow-y-auto">
                  {activeTab === 'booking' && (
                    <div className="space-y-2">
                      {bays
                        .filter((b) => b.current_booking)
                        .map((bay) => (
                          <div
                            key={bay.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center font-medium">
                                {bay.bay_number}
                              </div>
                              <div>
                                <p className="font-medium">{bay.current_booking?.member_name}</p>
                                <p className="text-sm text-gray-500">
                                  {bay.current_booking?.start_time} - {bay.current_booking?.end_time}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`badge ${getBookingStatusColor(bay.current_booking?.status || '')}`}>
                                {getBookingStatusLabel(bay.current_booking?.status || '')}
                              </span>
                              {bay.current_booking?.status === 'booked' && (
                                <button
                                  onClick={() => handleCheckin(bay.current_booking!.id)}
                                  className="btn-primary text-sm py-1 px-3"
                                >
                                  <CheckCircle size={14} className="inline mr-1" />
                                  签到
                                </button>
                              )}
                              {bay.current_booking?.status === 'checked_in' && (
                                <button
                                  onClick={() => handleComplete(bay.current_booking!.id)}
                                  className="btn-gold text-sm py-1 px-3"
                                >
                                  <XCircle size={14} className="inline mr-1" />
                                  完成
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      {bays.filter((b) => b.current_booking).length === 0 && (
                        <p className="text-center text-gray-500 py-8">暂无今日预约</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'equipment' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="搜索器材名称..."
                          value={equipmentFilter}
                          onChange={(e) => setEquipmentFilter(e.target.value)}
                          className="input-field pl-9 py-2 text-sm w-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {equipments
                          .filter((eq) =>
                            equipmentFilter
                              ? eq.name.toLowerCase().includes(equipmentFilter.toLowerCase()) ||
                                eq.category.toLowerCase().includes(equipmentFilter.toLowerCase())
                              : true
                          )
                          .slice(0, 8)
                          .map((eq) => (
                          <div
                            key={eq.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">{eq.name}</p>
                              <p className="text-xs text-gray-500">
                                库存: {eq.available_quantity}/{eq.total_quantity}
                              </p>
                            </div>
                            <button
                              onClick={() => handleBorrow(eq.id)}
                              disabled={eq.available_quantity <= 0}
                              className="btn-primary text-sm py-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              借出
                            </button>
                          </div>
                        ))}
                      </div>

                      {activeRecords.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                            <Package size={14} />
                            在借器材
                          </h4>
                          <div className="space-y-2">
                            {activeRecords.map((rec) => (
                              <div
                                key={rec.id}
                                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                              >
                                <div>
                                  <p className="font-medium text-sm">{rec.equipment_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {rec.member_name} · {rec.borrow_at ? new Date(rec.borrow_at).toLocaleString('zh-CN') : ''} · {rec.borrower_name}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setReturnForm({ record_id: rec.id, return_status: 'normal', damage_remark: '', damage_fee: 0 });
                                    setShowReturnModal(true);
                                  }}
                                  className="btn-gold text-sm py-1 px-3"
                                >
                                  归还
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary-600" />
                当班流水
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'recharge' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {tx.type === 'recharge' ? <Plus size={18} /> : <CreditCard size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.member_name}</p>
                        <p className="text-xs text-gray-500">{tx.remark || (tx.type === 'recharge' ? '储值充值' : '消费扣减')}</p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'recharge' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                <p className="text-green-100 text-sm mb-1">今日充值</p>
                <p className="text-2xl font-bold">{formatCurrency(todayRechargeTotal)}</p>
                {todayRechargeGift > 0 && (
                  <p className="text-green-200 text-xs mt-2">+ {formatCurrency(todayRechargeGift)} 赠送金</p>
                )}
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                <p className="text-blue-100 text-sm mb-1">今日消费</p>
                <p className="text-2xl font-bold">{formatCurrency(todayConsumeTotal)}</p>
                <p className="text-blue-200 text-xs mt-2">{todayConsumeCount} 笔交易</p>
              </div>
            </div>

            <button
              onClick={() => {
                if (!selectedMember) {
                  alert('请先选择会员');
                  return;
                }
                setShowBookingModal(true);
              }}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Calendar size={20} />
              创建预约
            </button>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">创建预约</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会员</label>
                <input
                  type="text"
                  value={selectedMember?.name || ''}
                  disabled
                  className="input-field bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">球道</label>
                <select
                  value={bookingForm.bay_id}
                  onChange={(e) => setBookingForm((f) => ({ ...f, bay_id: e.target.value }))}
                  className="input-field"
                >
                  <option value="">请选择球道</option>
                  {bays.filter((b) => b.status === 'available' && !b.current_booking).map((bay) => (
                    <option key={bay.id} value={bay.id}>
                      {bay.bay_number} - {bay.type === 'vip' ? 'VIP' : bay.type === 'coach' ? '教练' : '普通'} (¥{bay.hourly_rate}/时)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  value={bookingForm.booking_date}
                  onChange={(e) => setBookingForm((f) => ({ ...f, booking_date: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="time"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm((f) => ({ ...f, start_time: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="time"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm((f) => ({ ...f, end_time: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              {bookingCalc && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">基础费用</span>
                    <span className="font-medium">{formatCurrency(bookingCalc.base_amount)}</span>
                  </div>
                  {bookingCalc.discount_rate < 1 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">会员折扣</span>
                      <span className="font-medium text-blue-600">
                        {(bookingCalc.discount_rate * 10).toFixed(0)}折 -{formatCurrency(bookingCalc.base_amount - bookingCalc.discount_amount)}
                      </span>
                    </div>
                  )}
                  {bookingCalc.coefficient > 1 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">
                        {bookingCalc.is_holiday ? (bookingCalc.holiday_name || '节假日') : bookingCalc.is_weekend ? '周末' : ''}系数 x{bookingCalc.coefficient}
                      </span>
                      <span className="font-medium text-amber-600">
                        +{formatCurrency(bookingCalc.coefficient_amount - bookingCalc.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-200">
                    <span className="text-gray-600">应收金额</span>
                    <span className="font-bold text-blue-700 text-lg">{formatCurrency(bookingCalc.final_amount)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowBookingModal(false)} className="flex-1 btn-secondary">
                  取消
                </button>
                <button onClick={handleCreateBooking} className="flex-1 btn-primary">
                  确认预约
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">储值充值</h3>
              <button onClick={() => setShowRechargeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">会员</label>
                <input type="text" value={selectedMember?.name || ''} disabled className="input-field bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">充值金额</label>
                <input
                  type="number"
                  min="0"
                  value={rechargeForm.amount || ''}
                  onChange={(e) => setRechargeForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                  className="input-field"
                  placeholder="请输入充值金额"
                />
              </div>
              {calculatedGift.amount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">充值金额</span>
                    <span className="font-medium">{formatCurrency(calculatedGift.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">赠送金额</span>
                    <span className="font-medium text-green-600">{formatCurrency(calculatedGift.gift_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1 pt-1 border-t border-green-200">
                    <span className="text-gray-600">实际到账</span>
                    <span className="font-bold text-green-700">{formatCurrency(calculatedGift.total)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={rechargeForm.remark}
                  onChange={(e) => setRechargeForm((f) => ({ ...f, remark: e.target.value }))}
                  className="input-field"
                  rows={2}
                  placeholder="可选备注"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRechargeModal(false)} className="flex-1 btn-secondary">取消</button>
                <button onClick={handleRecharge} className="flex-1 btn-primary">确认充值</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">器材归还</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">归还状态</label>
                <div className="flex gap-4">
                  {(['normal', 'damaged', 'lost'] as const).map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="return_status"
                        value={status}
                        checked={returnForm.return_status === status}
                        onChange={(e) => setReturnForm((f) => ({ ...f, return_status: e.target.value as 'normal' | 'damaged' | 'lost' }))}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-sm">{status === 'normal' ? '正常归还' : status === 'damaged' ? '损坏归还' : '遗失'}</span>
                    </label>
                  ))}
                </div>
              </div>
              {(returnForm.return_status === 'damaged' || returnForm.return_status === 'lost') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">损坏/遗失说明</label>
                    <textarea
                      value={returnForm.damage_remark}
                      onChange={(e) => setReturnForm((f) => ({ ...f, damage_remark: e.target.value }))}
                      className="input-field"
                      rows={2}
                      placeholder="请描述损坏或遗失情况"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">赔偿金额</label>
                    <input
                      type="number"
                      min="0"
                      value={returnForm.damage_fee || ''}
                      onChange={(e) => setReturnForm((f) => ({ ...f, damage_fee: parseFloat(e.target.value) || 0 }))}
                      className="input-field"
                      placeholder="请输入赔偿金额"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowReturnModal(false)} className="flex-1 btn-secondary">取消</button>
                <button onClick={handleEquipmentReturn} className="flex-1 btn-primary">确认归还</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
