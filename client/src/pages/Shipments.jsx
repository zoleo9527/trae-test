import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shipmentApi, commonApi } from '../api';
import CreateShipmentModal from '../components/CreateShipmentModal';

const STATUS_LABELS = {
  pending: '待发货',
  shipped: '已发货',
  delivered: '已送达',
  confirmed: '已确认',
  receipt_lost: '回执丢失',
  closed: '已关闭'
};

const Shipments = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [channels, setChannels] = useState([]);
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ status: '', channelId: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [shipmentRes, channelRes, bookRes] = await Promise.all([
        shipmentApi.list(filters),
        commonApi.channels(),
        commonApi.books()
      ]);
      setShipments(shipmentRes.data.data || []);
      setChannels(channelRes.data.data || []);
      setBooks(bookRes.data.data || []);
    } catch (error) {
      console.error('Load shipments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/shipments/${id}`);
  };

  const handleShip = async (e, id) => {
    e.stopPropagation();
    const expressCompany = prompt('请输入快递公司:');
    const trackingNo = prompt('请输入快递单号:');
    if (expressCompany && trackingNo) {
      try {
        await shipmentApi.ship(id, { expressCompany, trackingNo });
        loadData();
      } catch (error) {
        alert('发货失败');
      }
    }
  };

  const handleConfirm = async (e, id) => {
    e.stopPropagation();
    if (confirm('确认收到回执？')) {
      try {
        await shipmentApi.confirm(id);
        loadData();
      } catch (error) {
        alert('确认失败');
      }
    }
  };

  const handleMarkLost = async (e, id) => {
    e.stopPropagation();
    if (confirm('确定标记为回执丢失？')) {
      try {
        await shipmentApi.markLost(id);
        loadData();
      } catch (error) {
        alert('操作失败');
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>样书寄送列表</h3>
          {hasRole('distribution_specialist') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
              + 新建寄送
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="filter-bar">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select 
              value={filters.channelId} 
              onChange={(e) => setFilters({ ...filters, channelId: e.target.value })}
            >
              <option value="">全部渠道</option>
              {channels.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>寄送单号</th>
                <th>图书名称</th>
                <th>渠道</th>
                <th>数量</th>
                <th>金额</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(shipment => (
                <tr key={shipment.id} onClick={() => handleRowClick(shipment.id)} style={{ cursor: 'pointer' }}>
                  <td><code>{shipment.shipmentNo}</code></td>
                  <td>{shipment.Book?.title}</td>
                  <td>{shipment.Channel?.name}</td>
                  <td>{shipment.quantity}本</td>
                  <td>¥{shipment.totalAmount}</td>
                  <td>
                    <span className={`status-badge status-${shipment.status}`}>
                      {STATUS_LABELS[shipment.status]}
                    </span>
                  </td>
                  <td>{new Date(shipment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {hasRole('distribution_specialist') && shipment.status === 'pending' && (
                        <button className="btn btn-primary btn-sm" onClick={(e) => handleShip(e, shipment.id)}>
                          发货
                        </button>
                      )}
                      {hasRole('channel_manager') && ['delivered', 'shipped'].includes(shipment.status) && (
                        <button className="btn btn-success btn-sm" onClick={(e) => handleConfirm(e, shipment.id)}>
                          确认回执
                        </button>
                      )}
                      {hasRole('distribution_specialist') && ['delivered', 'shipped'].includes(shipment.status) && (
                        <button className="btn btn-danger btn-sm" onClick={(e) => handleMarkLost(e, shipment.id)}>
                          标记丢失
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateShipmentModal 
          books={books}
          channels={channels}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default Shipments;
