"use client";

import { useAppStore } from "@/lib/store";
import type { ScheduleItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Check, ChevronLeft, ChevronRight, Clock, GripVertical, Plus, User, X } from "lucide-react";
import { useState } from "react";

const timeSlots = [
  "08:00-12:00",
  "09:00-12:00",
  "10:00-14:00",
  "13:00-17:00",
  "14:00-17:00",
  "15:00-19:00",
];

interface SortableScheduleItemProps {
  item: ScheduleItem;
  onClick?: () => void;
}

function SortableScheduleItem({ item, onClick }: SortableScheduleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stations = useAppStore((state) => state.stations);
  const users = useAppStore((state) => state.users);
  const workOrders = useAppStore((state) => state.workOrders);

  const station = stations.find((s) => s.id === item.stationId);
  const inspector = users.find((u) => u.id === item.inspectorId);
  const relatedWorkOrders = workOrders.filter((wo) =>
    item.workOrderIds.includes(wo.id)
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-3 mb-2 cursor-grab active:cursor-grabbing transition-shadow",
        isDragging && "opacity-50 shadow-lg z-50",
        item.status === "in_progress" && "border-orange-300 bg-orange-50",
        item.status === "completed" && "border-green-300 bg-green-50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-gray-800 truncate">
              {station?.name || "未知站点"}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                item.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : item.status === "in_progress"
                  ? "bg-orange-100 text-orange-800"
                  : item.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              )}
            >
              {{
                pending: "待执行",
                in_progress: "进行中",
                completed: "已完成",
                skipped: "已跳过",
              }[item.status]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Clock className="w-3 h-3" />
            {item.timeSlot}
          </div>
          {inspector && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <User className="w-3 h-3" />
              {inspector.name}
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            {item.tasks.map((task, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
              >
                {task}
              </span>
            ))}
          </div>
          {relatedWorkOrders.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">关联工单：</p>
              <div className="space-y-1">
                {relatedWorkOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded truncate"
                  >
                    {wo.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SchedulePanel() {
  const [currentDate, setCurrentDate] = useState("2024-01-17");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddWorkOrderModal, setShowAddWorkOrderModal] = useState(false);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>([]);

  const scheduleItems = useAppStore((state) => state.scheduleItems);
  const updateScheduleItem = useAppStore((state) => state.updateScheduleItem);
  const addScheduleItem = useAppStore((state) => state.addScheduleItem);
  const users = useAppStore((state) => state.users);
  const stations = useAppStore((state) => state.stations);
  const workOrders = useAppStore((state) => state.workOrders);

  const inspectors = users.filter((u) => u.role === "inspector");

  const scheduledWorkOrderIds = scheduleItems
    .filter((item) => item.date === currentDate)
    .flatMap((item) => item.workOrderIds);

  const availableWorkOrders = workOrders.filter((wo) => {
    if (scheduledWorkOrderIds.includes(wo.id)) return false;
    if (wo.status === "completed" || wo.status === "rejected") return false;
    if (wo.status === "processing" || wo.status === "reviewing" || wo.status === "escalated") return false;
    return true;
  });

  const handleOpenAddModal = (inspectorId: string) => {
    setSelectedInspectorId(inspectorId);
    setSelectedWorkOrderIds([]);
    setShowAddWorkOrderModal(true);
  };

  const handleAddToSchedule = () => {
    if (!selectedInspectorId || selectedWorkOrderIds.length === 0) return;

    const store = useAppStore.getState();
    const currentUser = store.currentUser;

    const newTasks = selectedWorkOrderIds.map((id) => {
      const wo = workOrders.find((w) => w.id === id);
      return wo?.type === "repair"
        ? "设备维修"
        : wo?.type === "restock"
        ? "耗材补货"
        : wo?.type === "inspection"
        ? "例行巡检"
        : "投诉处理";
    });
    const uniqueTasks = [...new Set(newTasks)];

    const firstWorkOrder = workOrders.find((wo) => wo.id === selectedWorkOrderIds[0]);

    const existingEmptyItem = scheduleItems.find(
      (item) =>
        item.inspectorId === selectedInspectorId &&
        item.date === currentDate &&
        item.workOrderIds.length === 0
    );

    if (existingEmptyItem) {
      updateScheduleItem(existingEmptyItem.id, {
        stationId: firstWorkOrder?.stationId || existingEmptyItem.stationId,
        workOrderIds: [...existingEmptyItem.workOrderIds, ...selectedWorkOrderIds],
        tasks: uniqueTasks,
      });
    } else {
      const existingWithOrders = scheduleItems.find(
        (item) =>
          item.inspectorId === selectedInspectorId &&
          item.date === currentDate &&
          item.workOrderIds.length > 0
      );

      if (existingWithOrders) {
        updateScheduleItem(existingWithOrders.id, {
          workOrderIds: [...existingWithOrders.workOrderIds, ...selectedWorkOrderIds],
          tasks: [...new Set([...existingWithOrders.tasks, ...newTasks])],
        });
      } else {
        addScheduleItem({
          inspectorId: selectedInspectorId,
          stationId: firstWorkOrder?.stationId || stations[0].id,
          date: currentDate,
          timeSlot: "09:00-12:00",
          tasks: uniqueTasks,
          status: "pending",
          workOrderIds: selectedWorkOrderIds,
        });
      }
    }

    selectedWorkOrderIds.forEach((workOrderId) => {
      const wo = store.workOrders.find((w) => w.id === workOrderId);
      if (!wo) return;

      if (wo.status === "pending") {
        store.assignWorkOrder(workOrderId, selectedInspectorId!, currentUser.id);
      } else if (wo.assigneeId !== selectedInspectorId) {
        const historyItem = {
          status: wo.status,
          operatorId: currentUser.id,
          timestamp: new Date().toISOString(),
          remark: `处理人已调整为${store.users.find((u) => u.id === selectedInspectorId)?.name || "未知"}`,
        };
        store.updateWorkOrder(workOrderId, {
          assigneeId: selectedInspectorId,
          history: [...wo.history, historyItem],
        });
      }
    });

    setShowAddWorkOrderModal(false);
    setSelectedInspectorId(null);
    setSelectedWorkOrderIds([]);
  };

  const toggleWorkOrderSelection = (workOrderId: string) => {
    setSelectedWorkOrderIds((prev) =>
      prev.includes(workOrderId)
        ? prev.filter((id) => id !== workOrderId)
        : [...prev, workOrderId]
    );
  };

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

  const items = scheduleItems.filter((item) => item.date === currentDate);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        reordered.forEach((item, index) => {
          const timeSlotIndex = Math.min(index, timeSlots.length - 1);
          updateScheduleItem(item.id, {
            timeSlot: timeSlots[timeSlotIndex],
          });
        });
      }
    }
  };

  const activeItem = activeId
    ? scheduleItems.find((item) => item.id === activeId)
    : null;

  const handleDateChange = (delta: number) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + delta);
    setCurrentDate(date.toISOString().split("T")[0]);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">排班调度</h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" />
            新增排班
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-1.5 hover:bg-white rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-800">{currentDate}</span>
            </div>
            <button
              onClick={() => handleDateChange(1)}
              className="p-1.5 hover:bg-white rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>共 {items.length} 个排班</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inspectors.map((inspector) => {
                const inspectorItems = items.filter(
                  (item) => item.inspectorId === inspector.id
                );
                return (
                  <div
                    key={inspector.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={inspector.avatar}
                        alt={inspector.name}
                        className="w-10 h-10 rounded-full bg-gray-200"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{inspector.name}</p>
                        <p className="text-xs text-gray-500">
                          {inspectorItems.length} 个任务
                        </p>
                      </div>
                    </div>

                    <SortableContext
                      items={inspectorItems.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {inspectorItems.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 text-center text-gray-400 text-sm">
                          暂无排班，拖拽调整或新增
                        </div>
                      ) : (
                        inspectorItems.map((item) => (
                          <SortableScheduleItem key={item.id} item={item} />
                        ))
                      )}
                    </SortableContext>

                    <button
                      onClick={() => handleOpenAddModal(inspector.id)}
                      className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
                    >
                      + 添加工单到此排班
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </DndContext>

        <div className="w-72 border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <h3 className="font-medium text-gray-800 mb-3">待分配工单</h3>
          <p className="text-xs text-gray-500 mb-4">
            点击"添加工单到此排班"按钮选择工单
          </p>

          {availableWorkOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无待分配工单
            </div>
          ) : (
            <div className="space-y-3">
              {availableWorkOrders.map((wo) => {
                const station = stations.find((s) => s.id === wo.stationId);
                return (
                  <div
                    key={wo.id}
                    className={cn(
                      "rounded-lg p-3 border",
                      wo.type === "repair"
                        ? "bg-red-50 border-red-200"
                        : wo.type === "restock"
                        ? "bg-green-50 border-green-200"
                        : wo.type === "inspection"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-purple-50 border-purple-200"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium mb-1",
                        wo.type === "repair"
                          ? "text-red-800"
                          : wo.type === "restock"
                          ? "text-green-800"
                          : wo.type === "inspection"
                          ? "text-blue-800"
                          : "text-purple-800"
                      )}
                    >
                      {wo.title}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        wo.type === "repair"
                          ? "text-red-600"
                          : wo.type === "restock"
                          ? "text-green-600"
                          : wo.type === "inspection"
                          ? "text-blue-600"
                          : "text-purple-600"
                      )}
                    >
                      {station?.name} ·{" "}
                      {{ low: "低", medium: "中", high: "高", urgent: "紧急" }[wo.priority]}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">使用说明</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 拖拽排班卡片可调整顺序</li>
              <li>• 松开后自动更新时间段</li>
              <li>• 点击"添加工单到此排班"选择工单</li>
              <li>• 已分配的工单会从列表移除</li>
            </ul>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="bg-white rounded-lg border-2 border-primary-500 p-3 shadow-xl opacity-90 w-80">
            <p className="font-medium text-sm text-gray-800">
              {stations.find((s) => s.id === activeItem.stationId)?.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">{activeItem.timeSlot}</p>
          </div>
        ) : null}
      </DragOverlay>

      {showAddWorkOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">选择要添加的工单</h3>
              <button
                onClick={() => {
                  setShowAddWorkOrderModal(false);
                  setSelectedInspectorId(null);
                  setSelectedWorkOrderIds([]);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {availableWorkOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  没有可分配的工单
                </div>
              ) : (
                availableWorkOrders.map((wo) => {
                  const station = stations.find((s) => s.id === wo.stationId);
                  const isSelected = selectedWorkOrderIds.includes(wo.id);
                  return (
                    <div
                      key={wo.id}
                      onClick={() => toggleWorkOrderSelection(wo.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        isSelected
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 flex-shrink-0",
                            isSelected
                              ? "bg-primary-500 border-primary-500"
                              : "border-gray-300"
                          )}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{wo.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {station?.name} ·{" "}
                            {{
                              low: "低",
                              medium: "中",
                              high: "高",
                              urgent: "紧急",
                            }[wo.priority]}
                            ·{" "}
                            {{
                              repair: "设备维修",
                              restock: "耗材补货",
                              inspection: "例行巡检",
                              complaint: "投诉退款",
                            }[wo.type]}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                已选择 {selectedWorkOrderIds.length} 个工单
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddWorkOrderModal(false);
                    setSelectedInspectorId(null);
                    setSelectedWorkOrderIds([]);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddToSchedule}
                  disabled={selectedWorkOrderIds.length === 0}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  确认添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
