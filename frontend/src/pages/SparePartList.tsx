import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Input, Select, Row, Col, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { sparePartApi } from '../services/api';
import { SparePart } from '../types';

const { Option } = Select;

const SparePartList: React.FC = () => {
  const [data, setData] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<any>({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await sparePartApi.getList({
        page,
        limit: pageSize,
        ...filters,
      });
      setData(res.data.data);
      setTotal(res.data.meta.total);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleCreate = async (values: any) => {
    try {
      await sparePartApi.create(values);
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      console.error('创建失败:', error);
      message.error('创建失败');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Tag color="red">缺货</Tag>;
    } else if (quantity < 10) {
      return <Tag color="orange">库存紧张</Tag>;
    }
    return <Tag color="green">充足</Tag>;
  };

  const columns = [
    {
      title: '备件编码',
      dataIndex: 'partCode',
      key: 'partCode',
      width: 120,
    },
    {
      title: '备件名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      render: (spec?: string) => spec || '-',
    },
    {
      title: '生产厂商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      render: (m?: string) => m || '-',
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (price: number) => `¥${price}`,
    },
    {
      title: '库存数量',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      render: (quantity: number, record: SparePart) => (
        <Space>
          <span>{quantity}</span>
          <span>{record.unit || ''}</span>
          {getStockStatus(quantity)}
        </Space>
      ),
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      render: (loc?: string) => loc || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="关键词">
                <Input
                  placeholder="搜索编码、名称"
                  prefix={<SearchOutlined />}
                  onPressEnter={handleSearch}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="生产厂商">
                <Select
                  placeholder="选择厂商"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={(value) => setFilters({ ...filters, manufacturer: value })}
                >
                  <Option value="华为">华为</Option>
                  <Option value="中兴">中兴</Option>
                  <Option value="西门子">西门子</Option>
                  <Option value="ABB">ABB</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space>
                <Button type="primary" onClick={handleSearch}>查询</Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新增备件
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>

      <Modal
        title="新增备件"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="partCode"
            label="备件编码"
            rules={[{ required: true, message: '请输入备件编码' }]}
          >
            <Input placeholder="请输入备件编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="备件名称"
            rules={[{ required: true, message: '请输入备件名称' }]}
          >
            <Input placeholder="请输入备件名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="specification" label="规格型号">
                <Input placeholder="请输入规格型号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manufacturer" label="生产厂商">
                <Input placeholder="请输入生产厂商" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unitPrice" label="单价">
                <Input type="number" placeholder="请输入单价" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stockQuantity" label="库存数量">
                <Input type="number" placeholder="请输入库存数量" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位">
                <Input placeholder="如：台、个" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="存放位置">
            <Input placeholder="请输入存放位置" />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SparePartList;
