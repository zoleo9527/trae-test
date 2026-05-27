"use client";

import { useAppStore } from "@/lib/store";
import { cn, roleConfig } from "@/lib/utils";
import { CalendarDays, ClipboardList, LayoutDashboard, Package, RefundCog, Settings } from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "运营总览", icon: LayoutDashboard },
  { id: "workorders", label: "工单管理", icon: ClipboardList },
  { id: "materials", label: "耗材盘点", icon: Package },
  { id: "schedule", label: "排班调度", icon: CalendarDays },
  { id: "refunds", label: "退款申诉", icon: RefundCog },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const switchRole = useAppStore((state) => state.switchRole);
  const users = useAppStore((state) => state.users);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">自助洗车运营系统</h1>
        <p className="text-xs text-gray-500 mt-1">设备补货与耗材盘点</p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full bg-gray-100"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{currentUser.name}</p>
            <span
              className={cn(
                "inline-block text-xs px-2 py-0.5 rounded-full",
                roleConfig[currentUser.role].className
              )}
            >
              {roleConfig[currentUser.role].label}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">切换角色演示：</p>
          <div className="flex gap-1 flex-wrap">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => switchRole(user.role)}
                className={cn(
                  "text-xs px-2 py-1 rounded transition-colors",
                  currentUser.id === user.id
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {roleConfig[user.role].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    activeTab === item.id
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
          系统设置
        </button>
      </div>
    </div>
  );
}
