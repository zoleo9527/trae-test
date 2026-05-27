"use client";

import { Dashboard } from "@/components/Dashboard";
import { MaterialPanel } from "@/components/MaterialPanel";
import { RefundPanel } from "@/components/RefundPanel";
import { SchedulePanel } from "@/components/SchedulePanel";
import { Sidebar } from "@/components/Sidebar";
import { WorkOrderPanel } from "@/components/WorkOrderPanel";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "workorders":
        return <WorkOrderPanel />;
      case "materials":
        return <MaterialPanel />;
      case "schedule":
        return <SchedulePanel />;
      case "refunds":
        return <RefundPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 h-screen overflow-hidden">{renderContent()}</main>
    </div>
  );
}
