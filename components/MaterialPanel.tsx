"use client";

import { useAppStore } from "@/lib/store";
import { cn, formatDate, stationStatusConfig } from "@/lib/utils";
import { AlertTriangle, Package, Plus, Search } from "lucide-react";
import { useState } from "react";

export function MaterialPanel() {
  const [selectedStationId, setSelectedStationId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<{
    stationId: string;
    materialId: string;
  } | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockRemark, setRestockRemark] = useState("");

  const materials = useAppStore((state) => state.materials);
  const stationMaterials = useAppStore((state) => state.stationMaterials);
  const stations = useAppStore((state) => state.stations);
  const currentUser = useAppStore((state) => state.currentUser);
  const addWorkOrder = useAppStore((state) => state.addWorkOrder);
  const addHistoryRemark = useAppStore((state) => state.addHistoryRemark);

  const view = selectedStationId === "all" ? "overview" : "detail";

  const getMaterialStatus = (sm: typeof stationMaterials[0]) => {
    const mat = materials.find((m) => m.id === sm.materialId);
    if (!mat) return "normal";
    if (sm.currentStock === 0) return "out_of_stock";
    if (sm.currentStock < mat.minStock) return "low";
    return "normal";
  };

  const filteredStationMaterials = stationMaterials.filter((sm) => {
    const mat = materials.find((m) => m.id === sm.materialId);
    if (!mat) return false;

    if (selectedStationId !== "all" && sm.stationId !== selectedStationId) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !mat.name.toLowerCase().includes(query) &&
        !mat.sku.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    if (stockFilter !== "all") {
      const status = getMaterialStatus(sm);
      if (status !== stockFilter) return false;
    }

    return true;
  });

  const handleOpenRestockModal = (stationId: string, materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      setRestockQuantity(String(mat.minStock * 2));
    }
    setSelectedMaterial({ stationId, materialId });
    setShowRestockModal(true);
  };

  const handleSubmitRestock = () => {
    if (!selectedMaterial || !restockQuantity) return;

    const mat = materials.find((m) => m.id === selectedMaterial.materialId);
    const station = stations.find((s) => s.id === selectedMaterial.stationId);
    if (!mat || !station) return;

    const newWorkOrder = {
      type: "restock" as const,
      title: `${station.name} - ${mat.name}补货`,
      description: restockRemark || `库存不足，申请补货${restockQuantity}${mat.unit}`,
      stationId: selectedMaterial.stationId,
      materialId: selectedMaterial.materialId,
      priority: (getMaterialStatus({
        ...selectedMaterial,
        currentStock: stationMaterials.find(
          (sm) =>
            sm.stationId === selectedMaterial.stationId &&
            sm.materialId === selectedMaterial.materialId
        )?.currentStock || 0,
        lastRestock: "",
      }) === "out_of_stock"
        ? "urgent"
        : "medium") as "urgent" | "medium",
      status: "pending" as const,
      creatorId: currentUser.id,
      attachments: [],
    };

    addWorkOrder(newWorkOrder);

    setShowRestockModal(false);
    setSelectedMaterial(null);
    setRestockQuantity("");
    setRestockRemark("");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">耗材盘点</h2>
          <button className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors">
            <Plus className="w-4 h-4" />
            补货申请
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全站点总览</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索耗材..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">全部状态</option>
            <option value="normal">库存正常</option>
            <option value="low">库存偏低</option>
            <option value="out_of_stock">缺货</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {view === "overview" ? (
          <div className="space-y-6">
            {stations.map((station) => {
              const stationMats = filteredStationMaterials.filter(
                (sm) => sm.stationId === station.id
              );
              if (stationMats.length === 0 && (searchQuery || stockFilter !== "all")) {
                return null;
              }
              const allStationMats = stationMaterials.filter(
                (sm) => sm.stationId === station.id
              );
              const lowStockCount = allStationMats.filter((sm) => {
                const mat = materials.find((m) => m.id === sm.materialId);
                return mat && sm.currentStock < mat.minStock;
              }).length;
              const outOfStockCount = allStationMats.filter(
                (sm) => sm.currentStock === 0
              ).length;

              return (
                <div
                  key={station.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{station.name}</h3>
                        <p className="text-sm text-gray-500">{station.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {outOfStockCount > 0 && (
                          <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            缺货 {outOfStockCount}
                          </span>
                        )}
                        {lowStockCount > 0 && (
                          <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            偏低 {lowStockCount}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            stationStatusConfig[station.status].className
                          )}
                        >
                          {stationStatusConfig[station.status].label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {(stationMats.length > 0 ? stationMats : allStationMats).map((sm) => {
                      const mat = materials.find((m) => m.id === sm.materialId);
                      if (!mat) return null;
                      const ratio = (sm.currentStock / mat.minStock) * 100;
                      const isLow = sm.currentStock < mat.minStock;
                      const isOut = sm.currentStock === 0;

                      return (
                        <div key={sm.materialId} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-800">{mat.name}</p>
                              <p className="text-xs text-gray-500">SKU: {mat.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">
                                {sm.currentStock}
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                  {mat.unit}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500">
                                最低 {mat.minStock} {mat.unit}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isOut
                                    ? "bg-red-500"
                                    : isLow
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                )}
                                style={{ width: `${Math.min(100, ratio)}%` }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full whitespace-nowrap",
                                isOut
                                  ? "bg-red-100 text-red-800"
                                  : isLow
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              )}
                            >
                              {isOut ? "缺货" : isLow ? "库存低" : "正常"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              上次补货：{formatDate(sm.lastRestock)}
                            </p>
                            <button
                              onClick={() => handleOpenRestockModal(station.id, mat.id)}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            >
                              申请补货
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-800">
                {stations.find((s) => s.id === selectedStationId)?.name} - 耗材详情
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      耗材名称
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      当前库存
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      安全库存
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      上次补货
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStationMaterials
                    .filter((sm) => sm.stationId === selectedStationId)
                    .map((sm) => {
                      const mat = materials.find((m) => m.id === sm.materialId);
                      if (!mat) return null;
                      const isLow = sm.currentStock < mat.minStock;
                      const isOut = sm.currentStock === 0;

                      return (
                        <tr key={sm.materialId} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-800">
                                {mat.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {mat.sku}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "font-semibold",
                                isOut
                                  ? "text-red-600"
                                  : isLow
                                  ? "text-yellow-600"
                                  : "text-gray-800"
                              )}
                            >
                              {sm.currentStock} {mat.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {mat.minStock} {mat.unit}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                isOut
                                  ? "bg-red-100 text-red-800"
                                  : isLow
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              )}
                            >
                              {isOut ? "缺货" : isLow ? "库存低" : "正常"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(sm.lastRestock)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleOpenRestockModal(selectedStationId, mat.id)}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              申请补货
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showRestockModal && selectedMaterial && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">补货申请</h3>
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">站点</p>
                  <p className="font-medium">
                    {stations.find((s) => s.id === selectedMaterial.stationId)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">耗材</p>
                  <p className="font-medium">
                    {materials.find((m) => m.id === selectedMaterial.materialId)?.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    补货数量
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入补货数量"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注说明（选填）
                  </label>
                  <textarea
                    value={restockRemark}
                    onChange={(e) => setRestockRemark(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="请输入备注说明..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRestockModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRestock}
                  disabled={!restockQuantity}
                  className="flex-1 py-2 px-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  提交申请
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
