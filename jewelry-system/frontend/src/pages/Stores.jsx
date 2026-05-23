import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import { ShopOutlined, GiftOutlined, SwapOutlined, UnorderedListOutlined } from '@ant-design/icons';
import request from '../utils/request';
import useAuthStore from '../store/authStore';

const { Title, Text } = Typography;

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const storesData = await request.get('/stores');
      setStores(storesData);
      
      const statsMap = {};
      for (const store of storesData) {
        try {
          const storeStats = await request.get(`/stores/${store.id}/stats`);
          statsMap[store.id] = storeStats;
        } catch (e) {
          console.error(`Failed to load stats for store ${store.id}:`, e);
        }
      }
      setStats(statsMap);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>门店数据</Title>
        <Text type="secondary">各门店运营数据统计</Text>
      </div>

      <Row gutter={[16, 16]}>
        {stores.map(store => (
          <Col xs={24} lg={12} key={store.id}>
            <Card 
              loading={loading}
              title={
                <Space>
                  <ShopOutlined />
                  <span>{store.name}</span>
                  {user?.store_id === store.id && (
                    <Text type="success" style={{ fontSize: 12 }}>（当前门店）</Text>
                  )}
                </Space>
              }
              extra={<Text type="secondary">{store.address}</Text>}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="在库货品"
                    value={stats[store.id]?.products?.in_stock || 0}
                    prefix={<GiftOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="库存总值"
                    value={stats[store.id]?.products?.total_value || 0}
                    precision={0}
                    prefix="¥"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="待审批调货"
                    value={stats[store.id]?.transfers?.outgoing_pending || 0}
                    prefix={<SwapOutlined />}
                    valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="待收货"
                    value={stats[store.id]?.transfers?.incoming_shipped || 0}
                    prefix={<SwapOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: 20 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="盘点记录"
                    value={stats[store.id]?.inventory?.total || 0}
                    prefix={<UnorderedListOutlined />}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="累计差异"
                    value={stats[store.id]?.inventory?.total_differences || 0}
                    valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
};

export default Stores;
