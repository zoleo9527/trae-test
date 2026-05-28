'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Layout from '../../../components/Layout';
import { api } from '../../../lib/api';
import { 
  Ship, 
  ArrowLeft,
  Clock,
  FileText,
  MessageSquare,
  CreditCard,
  Users,
  Package,
  Plus,
  Send
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const styles = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    draft: 'bg-gray-100 text-gray-800',
  };
  const labels = {
    confirmed: '已确认',
    pending: '待确认',
    completed: '已完成',
    draft: '草稿',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

const ServiceStatusBadge = ({ status }) => {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };
  const labels = {
    completed: '已完成',
    in_progress: '进行中',
    pending: '待处理',
  };
  return (
    <span className={`badge ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function BerthDetailPage() {
  const params = useParams();
  const [berth, setBerth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchBerthDetail();
  }, [params.id]);

  const fetchBerthDetail = async () => {
    try {
      setLoading(true);
      const data = await api.berth.get(params.id);
      setBerth(data);
    } catch (err) {
      console.error('Failed to fetch berth detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.berth.addCommunication(params.id, {
        subject: '沟通记录',
        content: newMessage,
        direction: 'internal',
      });
      setNewMessage('');
      fetchBerthDetail();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!berth) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">靠泊计划不存在</div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: FileText },
    { id: 'services', label: '服务', icon: Package },
    { id: 'payments', label: '费用', icon: CreditCard },
    { id: 'crew', label: '船员', icon: Users },
    { id: 'supplies', label: '补给', icon: Package },
    { id: 'communications', label: '沟通', icon: MessageSquare },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/berth" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </a>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{berth.ship_name}</h1>
              <StatusBadge status={berth.status} />
            </div>
            <p className="text-gray-500 mt-1">{berth.purpose}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">到港时间</p>
                <p className="font-medium">{berth.arrival_date?.split(' ')[0]}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">离港时间</p>
                <p className="font-medium">{berth.departure_date?.split(' ')[0] || '待定'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Ship className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">泊位</p>
                <p className="font-medium">{berth.berth_number || '待定'}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">服务项</p>
                <p className="font-medium">{berth.services?.length || 0} 项</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">船名</p>
                    <p className="font-medium">{berth.ship_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">靠泊目的</p>
                    <p className="font-medium">{berth.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">到港时间</p>
                    <p className="font-medium">{berth.arrival_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">离港时间</p>
                    <p className="font-medium">{berth.departure_date || '待定'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">服务列表</h3>
                <button className="btn btn-secondary text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  添加服务
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {berth.services?.map((service) => (
                  <div key={service.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{service.title}</p>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                    <ServiceStatusBadge status={service.status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">垫付费用</h3>
              {berth.payments?.length === 0 ? (
                <p className="text-gray-500">暂无垫付费用记录</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {berth.payments?.map((payment) => (
                    <div key={payment.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{payment.supplier}</p>
                        <p className="text-sm text-gray-500">{payment.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">¥{payment.amount.toLocaleString()}</p>
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'crew' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">船员换班</h3>
              {berth.crewChanges?.length === 0 ? (
                <p className="text-gray-500">暂无船员换班记录</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {berth.crewChanges?.map((crew) => (
                    <div key={crew.id} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{crew.crew_name}</p>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {crew.type === 'sign_on' ? '上船' : '下船'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{crew.rank} · {crew.nationality}</p>
                      </div>
                      <div className="text-right">
                        <ServiceStatusBadge status={crew.status} />
                        <p className="text-xs text-gray-500 mt-1">
                          证件: {crew.documents_status === 'approved' ? '已审核' : crew.documents_status === 'rejected' ? '被拒' : '待审核'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'supplies' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">补给申请</h3>
              {berth.supplies?.length === 0 ? (
                <p className="text-gray-500">暂无补给申请</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {berth.supplies?.map((supply) => (
                    <div key={supply.id} className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{supply.category === 'food' ? '食品补给' : supply.category === 'fuel' ? '燃油补给' : '物料补给'}</p>
                        <p className="text-sm text-gray-500">预估费用: ¥{supply.estimated_cost?.toLocaleString()}</p>
                      </div>
                      <ServiceStatusBadge status={supply.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">沟通记录</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {berth.communications?.map((comm) => (
                  <div key={comm.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{comm.from_name}</span>
                      <span className="text-xs text-gray-500">{comm.created_at}</span>
                    </div>
                    {comm.subject && <p className="text-sm font-medium text-gray-700 mb-1">{comm.subject}</p>}
                    <p className="text-gray-600">{comm.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  placeholder="输入消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="input flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="btn btn-primary">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
