"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Calendar,
  Package,
  Flag,
  Wallet,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  mockBorrowRecords,
  mockBookings,
  mockStoredValueRecords,
  mockReturnInspections,
  getCategoryLabel,
} from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";

interface TraceResult {
  memberId: string;
  memberName: string;
  borrowRecords: any[];
  bookings: any[];
  storedValueRecords: any[];
}

export default function TracePage() {
  const router = useRouter();
  const { isLoading, setIsLoading, error, setError } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "borrow" | "booking" | "stored">("all");

  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    setIsLoading(true);

    setTimeout(() => {
      const term = searchTerm.toLowerCase();

      const matchedBorrows = mockBorrowRecords.filter(
        (r) =>
          r.borrowerName.toLowerCase().includes(term) ||
          r.memberName?.toLowerCase().includes(term) ||
          r.borrowerPhone?.includes(term) ||
          r.id.toLowerCase().includes(term)
      );

      const matchedBookings = mockBookings.filter(
        (b) =>
          b.memberName.toLowerCase().includes(term) ||
          b.memberPhone.includes(term) ||
          b.id.toLowerCase().includes(term)
      );

      const matchedStoredValues = mockStoredValueRecords.filter(
        (sv) =>
          sv.memberName.toLowerCase().includes(term) ||
          sv.id.toLowerCase().includes(term)
      );

      const memberIds = new Set([
        ...matchedBorrows.map((r) => r.memberId),
        ...matchedBookings.map((b) => b.memberId),
        ...matchedStoredValues.map((sv) => sv.memberId),
      ]);

      const memberNames = new Set([
        ...matchedBorrows.map((r) => r.borrowerName),
        ...matchedBookings.map((b) => b.memberName),
        ...matchedStoredValues.map((sv) => sv.memberName),
      ]);

      if (matchedBorrows.length > 0 || matchedBookings.length > 0 || matchedStoredValues.length > 0) {
        setTraceResult({
          memberId: Array.from(memberIds)[0] || "",
          memberName: Array.from(memberNames)[0] || "",
          borrowRecords: matchedBorrows,
          bookings: matchedBookings,
          storedValueRecords: matchedStoredValues,
        });
      } else {
        setTraceResult(null);
      }

      setSearching(false);
      setIsLoading(false);
    }, 800);
  };

  const getAllEvents = () => {
    if (!traceResult) return [];

    const events = [
      ...traceResult.borrowRecords.map((r) => ({
        id: r.id,
        type: "borrow",
        date: r.borrowDate,
        data: r,
      })),
      ...traceResult.bookings.map((b) => ({
        id: b.id,
        type: "booking",
        date: `${b.date} ${b.startTime}`,
        data: b,
      })),
      ...traceResult.storedValueRecords.map((sv) => ({
        id: sv.id,
        type: "stored",
        date: sv.createdAt,
        data: sv,
      })),
    ];

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getFilteredEvents = () => {
    const allEvents = getAllEvents();
    if (activeTab === "all") return allEvents;
    return allEvents.filter((e) => e.type === activeTab);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "borrow":
        return <Package className="w-4 h-4" />;
      case "booking":
        return <Flag className="w-4 h-4" />;
      case "stored":
        return <Wallet className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "borrow":
        return "bg-blue-100 text-blue-600";
      case "booking":
        return "bg-green-100 text-green-600";
      case "stored":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (isLoading && searching) {
    return <LoadingState message="正在搜索关联数据..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">连续回查</h1>
        <p className="text-sm text-gray-500 mt-1">
          按会员、手机号或单号追溯完整业务上下文
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="输入会员姓名、手机号或业务单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchTerm.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            搜索
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-gray-500">快速搜索：</span>
          {["陈会员", "赵先生", "孙女士"].map((name) => (
            <button
              key={name}
              onClick={() => {
                setSearchTerm(name);
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {traceResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {traceResult.memberName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      共找到 {getAllEvents().length} 条关联记录
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 mb-6">
                {[
                  { value: "all", label: "全部" },
                  { value: "borrow", label: "借用" },
                  { value: "booking", label: "预约" },
                  { value: "stored", label: "储值" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() =>
                      setActiveTab(tab.value as "all" | "borrow" | "booking" | "stored")
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.value
                        ? "bg-green-100 text-green-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {getFilteredEvents().length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {getFilteredEvents().map((event: any, index: number) => (
                      <div
                        key={event.id}
                        className="relative pl-10 cursor-pointer group"
                        onClick={() => setSelectedRecord(event)}
                      >
                        <div
                          className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(
                            event.type
                          )}`}
                        >
                          {getEventIcon(event.type)}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 group-hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {event.type === "borrow" &&
                                    event.data.equipmentName}
                                  {event.type === "booking" &&
                                    `球道预约 ${event.data.laneNumber}`}
                                  {event.type === "stored" &&
                                    (event.data.type === "deposit"
                                      ? "储值充值"
                                      : "储值消费")}
                                </span>
                                {event.type === "borrow" && (
                                  <StatusBadge status={event.data.status} />
                                )}
                                {event.type === "stored" && (
                                  <span
                                    className={`text-sm font-medium ${
                                      event.data.type === "deposit"
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {event.data.type === "deposit"
                                      ? `+¥${event.data.amount}`
                                      : `-¥${event.data.amount}`}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {event.type === "borrow" &&
                                  `${getCategoryLabel(event.data.equipmentCategory)} · ${
                                    event.data.borrowerName
                                  }`}
                                {event.type === "booking" &&
                                  `${event.data.date} ${event.data.startTime}-${event.data.endTime} · ${event.data.guests}人`}
                                {event.type === "stored" &&
                                  `余额: ¥${event.data.balanceAfter}`}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  type="no-results"
                  title="暂无此类记录"
                  description="尝试切换其他分类查看"
                />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">记录详情</h3>
              {selectedRecord ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(
                        selectedRecord.type
                      )}`}
                    >
                      {getEventIcon(selectedRecord.type)}
                    </div>
                    <span className="font-medium">
                      {selectedRecord.type === "borrow" && "器材借用"}
                      {selectedRecord.type === "booking" && "球道预约"}
                      {selectedRecord.type === "stored" && "储值变动"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedRecord.type === "borrow" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">器材</span>
                          <span className="font-medium">
                            {selectedRecord.data.equipmentName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">分类</span>
                          <span>
                            {getCategoryLabel(selectedRecord.data.equipmentCategory)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">借用日期</span>
                          <span>{selectedRecord.data.borrowDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">押金</span>
                          <span>¥{selectedRecord.data.depositAmount}</span>
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/borrow/${selectedRecord.data.id}`)
                          }
                          className="w-full mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          查看完整记录
                        </button>
                      </>
                    )}

                    {selectedRecord.type === "booking" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">球道</span>
                          <span className="font-medium">
                            {selectedRecord.data.laneNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">日期</span>
                          <span>{selectedRecord.data.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">时间</span>
                          <span>
                            {selectedRecord.data.startTime} -{" "}
                            {selectedRecord.data.endTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">人数</span>
                          <span>{selectedRecord.data.guests}人</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">金额</span>
                          <span>¥{selectedRecord.data.totalAmount}</span>
                        </div>
                      </>
                    )}

                    {selectedRecord.type === "stored" && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">类型</span>
                          <span className="font-medium">
                            {selectedRecord.data.type === "deposit"
                              ? "充值"
                              : selectedRecord.data.type === "consume"
                              ? "消费"
                              : "退款"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">金额</span>
                          <span
                            className={
                              selectedRecord.data.type === "deposit"
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {selectedRecord.data.type === "deposit"
                              ? "+"
                              : "-"}
                            ¥{selectedRecord.data.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">变动前</span>
                          <span>¥{selectedRecord.data.balanceBefore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">变动后</span>
                          <span>¥{selectedRecord.data.balanceAfter}</span>
                        </div>
                        {selectedRecord.data.relatedNote && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                              关联: {selectedRecord.data.relatedNote}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>点击左侧记录查看详情</p>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
              <h4 className="font-semibold text-gray-900 mb-2">回查提示</h4>
              <p className="text-sm text-gray-600">
                同一客户的所有业务数据已关联展示，便于完整追溯消费历史、器材使用和争议处理上下文。
              </p>
            </div>
          </div>
        </div>
      ) : searchTerm && !searching ? (
        <EmptyState
          type="no-results"
          title="未找到关联数据"
          description="请尝试使用其他关键词搜索"
        />
      ) : (
        <EmptyState
          type="no-data"
          title="输入关键词开始回查"
          description="支持按会员姓名、手机号、借用单号、预约单号等搜索"
        />
      )}
    </div>
  );
}
