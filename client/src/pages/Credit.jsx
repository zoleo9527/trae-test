import { AlertTriangle, CreditCard, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Table from '../components/Table.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FRUIT_TYPES, GRADING_LEVELS } from '../data/constants.js';

export default function Credit() {
  const { customers, creditOrders, addCreditOrder, coldRoomInventory } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agingFilter, setAgingFilter] = useState('all');

  const [newOrder, setNewOrder] = useState({
    customerId: '',
    items: [{ fruitId: 1, level: 'A', quantity: '', price: '' }],
    creditDays: 30
  });

  const calculateAging = (order) => {
    const dueDate = new Date(order.dueDate);
    const now = new Date();
    const diffDays = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    if (order.status === 'paid') return { label: '已结清', bucket: 'paid' };
    if (diffDays < 0) return { label: `${Math.abs(diffDays)}天后到期`, bucket: 'current' };
    if (diffDays <= 30) return { label: `逾期${diffDays}天`, bucket: 'aging_30' };
    if (diffDays <= 60) return { label: `逾期${diffDays}天`, bucket: 'aging_60' };
    if (diffDays <= 90) return { label: `逾期${diffDays}天`, bucket: 'aging_90' };
    return { label: `逾期${diffDays}天`, bucket: 'aging_90_plus' };
  };

  const filteredOrders = creditOrders.filter(order => {
    const matchesSearch = order.id.includes(searchTerm) ||
      order.customerName.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    let matchesAging = true;
    if (agingFilter !== 'all') {
      const aging = calculateAging(order);
      matchesAging = aging.bucket === agingFilter;
    }

    return matchesSearch && matchesStatus && matchesAging;
  });

  const totalUnpaid = creditOrders
    .filter(o => o.status !== 'paid')
    .reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0);

  const totalOverdue = creditOrders
    .filter(o => o.status === 'overdue' || o.status === 'bad_debt')
    .reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0);

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { fruitId: 1, level: 'A', quantity: '', price: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...newOrder.items];
    newItems[index][field] = value;
    setNewOrder({ ...newOrder, items: newItems });
  };

  const calculateTotal = () => {
    return newOrder.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + quantity * price;
    }, 0);
  };

  const handleCreate = () => {
    if (!newOrder.customerId || newOrder.items.length === 0) return;

    const customer = customers.find(c => c.id === parseInt(newOrder.customerId));
    if (!customer) return;

    const items = newOrder.items.map(item => {
      const fruit = FRUIT_TYPES.find(f => f.id === parseInt(item.fruitId));
      const quantity = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      return {
        fruitId: parseInt(item.fruitId),
        fruitName: fruit?.name || '',
        level: item.level,
        quantity,
        price,
        amount: quantity * price
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const createDate = new Date();
    const dueDate = new Date(createDate);
    dueDate.setDate(dueDate.getDate() + parseInt(newOrder.creditDays));

    addCreditOrder({
      customerId: parseInt(newOrder.customerId),
      customerName: customer.name,
      items,
      totalAmount,
      creditDays: parseInt(newOrder.creditDays),
      dueDate: dueDate.toISOString().split('T')[0],
      salesperson: '李销售'
    });

    setShowCreateModal(false);
    setNewOrder({
      customerId: '',
      items: [{ fruitId: 1, level: 'A', quantity: '', price: '' }],
      creditDays: 30
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">赊销账龄</h1>
          <p className="text-gray-500 mt-1">管理赊销订单和账龄分析</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} className="mr-2" />
          新建赊销单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-gray-400" />
            <p className="text-sm text-gray-500">未收款总额</p>
          </div>
          <p className="text-2xl font-bold text-gray-800">¥{totalUnpaid.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-danger-500" />
            <p className="text-sm text-gray-500">逾期总额</p>
          </div>
          <p className="text-2xl font-bold text-danger-600">¥{totalOverdue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">30天内到期</p>
          <p className="text-2xl font-bold text-warning-600">
            ¥{creditOrders.filter(o => {
              const dueDate = new Date(o.dueDate);
              const now = new Date();
              const diffDays = (dueDate - now) / (1000 * 60 * 60 * 24);
              return diffDays > 0 && diffDays <= 30 && o.status !== 'paid';
            }).reduce((sum, o) => sum + (o.totalAmount - o.paidAmount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-500 mb-1">逾期占比</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalUnpaid > 0 ? ((totalOverdue / totalUnpaid) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、客户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select max-w-[150px]"
          >
            <option value="all">全部状态</option>
            <option value="normal">正常</option>
            <option value="warning">预警</option>
            <option value="overdue">逾期</option>
            <option value="bad_debt">坏账</option>
            <option value="paid">已结清</option>
          </select>
          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
            className="select max-w-[150px]"
          >
            <option value="all">全部账龄</option>
            <option value="current">未到期</option>
            <option value="aging_30">逾期1-30天</option>
            <option value="aging_60">逾期31-60天</option>
            <option value="aging_90">逾期61-90天</option>
            <option value="aging_90_plus">逾期90天以上</option>
            <option value="paid">已结清</option>
          </select>
        </div>

        <Table headers={['订单号', '客户', '商品', '金额', '已付', '未付', '赊销天数', '到期日', '账龄', '状态', '销售员']}>
          {filteredOrders.map((order) => {
            const aging = calculateAging(order);
            return (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-primary-600">{order.id}</td>
                <td className="px-4 py-3 text-sm">{order.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {order.items.map(i => i.fruitName).join(', ')}
                </td>
                <td className="px-4 py-3 text-sm font-medium">¥{order.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-primary-600">¥{order.paidAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-danger-600 font-medium">
                  ¥{(order.totalAmount - order.paidAmount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm">{order.creditDays}天</td>
                <td className="px-4 py-3 text-sm">{order.dueDate}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={
                    aging.bucket === 'paid' ? 'text-primary-600' :
                    aging.bucket === 'current' ? 'text-gray-600' :
                    aging.bucket === 'aging_30' ? 'text-warning-600' :
                    'text-danger-600'
                  }>
                    {aging.label}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-sm">{order.salesperson}</td>
              </tr>
            );
          })}
        </Table>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建赊销单"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">选择客户</label>
              <select
                className="select"
                value={newOrder.customerId}
                onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
              >
                <option value="">请选择客户</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} (额度：¥{customer.creditLimit.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">赊销天数</label>
              <select
                className="select"
                value={newOrder.creditDays}
                onChange={(e) => setNewOrder({ ...newOrder, creditDays: e.target.value })}
              >
                <option value="15">15天</option>
                <option value="30">30天</option>
                <option value="45">45天</option>
                <option value="60">60天</option>
                <option value="90">90天</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">商品明细</label>
              <button onClick={handleAddItem} className="text-primary-600 text-sm hover:text-primary-700">
                + 添加商品
              </button>
            </div>
            <div className="space-y-2">
              {newOrder.items.map((item, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <label className="text-xs text-gray-500">水果</label>
                    <select
                      className="select"
                      value={item.fruitId}
                      onChange={(e) => handleItemChange(index, 'fruitId', e.target.value)}
                    >
                      {FRUIT_TYPES.map(fruit => (
                        <option key={fruit.id} value={fruit.id}>{fruit.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">等级</label>
                    <select
                      className="select"
                      value={item.level}
                      onChange={(e) => handleItemChange(index, 'level', e.target.value)}
                    >
                      {GRADING_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>{level.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">数量 (斤)</label>
                    <input
                      type="number"
                      className="input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">单价 (元)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-danger-600 hover:text-danger-700 text-sm"
                    disabled={newOrder.items.length <= 1}
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-gray-600">订单总计</span>
            <span className="text-2xl font-bold text-primary-600">¥{calculateTotal().toLocaleString()}</span>
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
    </div>
  );
}
