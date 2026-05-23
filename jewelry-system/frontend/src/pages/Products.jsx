import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Card, Typography, Input, Select, Modal, Descriptions, Timeline } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../utils/request';
import { PRODUCT_STATUS, REPAIR_STATUS, REPAIR_TYPE } from '../utils/constants';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Products = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '' });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await request.get('/products', { params: filters });
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await request.get(`/products/${record.id}`);
      setSelectedProduct(detail);
      setDetailVisible(true);
    } catch (error) {
      console.error('Failed to load product detail:', error);
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 140,
      render: (text) => <Text strong copyable>{text}</Text>
    },
    {
      title: '货品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '材质',
      dataIndex: 'material',
      key: 'material',
      width: 100
    },
    {
      title: '重量(g)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100
    },
    {
      title: '成本价',
      dataIndex: 'cost_price',
      key: 'cost_price',
      width: 100,
      render: (val) => `¥${val.toLocaleString()}`
    },
    {
      title: '零售价',
      dataIndex: 'retail_price',
      key: 'retail_price',
      width: 120,
      render: (val) => `¥${val.toLocaleString()}`
    },
    {
      title: '所在门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 140
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const config = PRODUCT_STATUS[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>货品查询</Title>
            <Text type="secondary">查看门店所有货品信息</Text>
          </div>
        </div>
        
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          <Input
            placeholder="搜索SKU或名称"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            value={filters.status || undefined}
            onChange={(val) => setFilters({ ...filters, status: val })}
            allowClear
          >
            {Object.entries(PRODUCT_STATUS).map(([key, val]) => (
              <Option key={key} value={key}>{val.label}</Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="货品详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
        {selectedProduct && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="SKU" span={2}>
                <Text strong copyable>{selectedProduct.sku}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="货品名称">{selectedProduct.name}</Descriptions.Item>
              <Descriptions.Item label="品类">{selectedProduct.category}</Descriptions.Item>
              <Descriptions.Item label="材质">{selectedProduct.material}</Descriptions.Item>
              <Descriptions.Item label="重量">{selectedProduct.weight}g</Descriptions.Item>
              <Descriptions.Item label="成本价">¥{selectedProduct.cost_price?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="零售价">¥{selectedProduct.retail_price?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="所在门店">{selectedProduct.store_name}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={PRODUCT_STATUS[selectedProduct.status]?.color}>
                  {PRODUCT_STATUS[selectedProduct.status]?.label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Card title="货品责任链路" size="small">
              <Timeline style={{ maxHeight: 400, overflow: 'auto' }}>
                {[
                  ...(selectedProduct.transfer_history || []).map(t => ({
                    type: 'transfer',
                    time: t.created_at,
                    color: 'blue',
                    content: (
                      <div key={t.id}>
                        <Text strong>【调货】</Text>
                        <Text style={{ marginLeft: 8 }}>{t.request_no}</Text>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          <Tag color="cyan">{t.from_store_name}</Tag>
                          <span style={{ padding: '0 4px' }}>→</span>
                          <Tag color="purple">{t.to_store_name}</Tag>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {t.requester_name} · {dayjs(t.created_at).format('MM-DD HH:mm')}
                          </Text>
                        </div>
                      </div>
                    )
                  })),
                  ...(selectedProduct.repair_history || []).map(r => ({
                    type: 'repair',
                    time: r.created_at,
                    color: 'orange',
                    content: (
                      <div key={r.id}>
                        <Text strong>【返修】</Text>
                        <Text style={{ marginLeft: 8 }}>{r.order_no}</Text>
                        <Tag color={REPAIR_STATUS[r.status]?.color} style={{ marginLeft: 8 }}>
                          {REPAIR_STATUS[r.status]?.label}
                        </Tag>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          <Text type="secondary">
                            {REPAIR_TYPE[r.repair_type]} · 费用: ¥{r.agreed_price || 0} · {dayjs(r.created_at).format('MM-DD HH:mm')}
                          </Text>
                        </div>
                      </div>
                    )
                  }))
                ].sort((a, b) => new Date(b.time) - new Date(a.time)).map((item, idx) => (
                  <Timeline.Item key={idx} color={item.color}>
                    {item.content}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            <Card title="返修记录" size="small">
              <Table
                dataSource={selectedProduct.repair_history || []}
                rowKey="id"
                size="small"
                pagination={false}
                columns={[
                  { title: '返修单号', dataIndex: 'order_no', width: 140 },
                  { title: '返修类型', dataIndex: 'repair_type', width: 100, render: t => REPAIR_TYPE[t] || t },
                  { title: '费用', dataIndex: 'agreed_price', width: 80, render: v => `¥${v || 0}` },
                  { title: '门店', dataIndex: 'store_name', width: 100 },
                  { title: '状态', dataIndex: 'status', width: 80, render: s => <Tag color={REPAIR_STATUS[s]?.color}>{REPAIR_STATUS[s]?.label}</Tag> },
                  { title: '创建时间', dataIndex: 'created_at', render: t => dayjs(t).format('MM-DD HH:mm') }
                ]}
              />
            </Card>
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default Products;
