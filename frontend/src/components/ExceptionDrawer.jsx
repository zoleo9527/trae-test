import { useState, useEffect, useCallback } from 'react';
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
  const [currentRecord, setCurrentRecord] = useState(null);

  useEffect(() => {
    if (open && record) {
      setCurrentRecord(record);
      form.resetFields();
      if (record.resolution) {
        form.setFieldsValue({ resolution: record.resolution });
      }
      fetchAuditLogs(record.id);
    }
  }, [open, record]);

  const fetchAuditLogs = async (id) => {
    const targetId = id || currentRecord?.id;
    if (!targetId) return;
    try {
      const res = await api.get('/audit-logs', {
        params: { target_type: 'exception_record', target_id: targetId },
      });
      setAuditLogs(res.data || []);
    } catch {
      setAuditLogs([]);
    }
  };

  const refreshRecord = useCallback(async () => {
    if (!currentRecord) return;
    try {
      const res = await api.get(`/exceptions/${currentRecord.id}`);
      setCurrentRecord(res.data);
      form.resetFields();
      if (res.data.resolution) {
        form.setFieldsValue({ resolution: res.data.resolution });
      }
      fetchAuditLogs(res.data.id);
    } catch {
      message.error('刷新异常信息失败');
    }
  }, [currentRecord]);

  if (!currentRecord) return null;

  const handleStart = async () => {
    try {
      await form.validateFields(['resolution']);
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      const resolution = form.getFieldValue('resolution');
      await api.put(`/exceptions/${currentRecord.id}/handle`, null, {
        params: { resolution },
      });
      message.success('已开始处理');
      await refreshRecord();
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
      await api.put(`/exceptions/${currentRecord.id}/close`, null, {
        params: { resolution },
      });
      message.success('异常已关闭');
      await refreshRecord();
      onRefresh?.();
    } catch {
      message.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const status = currentRecord.status;

  return (
    <Drawer open={open} onClose={onClose} width={640} title="异常处理">
      <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
        <Descriptions.Item label="异常类型">{currentRecord.exception_type}</Descriptions.Item>
        <Descriptions.Item label="严重程度">
          <StatusTag status={currentRecord.severity} type="severity" />
        </Descriptions.Item>
        <Descriptions.Item label="来源">{currentRecord.source_type} #{currentRecord.source_id}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusTag status={currentRecord.status} type="exception" />
        </Descriptions.Item>
        <Descriptions.Item label="描述">{currentRecord.description}</Descriptions.Item>
        {currentRecord.handler && (
          <Descriptions.Item label="处理人">{currentRecord.handler.display_name}</Descriptions.Item>
        )}
        {currentRecord.handled_at && (
          <Descriptions.Item label="处理时间">{currentRecord.handled_at}</Descriptions.Item>
        )}
        {currentRecord.closed_at && (
          <Descriptions.Item label="关闭时间">{currentRecord.closed_at}</Descriptions.Item>
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
            {currentRecord.resolution && (
              <div>
                <Text strong>处理结果：</Text>
                <Text>{currentRecord.resolution}</Text>
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
