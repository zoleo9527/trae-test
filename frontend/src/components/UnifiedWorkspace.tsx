import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { showsAPI, ordersAPI, refundsAPI, logsAPI } from '../lib/api';
import { useAuthStore, UserRole } from '../store/authStore';

interface Show {
  id: string;
  name: string;
  type: string;
  startTime: string;
  endTime: string;
  venue: string;
  totalSeats: number;
  status: string;
  totalSold: number;
  remainingSeats: number;
  refundRequestCount: number;
  orders: Array<{
    id: string;
    orderNo: string;
    organization: string;
    ticketCount: number;
    status: string;
  }>;
  rehearsalSchedule?: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    confirmedBy?: string;
    confirmedAt?: string;
  }>;
  changeLog?: Array<{
    id: string;
    changedBy: string;
    changedAt: string;
    field: string;
    oldValue: string;
    newValue: string;
    reason?: string;
  }>;
}

interface GroupOrder {
  id: string;
  orderNo: string;
  showId: string;
  organization: string;
  contactName: string;
  ticketCount: number;
  totalAmount: number;
  status: string;
  showName: string;
  showTime: string;
  showStatus: string;
  refundRequests: any[];
  createdAt: string;
}

interface RefundRequest {
  id: string;
  requestNo: string;
  orderId: string;
  showId: string;
  type: string;
  reason: string;
  refundTicketCount: number;
  refundAmount: number;
  status: string;
  applicantName: string;
  createdAt: string;
  showName: string;
  showTime: string;
  organization: string;
  orderNo: string;
  newShowId?: string;
  newShowName?: string;
  newShowTime?: string;
  paidAmount: number;
  totalAmount: number;
  pendingRefund: number;
  unitPrice: number;
  originalTicketCount: number;
  ticketApprovalNote?: string;
  managerApprovalNote?: string;
  rejectionReason?: string;
}

interface DashboardData {
  pendingOrders: number;
  pendingRefunds: number;
  modifiedShows: number;
  unsettledAmount: number;
  recentActivities: Array<{
    userName: string;
    action: string;
    detail: string;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  CONFIRMED: 'bg-green-100 text-green-700',
  MODIFIED: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PENDING: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  APPROVED_TICKET: 'bg-blue-100 text-blue-700',
  APPROVED_MANAGER: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusNames: Record<string, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  MODIFIED: '已变更',
  CANCELLED: '已取消',
  PENDING: '待处理',
  PAID: '已付款',
  COMPLETED: '已完成',
  APPROVED_TICKET: '票务已审',
  APPROVED_MANAGER: '经理已审',
  REJECTED: '已驳回',
};

const showTypeNames: Record<string, string> = {
  DRAMA: '话剧',
  OPERA: '歌剧',
  CONCERT: '音乐会',
  DANCE: '舞蹈',
  CHILDREN: '儿童剧',
};

export default function UnifiedWorkspace() {
  const { user } = useAuthStore();
  const [shows, setShows] = useState<Show[]>([]);
  const [orders, setOrders] = useState<GroupOrder[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [selectedShow, setSelectedShow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shows' | 'orders' | 'refunds'>('shows');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [showsRes, ordersRes, refundsRes, dashboardRes] = await Promise.all([
        showsAPI.getAll(),
        ordersAPI.getAll(),
        refundsAPI.getAll(),
        logsAPI.getDashboard(),
      ]);
      setShows(showsRes.data || []);
      setOrders(ordersRes.data || []);
      setRefundRequests(refundsRes.data || []);
      setDashboard(dashboardRes.data || null);
    } catch (error) {
      console.error('Fetch data error:', error);
      showMessage('error', '数据加载失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBatchSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (activeTab === 'orders') {
      const pendingOrders = orders.filter((o) => o.status === 'PENDING').map((o) => o.id);
      setSelectedItems(selectedItems.length === pendingOrders.length ? [] : pendingOrders);
    } else if (activeTab === 'refunds') {
      const pendingRefunds = refundRequests
        .filter((r) => 
          user?.role === 'TICKET_SUPERVISOR' 
            ? r.status === 'PENDING' 
            : r.status === 'APPROVED_TICKET'
        )
        .map((r) => r.id);
      setSelectedItems(selectedItems.length === pendingRefunds.length ? [] : pendingRefunds);
    }
  };

  const handleBatchConfirm = async () => {
    if (activeTab === 'orders' && selectedItems.length > 0) {
      try {
        await ordersAPI.batchConfirm(selectedItems);
        setSelectedItems([]);
        setBatchMode(false);
        showMessage('success', `成功确认 ${selectedItems.length} 个团单`);
        fetchData();
      } catch (error) {
        console.error('Batch confirm error:', error);
        showMessage('error', '批量确认失败');
      }
    } else if (activeTab === 'refunds' && selectedItems.length > 0) {
      try {
        if (user?.role === 'TICKET_SUPERVISOR') {
          await refundsAPI.batchTicketApprove(selectedItems);
          showMessage('success', `成功审批 ${selectedItems.length} 个退改申请`);
        } else if (user?.role === 'THEATER_MANAGER') {
          await refundsAPI.batchManagerApprove(selectedItems);
          showMessage('success', `成功终审 ${selectedItems.length} 个退改申请`);
        }
        setSelectedItems([]);
        setBatchMode(false);
        fetchData();
      } catch (error) {
        console.error('Batch approve error:', error);
        showMessage('error', '批量审批失败');
      }
    }
  };

  const handleRefundApprove = async (id: string, isTicket: boolean) => {
    try {
      if (isTicket) {
        await refundsAPI.ticketApprove(id);
        showMessage('success', '审批通过');
      } else {
        await refundsAPI.managerApprove(id);
        showMessage('success', '终审通过');
      }
      fetchData();
    } catch (error) {
      console.error('Approve error:', error);
      showMessage('error', '审批失败');
    }
  };

  const handleOrderConfirm = async (id: string) => {
    try {
      await ordersAPI.confirm(id);
      showMessage('success', '团单确认成功');
      fetchData();
    } catch (error) {
      console.error('Confirm order error:', error);
      showMessage('error', '确认失败');
    }
  };

  const handleRejectClick = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingId || !rejectionReason.trim()) {
      showMessage('error', '请填写驳回原因');
      return;
    }
    try {
      await refundsAPI.reject(rejectingId, rejectionReason.trim());
      showMessage('success', '已驳回申请');
      setRejectModalOpen(false);
      setRejectingId(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      console.error('Reject error:', error);
      showMessage('error', '驳回失败');
    }
  };

  const filteredOrders = selectedShow
    ? orders.filter((o) => o.showId === selectedShow)
    : orders;

  const filteredRefunds = selectedShow
    ? refundRequests.filter((r) => r.showId === selectedShow)
    : refundRequests;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">统一工作面</h1>
        <p className="text-gray-500">
          欢迎回来，{user?.name}。在这里处理所有场次、团单和退改审核事务。
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">待确认团单</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {dashboard?.pendingOrders || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">待审批退改</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {dashboard?.pendingRefunds || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">已变更场次</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {dashboard?.modifiedShows || 0}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">待结算金额</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                ¥{(dashboard?.unsettledAmount || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6">
            <div className="flex space-x-8">
              <button
                onClick={() => { setActiveTab('shows'); setSelectedItems([]); setBatchMode(false); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'shows'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                场次列表 ({shows.length})
              </button>
              <button
                onClick={() => { setActiveTab('orders'); setSelectedItems([]); setBatchMode(false); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'orders'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                团单管理 ({filteredOrders.length})
              </button>
              <button
                onClick={() => { setActiveTab('refunds'); setSelectedItems([]); setBatchMode(false); }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === 'refunds'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                退改审核 ({filteredRefunds.length})
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {activeTab !== 'shows' && (
                <>
                  <button
                    onClick={() => { setBatchMode(!batchMode); setSelectedItems([]); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      batchMode
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {batchMode ? '取消批量' : '批量操作'}
                  </button>
                  {batchMode && selectedItems.length > 0 && (
                    <button
                      onClick={handleBatchConfirm}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition"
                    >
                      批量确认 ({selectedItems.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">筛选场次：</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedShow(null)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  selectedShow === null
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                全部
              </button>
              {shows.slice(0, 6).map((show) => (
                <button
                  key={show.id}
                  onClick={() => setSelectedShow(show.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${
                    selectedShow === show.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {show.name}
                  {show.status === 'MODIFIED' && (
                    <span className="ml-1 text-yellow-500">★</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {activeTab === 'shows' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      演出名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      场馆
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      售票情况
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      关联
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shows.map((show) => (
                    <tr key={show.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{show.name}</div>
                        {show.status === 'MODIFIED' && show.changeLog && show.changeLog.length > 0 && (
                          <div className="text-xs text-yellow-600 mt-1">
                            最近变更: {dayjs(show.changeLog[show.changeLog.length - 1]?.changedAt).format('MM-DD HH:mm')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {showTypeNames[show.type] || show.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{dayjs(show.startTime).format('MM-DD HH:mm')}</div>
                        <div className="text-xs text-gray-400">
                          {dayjs(show.endTime).format('HH:mm')} 结束
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {show.venue}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${(show.totalSold / show.totalSeats) * 100}%` }}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {show.totalSold}/{show.totalSeats}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[show.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusNames[show.status] || show.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-500">
                            {show.orders?.length || 0} 个团单
                          </span>
                          {show.refundRequestCount > 0 && (
                            <span className="text-orange-500 font-medium">
                              {show.refundRequestCount} 个退改
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {batchMode && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length === filteredOrders.filter((o) => o.status === 'PENDING').length && 
                            filteredOrders.filter((o) => o.status === 'PENDING').length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      团单编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      单位/联系人
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      对应场次
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      票数/金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={`hover:bg-gray-50 ${order.showStatus === 'MODIFIED' ? 'bg-yellow-50' : ''}`}>
                      {batchMode && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(order.id)}
                            onChange={() => handleBatchSelect(order.id)}
                            disabled={order.status !== 'PENDING'}
                            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.orderNo}</div>
                        {order.showStatus === 'MODIFIED' && (
                          <div className="text-xs text-yellow-600">场次已变更</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.organization}</div>
                        <div className="text-sm text-gray-500">{order.contactName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.showName}</div>
                        <div className="text-xs text-gray-500">
                          {dayjs(order.showTime).format('MM-DD HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{order.ticketCount} 张</div>
                        <div className="text-sm text-gray-500">¥{order.totalAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusNames[order.status] || order.status}
                        </span>
                        {order.refundRequests?.length > 0 && (
                          <div className="text-xs text-orange-500 mt-1">
                            有 {order.refundRequests.length} 个退改
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {dayjs(order.createdAt).format('MM-DD HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'PENDING' && (user?.role === 'TICKET_SUPERVISOR' || user?.role === 'THEATER_MANAGER') && (
                          <button
                            onClick={() => handleOrderConfirm(order.id)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            确认
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'refunds' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {batchMode && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.length === filteredRefunds.filter((r) => 
                              user?.role === 'TICKET_SUPERVISOR' 
                                ? r.status === 'PENDING' 
                                : r.status === 'APPROVED_TICKET'
                            ).length && 
                            filteredRefunds.filter((r) => 
                              user?.role === 'TICKET_SUPERVISOR' 
                                ? r.status === 'PENDING' 
                                : r.status === 'APPROVED_TICKET'
                            ).length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请编号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请单位
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型/原因
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      原场次
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      改期目标
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      退改内容
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      已收款/待退款
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRefunds.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      {batchMode && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(request.id)}
                            onChange={() => handleBatchSelect(request.id)}
                            disabled={
                              (user?.role === 'TICKET_SUPERVISOR' && request.status !== 'PENDING') ||
                              (user?.role === 'THEATER_MANAGER' && request.status !== 'APPROVED_TICKET')
                            }
                            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </td>
                      )}
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{request.requestNo}</div>
                        <div className="text-xs text-gray-500">团单: {request.orderNo}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{request.organization}</div>
                        <div className="text-sm text-gray-500">{request.applicantName}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {request.type === 'FULL' ? '全额退票' : request.type === 'PARTIAL' ? '部分退票' : '改期'}
                        </div>
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title={request.reason}>
                          {request.reason}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 font-medium">{request.showName}</div>
                        <div className="text-xs text-gray-500">
                          {dayjs(request.showTime).format('MM-DD HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {request.type === 'DATE_CHANGE' && request.newShowName ? (
                          <>
                            <div className="text-sm text-blue-600 font-medium">{request.newShowName}</div>
                            <div className="text-xs text-blue-500">
                              {dayjs(request.newShowTime).format('MM-DD HH:mm')}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {request.refundTicketCount} / {request.originalTicketCount} 张
                        </div>
                        <div className="text-sm text-gray-500">¥{request.refundAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-green-600 font-medium">
                          已收: ¥{request.paidAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-red-500">
                          待退: ¥{Math.min(request.pendingRefund, request.refundAmount).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="mb-1">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[request.status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusNames[request.status] || request.status}
                          </span>
                        </div>
                        {request.ticketApprovalNote && (
                          <div className="text-xs text-gray-500" title={request.ticketApprovalNote}>
                            票务: {request.ticketApprovalNote.slice(0, 10)}...
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div className="text-xs text-red-500" title={request.rejectionReason}>
                            驳回: {request.rejectionReason.slice(0, 10)}...
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {dayjs(request.createdAt).format('MM-DD HH:mm')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {request.status === 'PENDING' && user?.role === 'TICKET_SUPERVISOR' && (
                            <>
                              <button
                                onClick={() => handleRefundApprove(request.id, true)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => handleRejectClick(request.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                              >
                                驳回
                              </button>
                            </>
                          )}
                          {request.status === 'APPROVED_TICKET' && user?.role === 'THEATER_MANAGER' && (
                            <>
                              <button
                                onClick={() => handleRefundApprove(request.id, false)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium px-2 py-1 rounded hover:bg-green-50 transition"
                              >
                                终审
                              </button>
                              <button
                                onClick={() => handleRejectClick(request.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                              >
                                驳回
                              </button>
                            </>
                          )}
                          {request.status === 'REJECTED' && (
                            <span className="text-xs text-gray-400">已处理</span>
                          )}
                          {request.status === 'COMPLETED' && (
                            <span className="text-xs text-gray-400">已完成</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">最近动态</h3>
        <div className="space-y-3">
          {dashboard?.recentActivities?.slice(0, 5).map((activity: any, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">{activity.userName?.charAt(0) || '系'}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium text-gray-800">{activity.userName}</span>
                  <span className="text-gray-600"> {activity.action}</span>
                  <span className="text-gray-500"> - {activity.detail}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {dayjs(activity.createdAt).format('MM-DD HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">驳回退改申请</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                驳回原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="请输入驳回原因，该原因将被记录..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition resize-none"
                rows={4}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectingId(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                取消
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
