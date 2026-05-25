import { Eye, MapPin, Phone, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function Customers() {
  const { customers, creditOrders } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    contact: '',
    phone: '',
    address: '',
    creditLimit: '',
    level: 'B'
  });

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.includes(searchTerm) ||
      customer.contact.includes(searchTerm) ||
      customer.phone.includes(searchTerm);
    const matchesLevel = levelFilter === 'all' || customer.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleCreate = () => {
    const id = Date.now();
    customers.push({
      id,
      ...newCustomer,
      creditLimit: parseFloat(newCustomer.creditLimit),
      currentCredit: 0,
      status: 'normal',
      createDate: new Date().toISOString().split('T')[0]
    });
    setShowCreateModal(false);
    setNewCustomer({
      name: '',
      contact: '',
      phone: '',
      address: '',
      creditLimit: '',
      level: 'B'
    });
  };

  const getCustomerOrders = (customerId) => {
    return creditOrders.filter(o => o.customerId === customerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
          <p className="text-gray-500 mt-1">管理客户信息和信用额度</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} className="mr-2" />
          新增客户
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">总客户数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">A级客户</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {customers.filter(c => c.level === 'A' || c.level === 'S').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">信用额度总额</p>
          <p className="text-2xl font-bold text-info-600 mt-1">
            ¥{(customers.reduce((sum, c) => sum + c.creditLimit, 0) / 10000).toFixed(1)}万
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500">已用额度</p>
          <p className="text-2xl font-bold text-warning-600 mt-1">
            ¥{(customers.reduce((sum, c) => sum + c.currentCredit, 0) / 10000).toFixed(1)}万
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户名称、联系人、电话..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="select max-w-[150px]"
          >
            <option value="all">全部等级</option>
            <option value="S">S级</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
          </select>
        </div>

        <Table headers={['客户名称', '联系人', '电话', '地址', '信用等级', '信用额度', '已用额度', '状态', '操作']}>
          {filteredCustomers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium">{customer.name}</td>
              <td className="px-4 py-3 text-sm">{customer.contact}</td>
              <td className="px-4 py-3 text-sm">{customer.phone}</td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{customer.address}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  customer.level === 'S' ? 'bg-purple-100 text-purple-700' :
                  customer.level === 'A' ? 'bg-primary-100 text-primary-700' :
                  customer.level === 'B' ? 'bg-info-100 text-info-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {customer.level}级
                </span>
              </td>
              <td className="px-4 py-3 text-sm">¥{customer.creditLimit.toLocaleString()}</td>
              <td className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-warning-500 rounded-full"
                      style={{ width: `${(customer.currentCredit / customer.creditLimit * 100).toFixed(0)}%` }}
                    />
                  </div>
                  <span>¥{customer.currentCredit.toLocaleString()}</span>
                </div>
              </td>
              <td className="px-4 py-3"><StatusBadge status={customer.status} /></td>
              <td className="px-4 py-3">
                <button
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowDetailModal(true);
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                >
                  <Eye size={14} /> 详情
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新增客户"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">客户名称</label>
            <input
              type="text"
              className="input"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="请输入客户名称"
            />
          </div>
          <div>
            <label className="label">联系人</label>
            <input
              type="text"
              className="input"
              value={newCustomer.contact}
              onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
              placeholder="请输入联系人姓名"
            />
          </div>
          <div>
            <label className="label">联系电话</label>
            <input
              type="tel"
              className="input"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="请输入联系电话"
            />
          </div>
          <div>
            <label className="label">信用等级</label>
            <select
              className="select"
              value={newCustomer.level}
              onChange={(e) => setNewCustomer({ ...newCustomer, level: e.target.value })}
            >
              <option value="S">S级（优质）</option>
              <option value="A">A级（良好）</option>
              <option value="B">B级（普通）</option>
              <option value="C">C级（受限）</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">地址</label>
            <input
              type="text"
              className="input"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              placeholder="请输入详细地址"
            />
          </div>
          <div>
            <label className="label">信用额度 (元)</label>
            <input
              type="number"
              className="input"
              value={newCustomer.creditLimit}
              onChange={(e) => setNewCustomer({ ...newCustomer, creditLimit: e.target.value })}
              placeholder="请输入信用额度"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
            取消
          </button>
          <button onClick={handleCreate} className="btn-primary">
            确认创建
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="客户详情"
        size="xl"
      >
        {selectedCustomer && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">客户名称</p>
                <p className="text-lg font-medium text-gray-800">{selectedCustomer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">信用等级</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedCustomer.level === 'S' ? 'bg-purple-100 text-purple-700' :
                  selectedCustomer.level === 'A' ? 'bg-primary-100 text-primary-700' :
                  selectedCustomer.level === 'B' ? 'bg-info-100 text-info-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedCustomer.level}级
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">联系人</p>
                <p className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  {selectedCustomer.contact}
                  <Phone size={14} className="text-gray-400" />
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">电话</p>
                <p className="text-lg font-medium text-gray-800">{selectedCustomer.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">地址</p>
                <p className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {selectedCustomer.address}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">信用额度</p>
                  <p className="text-xl font-bold text-gray-800">¥{selectedCustomer.creditLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">已用额度</p>
                  <p className="text-xl font-bold text-warning-600">¥{selectedCustomer.currentCredit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">可用额度</p>
                  <p className="text-xl font-bold text-primary-600">
                    ¥{(selectedCustomer.creditLimit - selectedCustomer.currentCredit).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning-500 rounded-full"
                  style={{ width: `${(selectedCustomer.currentCredit / selectedCustomer.creditLimit * 100).toFixed(0)}%` }}
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-3">历史赊销订单</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">订单号</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">日期</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">金额</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">已付</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCustomerOrders(selectedCustomer.id).map((order) => (
                      <tr key={order.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 text-sm">{order.id}</td>
                        <td className="px-4 py-2 text-sm">{order.createDate}</td>
                        <td className="px-4 py-2 text-sm">¥{order.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm">¥{order.paidAmount.toLocaleString()}</td>
                        <td className="px-4 py-2"><StatusBadge status={order.status} /></td>
                      </tr>
                    ))}
                    {getCustomerOrders(selectedCustomer.id).length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-4 text-center text-gray-400">
                          暂无订单记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
