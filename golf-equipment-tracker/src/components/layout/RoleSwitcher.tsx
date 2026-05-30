"use client";

import React, { useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { getRoleLabel } from "@/lib/mockData";
import type { UserRole } from "@/types";

export const RoleSwitcher: React.FC = () => {
  const { currentUser, switchRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { value: UserRole; label: string }[] = [
    { value: "reception", label: "前台" },
    { value: "coach", label: "教练" },
    { value: "manager", label: "经理" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
          <p className="text-xs text-gray-500">{getRoleLabel(currentUser.role)}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500">切换角色</p>
            </div>
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => {
                  switchRole(role.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  currentUser.role === role.value
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700"
                }`}
              >
                <span>{role.label}</span>
                {currentUser.role === role.value && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
