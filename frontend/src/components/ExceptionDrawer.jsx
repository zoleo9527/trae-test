import { useState, useEffect } from 'react';
import { Drawer, Descriptions, Form, Input, Button, Popconfirm, message, Space, Typography, Divider } from 'antd';
import StatusTag from './StatusTag';
import AuditTimeline from './AuditTimeline';
import api from '../api';

const { TextArea } = Input;
const { Text } = Typography;

export default function ExceptionDrawer({ open, onClose, record, onRefresh }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (open && record) {
      form.resetFields();
      if (record.resolution) {
        form.setFieldsValue({ resolution: record.resolution });
      }
      fetchAuditLogs();
    }
  }, [open, record]);

  const fetchAuditLogs = async () => {
    if (!record) return;
    try {
      const res = await api.get('/audit-logs', {
        params: { target_type: 'exception_record', target_id: record.id },
      });
      setAuditLogs(res.data || []);
    } catch {
      setAuditLogs([]);
    }
  };

  if (!record) return null;

  const handleStart = async () => {
    try {
      await form.validateFields(['resolution']);
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      const resolution = form.getFieldValue('resolution');
      await api.put(`/exceptions/${record.id}/handle`, null, {
        params: { resolution },
      });
      message.success('已开始处理');
      onRefresh?.();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    try {
      await form.validateFields(['resolution']);
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      const resolution = form.getFieldValue('resolution');
      await api.put(`/exceptions/${record.id}/close`, null, {
        params: { resolution },
      });
      message.success('异常已关闭');
      onRefresh?.();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const status = record.status;

  return (
    <Drawer open={open} onClose={onClose} width={640} title="异常处理">
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="异常类型">{record.exception_type}</Descriptions.Item>
        <Descriptions.Item label="严重程度">
          <StatusTag status={record.severity} type="severity" />
        </Descriptions.Item>
        <Descriptions.Item label="来源">{record.source_type} #{record.source_id}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={record.status} type="exception" />
        </Descriptions.Item>
        <Descriptions.Item label="描述">{record.description}</Descriptions.Item>
        {record.handler && (
          <Descriptions.Item label="处理人">{record.handler.display_name}</Descriptions.Item>
        )}
        {record.handled_at && (
          <Descriptions.Item label="处理时间">{record.handled_at}</Descriptions.Item>
        )}
        {record.closed_at && (
          <Descriptions.Item label="关闭时间">{record.closed_at}</Descriptions.Item>
        )}
      </Descriptions>

      <Divider orientation="left">处理操作</Divider>

      <div style={{ marginBottom: 24 }}>
        {status === '待处理' && (
          <Form form={form} layout="vertical">
            <Form.Item name="resolution" label="处理方案" rules={[{ required: true, message: '请填写处理方案' }]}>
              <TextArea rows={3} placeholder="请描述处理方案" />
            </Form.Item>
            <Popconfirm title="确认开始处理此异常？" onConfirm={handleStart}>
              <Button type="primary" loading={submitting}>开始处理</Button>
            </Popconfirm>
          </Form>
        )}

        {status === '处理中' && (
          <Form form={form} layout="vertical">
            <Form.Item name="resolution" label="最终处理结果" rules={[{ required: true, message: '请填写处理结果' }]}>
              <TextArea rows={3} placeholder="请描述最终处理结果" />
            </Form.Item>
            <Popconfirm title="确认关闭此异常？" onConfirm={handleClose}>
              <Button type="primary" danger loading={submitting}>关闭异常</Button>
            </Popconfirm>
          </Form>
        )}

        {status === '已关闭' && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="success" strong>✓ 异常已关闭</Text>
            {record.resolution && (
              <div>
                <Text strong>处理结果：</Text>
                <Text>{record.resolution}</Text>
              </div>
            )}
          </Space>
        )}
      </div>

      <Divider orientation="left">操作留痕</Divider>

      <AuditTimeline records={auditLogs} />
    </Drawer>
  );
}
