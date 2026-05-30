"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Clock,
  Search,
  FileText,
  AlertCircle,
  Settings,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/borrow", label: "借用管理", icon: Package },
  { href: "/return", label: "归还验收", icon: Clock },
  { href: "/trace", label: "连续回查", icon: Search },
  { href: "/records", label: "历史记录", icon: FileText },
  { href: "/cases", label: "投诉回查", icon: AlertCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <nav className="p-4 mt-4 lg:mt-0">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-green-100 text-green-700"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};
