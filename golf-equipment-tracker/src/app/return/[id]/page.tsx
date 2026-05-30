"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Camera,
  DollarSign,
  User,
  Clock,
  Package,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getCategoryLabel } from "@/lib/mockData";
import { useApp } from "@/lib/context/AppContext";
import type { ReviewResult, ReturnInspection } from "@/types";

export default function ReturnInspectionPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoading, setIsLoading, currentUser, canProcessReturns, error, setError, borrowRecords, returnInspections, updateBorrowStatus, addReturnInspection } = useApp();
  const [step, setStep] = useState<"check" | "result">("check");
  const [overallCondition, setOverallCondition] = useState<
    "excellent" | "good" | "fair" | "poor"
  >("good");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [customIssue, setCustomIssue] = useState("");
  const [compensationAmount, setCompensationAmount] = useState("");
  const [compensationReason, setCompensationReason] = useState("");
  const [notes, setNotes] = useState("");
  const [depositReturned, setDepositReturned] = useState(true);

  const commonIssues = [
    "表面划痕",
    "凹痕损坏",
    "配件缺失",
    "功能异常",
    "清洁问题",
    "其他损坏",
  ];

  const record = borrowRecords.find((r) => r.id === params.id) || null;
  const existingInspection = record ? returnInspections.find(
    (ri) => ri.borrowRecordId === record.id
  ) : null;

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (existingInspection) {
        setStep("result");
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [existingInspection, setIsLoading]);

  const inspection = existingInspection;

  if (isLoading) {
    return <LoadingState message="加载验收信息..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">记录不存在</h2>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleSubmit = () => {
    const result: ReviewResult =
      selectedIssues.length === 0
        ? "accepted"
        : selectedIssues.includes("配件缺失")
        ? "missing_parts"
        : "damaged";

    const now = new Date().toISOString().slice(0, 16).replace("T", " ");

    const newInspection: ReturnInspection = {
      id: `ri_${Date.now()}`,
      borrowRecordId: record.id,
      inspectorId: currentUser.id,
      inspectorName: currentUser.name,
      inspectionDate: now,
      overallCondition,
      result,
      issuesFound: [...selectedIssues, customIssue].filter(Boolean),
      compensationAmount: compensationAmount ? parseFloat(compensationAmount) : undefined,
      compensationReason: compensationReason || undefined,
      notes,
      depositReturned,
      depositReturnAmount: depositReturned
        ? record.depositAmount - (parseFloat(compensationAmount) || 0)
        : 0,
      createdAt: new Date().toISOString(),
    };

    addReturnInspection(newInspection);

    const hasIssues = selectedIssues.length > 0 || customIssue.trim();
    updateBorrowStatus(record.id, {
      status: hasIssues ? "needs_review" : "returned",
      actualReturnDate: now,
    });

    setStep("result");
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  const currentInspection = inspection || (step === "result" ? {
    id: `ri_temp`,
    borrowRecordId: record.id,
    inspectorId: currentUser.id,
    inspectorName: currentUser.name,
    inspectionDate: new Date().toISOString().slice(0, 16).replace("T", " "),
    overallCondition,
    result: (selectedIssues.length === 0 ? "accepted" : selectedIssues.includes("配件缺失") ? "missing_parts" : "damaged") as ReviewResult,
    issuesFound: [...selectedIssues, customIssue].filter(Boolean),
    compensationAmount: compensationAmount ? parseFloat(compensationAmount) : undefined,
    compensationReason: compensationReason || undefined,
    notes,
    depositReturned,
    depositReturnAmount: depositReturned ? record.depositAmount - (parseFloat(compensationAmount) || 0) : 0,
    createdAt: new Date().toISOString(),
  } : null);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">归还验收</h1>
          <p className="text-sm text-gray-500">
            {record.equipmentName} · {record.id}
          </p>
        </div>
      </div>

      {step === "check" && !inspection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                整体状况评估
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { value: "excellent", label: "优秀", color: "green" },
                  { value: "good", label: "良好", color: "blue" },
                  { value: "fair", label: "一般", color: "yellow" },
                  { value: "poor", label: "较差", color: "red" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() =>
                      setOverallCondition(
                        item.value as "excellent" | "good" | "fair" | "poor"
                      )
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      overallCondition === item.value
                        ? item.color === "green"
                          ? "border-green-500 bg-green-50"
                          : item.color === "blue"
                          ? "border-blue-500 bg-blue-50"
                          : item.color === "yellow"
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-center">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                发现问题 (可选)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {commonIssues.map((issue) => (
                  <button
                    key={issue}
                    onClick={() => toggleIssue(issue)}
                    className={`p-3 rounded-lg border text-sm transition-all ${
                      selectedIssues.includes(issue)
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {issue}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="其他问题描述..."
                value={customIssue}
                onChange={(e) => setCustomIssue(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {selectedIssues.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  赔偿处理
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      赔偿金额 (元)
                    </label>
                    <input
                      type="number"
                      placeholder="请输入赔偿金额"
                      value={compensationAmount}
                      onChange={(e) => setCompensationAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      赔偿原因
                    </label>
                    <textarea
                      placeholder="请描述赔偿原因..."
                      value={compensationReason}
                      onChange={(e) => setCompensationReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="depositReturned"
                      checked={depositReturned}
                      onChange={(e) => setDepositReturned(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <label htmlFor="depositReturned" className="text-sm text-gray-700">
                      从押金中扣除赔偿后退还剩余部分
                    </label>
                  </div>
                  {depositReturned && compensationAmount && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">押金金额</span>
                        <span>¥{record.depositAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">赔偿金额</span>
                        <span className="text-red-600">
                          -¥{parseFloat(compensationAmount) || 0}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium mt-2 pt-2 border-t border-gray-200">
                        <span>应退还押金</span>
                        <span className="text-green-600">
                          ¥{record.depositAmount - (parseFloat(compensationAmount) || 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                验收备注
              </h3>
              <textarea
                placeholder="请输入验收备注信息..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                借用信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">器材</span>
                  <span className="font-medium">{record.equipmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">分类</span>
                  <span>{getCategoryLabel(record.equipmentCategory)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">借用人</span>
                  <span>{record.borrowerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">借用日期</span>
                  <span>{record.borrowDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">押金</span>
                  <span>¥{record.depositAmount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {canProcessReturns ? (
                <button
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check className="w-5 h-5 mr-2" />
                  完成验收
                </button>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">您没有权限进行验收操作</p>
                  <p className="text-xs text-gray-400 mt-1">请联系前台或经理处理</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "result" && currentInspection && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    验收完成
                  </h3>
                  <p className="text-green-700 mt-1">
                    {currentInspection.result === "accepted"
                      ? "器材完好，验收通过"
                      : currentInspection.result === "damaged"
                      ? "发现损坏，已记录赔偿"
                      : "配件缺失，需进一步处理"}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    借用记录状态已更新为: {record.status === "needs_review" ? "待回查" : "已归还"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                验收详情
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">验收人</p>
                    <p className="text-gray-900">{currentInspection.inspectorName}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">验收时间</p>
                    <p className="text-gray-900">{currentInspection.inspectionDate}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">整体状况</p>
                    <p className="text-gray-900">
                      {currentInspection.overallCondition === "excellent"
                        ? "优秀"
                        : currentInspection.overallCondition === "good"
                        ? "良好"
                        : currentInspection.overallCondition === "fair"
                        ? "一般"
                        : "较差"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">押金退还</p>
                    <p className="text-gray-900">
                      {currentInspection.depositReturned
                        ? `¥${currentInspection.depositReturnAmount}`
                        : "未退还"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {currentInspection.issuesFound.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    发现问题
                  </h3>
                </div>
                <ul className="space-y-2">
                  {currentInspection.issuesFound.map((issue: string, index: number) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3" />
                      {issue}
                    </li>
                  ))}
                </ul>
                {currentInspection.compensationAmount && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">
                      赔偿金额: ¥{currentInspection.compensationAmount}
                    </p>
                    {currentInspection.compensationReason && (
                      <p className="text-sm text-red-500 mt-1">
                        原因: {currentInspection.compensationReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentInspection.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  验收备注
                </h3>
                <p className="text-gray-600">{currentInspection.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                器材信息
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">器材名称</span>
                  <span className="font-medium">{record.equipmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">分类</span>
                  <span>{getCategoryLabel(record.equipmentCategory)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">借用人</span>
                  <span>{record.borrowerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">当前状态</span>
                  <StatusBadge status={record.status} />
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/return")}
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回列表
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
