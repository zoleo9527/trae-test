"use client";

import React from "react";
import { Flag, User, Menu, X } from "lucide-react";
import { RoleSwitcher } from "./RoleSwitcher";

interface HeaderProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isMenuOpen }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 mr-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                <Flag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">高尔夫练习场</h1>
                <p className="text-xs text-gray-500">器材借用与归还验收</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <RoleSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
};
