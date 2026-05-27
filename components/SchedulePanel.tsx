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
import { Calendar, ChevronLeft, ChevronRight, Clock, GripVertical, Plus, User } from "lucide-react";
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

  const scheduleItems = useAppStore((state) => state.scheduleItems);
  const updateScheduleItem = useAppStore((state) => state.updateScheduleItem);
  const users = useAppStore((state) => state.users);
  const stations = useAppStore((state) => state.stations);

  const inspectors = users.filter((u) => u.role === "inspector");

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

                    <button className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors">
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
            可拖拽左侧排班卡片调整时间段
          </p>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-1">3号吸尘器吸力不足</p>
              <p className="text-xs text-blue-600">朝阳路站 · 紧急</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">玻璃清洁剂缺货</p>
              <p className="text-xs text-yellow-600">朝阳路站 · 紧急</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-800 mb-1">纳米镀膜蜡库存预警</p>
              <p className="text-xs text-green-600">中关村站 · 中</p>
            </div>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">使用说明</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• 拖拽排班卡片可调整顺序</li>
              <li>• 松开后自动更新时间段</li>
              <li>• 点击卡片查看详情</li>
              <li>• 待分配工单可直接拖拽到排班</li>
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
    </div>
  );
}
