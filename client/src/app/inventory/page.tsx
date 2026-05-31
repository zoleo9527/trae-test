'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Plus, Play, CheckCircle } from 'lucide-react';

export default function InventoryPage() {
  const [inventories, setInventories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInventory, setNewInventory] = useState({ title: '', type: 'FULL' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invRes, matRes] = await Promise.all([
        api.get('/materials/inventories'),
        api.get('/materials'),
      ]);
      setInventories(invRes.data.inventories);
      setMaterials(matRes.data.materials);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/materials/inventories', {
        ...newInventory,
        materialIds: materials.map(m => m.id),
      });
      setShowCreateModal(false);
      setNewInventory({ title: '', type: 'FULL' });
      loadData();
    } catch (error) {
      alert('创建失败');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await api.post(`/materials/inventories/${id}/start`, {});
      loadData();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await api.post(`/materials/inventories/${id}/complete`, {});
      loadData();
    } catch (error) {
      alert('操作失败');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">库存盘点</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          新建盘点
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>盘点单号</th>
              <th>标题</th>
              <th>类型</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {inventories.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-sm">{inv.inventoryNo}</td>
                <td>{inv.title}</td>
                <td>{inv.type === 'FULL' ? '全盘' : '抽盘'}</td>
                <td>
                  <span className={`badge ${inv.status === 'COMPLETED' ? 'badge-completed' : 'badge-pending'}`}>
                    {inv.status === 'DRAFT' && '草稿'}
                    {inv.status === 'IN_PROGRESS' && '进行中'}
                    {inv.status === 'COMPLETED' && '已完成'}
                  </span>
                </td>
                <td className="text-sm">{inv.createdBy.name}</td>
                <td className="text-sm">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="flex gap-1">
                    {inv.status === 'DRAFT' && (
                      <button 
                        onClick={() => handleStart(inv.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600"
                        title="开始盘点"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {inv.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={() => handleComplete(inv.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600"
                        title="完成盘点"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {inventories.length === 0 && (
          <p className="text-center text-gray-400 py-8">暂无盘点记录</p>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-96 p-4">
            <h3 className="font-semibold mb-4">新建盘点</h3>
            <div className="space-y-4">
              <div>
                <label>盘点标题</label>
                <input
                  value={newInventory.title}
                  onChange={(e) => setNewInventory({ ...newInventory, title: e.target.value })}
                  placeholder="如：5月月末盘点"
                />
              </div>
              <div>
                <label>盘点类型</label>
                <select
                  value={newInventory.type}
                  onChange={(e) => setNewInventory({ ...newInventory, type: e.target.value })}
                >
                  <option value="FULL">全盘</option>
                  <option value="PARTIAL">抽盘</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="btn btn-secondary"
              >
                取消
              </button>
              <button onClick={handleCreate} className="btn btn-primary">
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
