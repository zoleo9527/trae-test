import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Row,
  Col,
  Card,
  Button,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Avatar,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { followupAPI, staffAPI, trialAPI, customerAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const followupTypeLabels = {
  phone: '电话回访',
  visit: '上门拜访',
  wechat: '微信跟进',
};

const followupTypeColors = {
  phone: 'blue',
  visit: 'green',
  wechat: 'purple',
};

function SortableFollowupItem({ item, onComplete, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'followup', item } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`drag-item ${isDragging ? 'dragging' : ''}`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{item.customer_name?.[0]}</Avatar>
              <strong>{item.customer_name}</strong>
              <Tag color={followupTypeColors[item.followup_type]} size="small">
                {followupTypeLabels[item.followup_type]}
              </Tag>
              {item.status === 'completed' && <Tag color="green">已完成</Tag>}
            </Space>
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
            {item.product_name}
          </div>
          {item.scheduled_time && (
            <div style={{ fontSize: 12, color: '#999' }}>
              预计时间：{item.scheduled_time}
            </div>
          )}
          {item.result && (
            <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4, paddingTop: 4, borderTop: '1px dashed #e8e8e8' }}>
              回访结果：{item.result}
            </div>
          )}
        </div>
        {item.status !== 'completed' && (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onComplete(item);
              }}
            />
            <Popconfirm
              title="确定删除此回访任务？"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        )}
      </div>
    </div>
  );
}

function DroppableColumn({ date, dateStr, items, onAddClick, children }) {
  return (
    <Col span={24 / 7}>
      <Card
        size="small"
        title={
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#999' }}>{date.format('MM/DD')}</div>
            <div style={{ fontSize: 12 }}>
              {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.day()]}
            </div>
            {date.isSame(dayjs(), 'day') && <Tag color="blue" size="small">今天</Tag>}
          </div>
        }
        style={{ height: '100%' }}
        bodyStyle={{ minHeight: 400, padding: 8 }}
        extra={
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onAddClick(date)}
          />
        }
      >
        <SortableContext
          id={dateStr}
          items={items.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </Card>
    </Col>
  );
}

function Followups() {
  const [followups, setFollowups] = useState([]);
  const [staff, setStaff] = useState([]);
  const [trials, setTrials] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs(), dayjs().add(6, 'day')]);
  const [modalVisible, setModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completingItem, setCompletingItem] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [form] = Form.useForm();
  const [completeForm] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadStaff();
    loadTrials();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (dateRange) {
      loadFollowups();
    }
  }, [selectedStaff, dateRange]);

  const loadStaff = async () => {
    const data = await staffAPI.getAll();
    setStaff(data);
    if (data.length > 0) {
      setSelectedStaff(data[0].id);
    }
  };

  const loadTrials = async () => {
    const data = await trialAPI.getAll();
    setTrials(data);
  };

  const loadCustomers = async () => {
    const data = await customerAPI.getAll();
    setCustomers(data);
  };

  const loadFollowups = async () => {
    if (!dateRange) return;
    try {
      const data = await followupAPI.getCalendar({
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
        assigned_staff_id: selectedStaff,
      });
      setFollowups(data);
    } catch (error) {
      console.error('加载回访任务失败', error);
    }
  };

  const findContainer = (id) => {
    if (id in getFollowupsByDateGroup()) return id;
    const item = followups.find(f => f.id === id);
    return item ? item.scheduled_date : null;
  };

  const getFollowupsByDateGroup = useCallback(() => {
    const groups = {};
    const start = dateRange[0];
    const days = dateRange[1].diff(dateRange[0], 'day') + 1;
    for (let i = 0; i < days; i++) {
      const date = start.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      groups[dateStr] = followups.filter(f => f.scheduled_date === dateStr);
    }
    return groups;
  }, [followups, dateRange]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeItem = followups.find(f => f.id === activeId);
    if (!activeItem) return;

    const activeContainer = activeItem.scheduled_date;
    const overContainer = findContainer(overId);

    if (!overContainer) return;

    if (activeContainer === overContainer) {
      const items = getFollowupsByDateGroup()[activeContainer] || [];
      const oldIndex = items.findIndex(item => item.id === activeId);
      const overIndex = items.findIndex(item => item.id === overId);

      if (oldIndex !== overIndex) {
        const newItems = arrayMove(items, oldIndex, overIndex);
        const newFollowups = followups.map(f => {
          const idx = newItems.findIndex(item => item.id === f.id);
          if (idx !== -1) {
            return { ...f, scheduled_time: newItems[idx].scheduled_time };
          }
          return f;
        });
        setFollowups(newFollowups);
      }
    } else {
      const newScheduledDate = overContainer;

      try {
        await followupAPI.update(activeId, {
          scheduled_date: newScheduledDate,
          scheduled_time: activeItem.scheduled_time,
        });
        
        const newFollowups = followups.map(f => {
          if (f.id === activeId) {
            return { ...f, scheduled_date: newScheduledDate };
          }
          return f;
        });
        setFollowups(newFollowups);
        message.success('已更新回访日期');
      } catch (error) {
        message.error('更新失败');
        console.error(error);
      }
    }
  };

  const handleCreate = async (values) => {
    try {
      const trial = trials.find(t => t.id === values.trial_id);
      if (trial && trial.customer_id !== values.customer_id) {
        message.error('所选试饮记录与客户不匹配');
        return;
      }

      await followupAPI.create({
        trial_id: values.trial_id,
        customer_id: values.customer_id,
        assigned_staff_id: selectedStaff,
        scheduled_date: values.scheduled_date.format('YYYY-MM-DD'),
        scheduled_time: values.scheduled_time,
        followup_type: values.followup_type,
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadFollowups();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleComplete = async (values) => {
    try {
      await followupAPI.update(completingItem.id, {
        status: 'completed',
        actual_date: dayjs().format('YYYY-MM-DD'),
        content: values.content,
        result: values.result,
        next_followup_date: values.next_followup_date?.format('YYYY-MM-DD'),
      });
      message.success('回访完成');
      setCompleteModalVisible(false);
      completeForm.resetFields();

      if (values.next_followup_date) {
        await followupAPI.create({
          trial_id: completingItem.trial_id,
          customer_id: completingItem.customer_id,
          assigned_staff_id: selectedStaff,
          scheduled_date: values.next_followup_date.format('YYYY-MM-DD'),
          followup_type: completingItem.followup_type,
        });
      }
      loadFollowups();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await followupAPI.delete(id);
      message.success('删除成功');
      loadFollowups();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCustomerChange = (customerId) => {
    form.setFieldValue('trial_id', undefined);
  };

  const filteredTrials = trials.filter(t => 
    !form.getFieldValue('customer_id') || t.customer_id === form.getFieldValue('customer_id')
  );

  const activeItem = activeId ? followups.find(f => f.id === activeId) : null;

  const generateDateColumns = () => {
    const columns = [];
    const start = dateRange[0];
    const days = dateRange[1].diff(dateRange[0], 'day') + 1;

    for (let i = 0; i < days; i++) {
      const date = start.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const dayFollowups = getFollowupsByDateGroup()[dateStr] || [];

      columns.push(
        <DroppableColumn
          key={dateStr}
          date={date}
          dateStr={dateStr}
          items={dayFollowups}
          onAddClick={(d) => {
            form.setFieldsValue({ scheduled_date: d });
            setModalVisible(true);
          }}
        >
          {dayFollowups.map(item => (
            <SortableFollowupItem
              key={item.id}
              item={item}
              onComplete={(item) => {
                setCompletingItem(item);
                setCompleteModalVisible(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </DroppableColumn>
      );
    }
    return columns;
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            style={{ width: 150 }}
            value={selectedStaff}
            onChange={setSelectedStaff}
            placeholder="选择业务员"
          >
            {staff.filter(s => s.role === 'sales').map(s => (
              <Option key={s.id} value={s.id}>{s.name}</Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            allowClear={false}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            新建回访
          </Button>
        </Space>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Row gutter={8}>
          {generateDateColumns()}
        </Row>
        <DragOverlay>
          {activeItem ? (
            <div className="drag-item" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <Space>
                <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{activeItem.customer_name?.[0]}</Avatar>
                <strong>{activeItem.customer_name}</strong>
                <Tag color={followupTypeColors[activeItem.followup_type]} size="small">
                  {followupTypeLabels[activeItem.followup_type]}
                </Tag>
              </Space>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                {activeItem.product_name}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Modal
        title="新建回访任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="客户"
            name="customer_id"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="选择客户" onChange={handleCustomerChange}>
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name} - {c.company}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="关联试饮"
            name="trial_id"
            rules={[{ required: true, message: '请选择试饮记录' }]}
          >
            <Select placeholder="选择试饮记录">
              {filteredTrials.map(t => (
                <Option key={t.id} value={t.id}>{t.customer_name} - {t.product_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="回访日期"
            name="scheduled_date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="回访时间"
            name="scheduled_time"
          >
            <Select placeholder="选择时间（可选）" allowClear>
              <Option value="09:00">09:00</Option>
              <Option value="10:00">10:00</Option>
              <Option value="11:00">11:00</Option>
              <Option value="14:00">14:00</Option>
              <Option value="15:00">15:00</Option>
              <Option value="16:00">16:00</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="回访方式"
            name="followup_type"
            rules={[{ required: true, message: '请选择回访方式' }]}
          >
            <Select>
              <Option value="phone">电话回访</Option>
              <Option value="visit">上门拜访</Option>
              <Option value="wechat">微信跟进</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成回访"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={completeForm}
          layout="vertical"
          onFinish={handleComplete}
        >
          <Form.Item
            label="回访内容"
            name="content"
            rules={[{ required: true, message: '请填写回访内容' }]}
          >
            <TextArea rows={3} placeholder="记录回访沟通内容" />
          </Form.Item>
          <Form.Item
            label="回访结果"
            name="result"
            rules={[{ required: true, message: '请填写回访结果' }]}
          >
            <TextArea rows={2} placeholder="客户反馈、意向等" />
          </Form.Item>
          <Form.Item
            label="下次回访时间"
            name="next_followup_date"
          >
            <DatePicker style={{ width: '100%' }} placeholder="如需继续跟进，请选择下次回访日期" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCompleteModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认完成</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Followups;
