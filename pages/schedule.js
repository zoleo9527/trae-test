import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import withAuth from '../hoc/withAuth';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

function SortableWorkOrder({ order, onDragStart }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onMouseDown={() => onDragStart(order)}
      className="bg-white border border-gray-200 rounded-lg p-3 mb-2 cursor-move hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-400">{order.id}</span>
        <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[order.priority]}`}>
          {order.priorityName}
        </span>
      </div>
      <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{order.title}</h4>
      <p className="text-xs text-gray-500 mb-2">{order.location}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {order.typeName}
        </span>
        <span className="text-xs text-gray-400">
          {order.createTime?.slice(5, 16)}
        </span>
      </div>
    </div>
  );
}

function EngineerColumn({ engineer, orders, onDragStart }) {
  const { setNodeRef, isOver } = useDroppable({
    id: engineer.id,
  });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
            {engineer.avatar}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{engineer.name}</h3>
            <p className="text-xs text-gray-500">{engineer.roleName}</p>
          </div>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            {orders.length} 个任务
          </span>
        </div>
        {engineer.skills && (
          <div className="flex flex-wrap gap-1 mt-2">
            {engineer.skills.map(skill => (
              <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
      <div 
        ref={setNodeRef}
        className={`border rounded-b-lg p-3 min-h-96 scrollbar-thin overflow-y-auto transition-colors ${
          isOver ? 'bg-blue-50 border-blue-400 border-2' : 'border-gray-200 bg-gray-50'
        }`}
        style={{ maxHeight: '500px' }}
      >
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <SortableWorkOrder
              key={order.id}
              order={order}
              onDragStart={onDragStart}
            />
          ))}
          {orders.length === 0 && (
            <div className={`text-center py-8 transition-colors ${isOver ? 'text-blue-500' : 'text-gray-400'}`}>
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">{isOver ? '拖放到此处分配工单' : '暂无待办任务'}</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function PendingColumn({ orders, onDragStart }) {
  return (
    <div className="flex-shrink-0 w-72">
      <div className="bg-white rounded-t-lg border border-gray-200 border-b-0 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
            📥
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">待分配</h3>
            <p className="text-xs text-gray-500">待分配工单池</p>
          </div>
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
            {orders.length} 个
          </span>
        </div>
      </div>
      <div className="bg-orange-50 border border-gray-200 rounded-b-lg p-3 min-h-96 scrollbar-thin overflow-y-auto" style={{ maxHeight: '500px' }}>
        <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <SortableWorkOrder
              key={order.id}
              order={order}
              onDragStart={onDragStart}
            />
          ))}
          {orders.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm">全部已分配</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function Schedule() {
  const [engineers, setEngineers] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState({});
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { hasRole, ROLES } = useAuth();
  const isManager = hasRole(ROLES.STATION_MANAGER);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [engineersRes, ordersRes] = await Promise.all([
        api.auth.getEngineers(),
        api.workOrders.list({ status: 'pending,in_progress' }),
      ]);

      setEngineers(engineersRes);
      
      const pending = ordersRes.filter(o => o.status === 'pending');
      const assigned = ordersRes.filter(o => o.status === 'in_progress');
      
      setPendingOrders(pending);
      
      const assignedMap = {};
      engineersRes.forEach(eng => {
        assignedMap[eng.id] = assigned.filter(o => o.assigneeId == eng.id);
      });
      setAssignedOrders(assignedMap);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (order) => {
    setActiveOrder(order);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over || !isManager) return;

    const activeId = active.id;
    const overId = over.id;

    let movedOrder = null;
    let sourceColumn = null;

    if (pendingOrders.find(o => o.id === activeId)) {
      movedOrder = pendingOrders.find(o => o.id === activeId);
      sourceColumn = 'pending';
    } else {
      for (const engId of Object.keys(assignedOrders)) {
        if (assignedOrders[engId].find(o => o.id === activeId)) {
          movedOrder = assignedOrders[engId].find(o => o.id === activeId);
          sourceColumn = engId;
          break;
        }
      }
    }

    if (!movedOrder) return;

    let targetEngineer = null;
    
    for (const eng of engineers) {
      if (eng.id == overId || assignedOrders[eng.id]?.some(o => o.id === overId)) {
        targetEngineer = eng;
        break;
      }
    }

    if (targetEngineer && sourceColumn != targetEngineer.id) {
      try {
        await api.workOrders.assign(activeId, targetEngineer.id);
        
        if (sourceColumn === 'pending') {
          setPendingOrders(prev => prev.filter(o => o.id !== activeId));
        } else {
          setAssignedOrders(prev => ({
            ...prev,
            [sourceColumn]: prev[sourceColumn]?.filter(o => o.id !== activeId) || [],
          }));
        }

        setAssignedOrders(prev => ({
          ...prev,
          [targetEngineer.id]: [...(prev[targetEngineer.id] || []), { ...movedOrder, assignee: targetEngineer.name, assigneeId: targetEngineer.id, status: 'in_progress', statusName: '处理中' }],
        }));
      } catch (error) {
        console.error('分配失败:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">排班看板</h2>
          <p className="text-sm text-gray-500">拖拽工单向工程师分配任务</p>
        </div>
        {!isManager && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm">
            ⚠️ 当前为只读模式，只有站长可以分配工单
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <PendingColumn orders={pendingOrders} onDragStart={handleDragStart} />
          
          {engineers.map(engineer => (
            <EngineerColumn
              key={engineer.id}
              engineer={engineer}
              orders={assignedOrders[engineer.id] || []}
              onDragStart={handleDragStart}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-xl opacity-90 w-72">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-mono text-gray-400">{activeOrder.id}</span>
              </div>
              <h4 className="font-medium text-gray-800 text-sm">{activeOrder.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{activeOrder.location}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-800 mb-3">💡 使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• <strong>站长</strong>可以将「待分配」列中的工单拖拽到对应工程师列中进行分配</li>
          <li>• 每个工程师卡片显示其技能标签，可根据技能匹配工单类型</li>
          <li>• 工程师登录后只能查看自己负责的工单列表</li>
          <li>• 点击工单卡片可以查看详情、添加备注和上传证据</li>
        </ul>
      </div>
    </div>
  );
}

export default withAuth(Schedule);
