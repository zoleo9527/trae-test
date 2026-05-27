import { useEffect, useState } from 'react'
import { MapPin, AlertTriangle, Wrench, Droplets, ChevronRight, CheckCircle } from 'lucide-react'
import { useSiteStore } from '@/store/useSiteStore'
import type { Site } from '@/types'

function SitePage() {
  const { sites, fetchSites, devices, fetchDevices } = useSiteStore()
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)

  useEffect(() => {
    fetchSites()
  }, [fetchSites])

  useEffect(() => {
    if (selectedSite) {
      fetchDevices(selectedSite.id)
    }
  }, [selectedSite, fetchDevices])

  const siteDevices = selectedSite
    ? devices.filter((d) => d.siteId === selectedSite.id)
    : []

  const getStatusColor = (status: Site['status']) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500'
      case 'warning':
        return 'bg-amber-500'
      case 'error':
        return 'bg-red-500'
    }
  }

  const getStatusText = (status: Site['status']) => {
    switch (status) {
      case 'normal':
        return '正常'
      case 'warning':
        return '预警'
      case 'error':
        return '异常'
    }
  }

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-700'
      case 'warning':
        return 'bg-amber-100 text-amber-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      case 'maintenance':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getDeviceStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '正常'
      case 'warning':
        return '预警'
      case 'error':
        return '故障'
      case 'maintenance':
        return '维护'
      default:
        return '未知'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">站点管理</h1>
        <p className="text-slate-500 mt-1">查看和管理所有站点、设备和耗材</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">站点列表</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {sites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => setSelectedSite(site)}
                  className={`px-5 py-4 cursor-pointer transition-colors ${
                    selectedSite?.id === site.id
                      ? 'bg-indigo-50 border-l-4 border-indigo-500'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 mr-3 flex-shrink-0 ${getStatusColor(
                          site.status
                        )}`}
                      />
                      <div>
                        <h3 className="font-medium text-slate-900">{site.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{site.address}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span>{site.deviceCount} 台设备</span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        site.status === 'normal'
                          ? 'bg-green-100 text-green-700'
                          : site.status === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {getStatusText(site.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          {selectedSite ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={selectedSite.image}
                    alt={selectedSite.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h2 className="text-xl font-bold">{selectedSite.name}</h2>
                    <p className="text-sm text-white/80 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {selectedSite.address}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                      <Wrench className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">{siteDevices.length}</p>
                      <p className="text-xs text-slate-500">设备总数</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">
                        {siteDevices.filter((d) => d.status === 'normal').length}
                      </p>
                      <p className="text-xs text-slate-500">正常运行</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 text-center">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">
                        {siteDevices.filter((d) => d.status === 'warning').length}
                      </p>
                      <p className="text-xs text-slate-500">需要关注</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">
                        {siteDevices.filter((d) => d.status === 'error').length}
                      </p>
                      <p className="text-xs text-slate-500">故障设备</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">设备列表</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {siteDevices.map((device) => (
                    <div key={device.id} className="px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                              device.status === 'normal'
                                ? 'bg-green-100'
                                : device.status === 'warning'
                                ? 'bg-amber-100'
                                : device.status === 'error'
                                ? 'bg-red-100'
                                : 'bg-slate-100'
                            }`}
                          >
                            <Wrench
                              className={`w-5 h-5 ${
                                device.status === 'normal'
                                  ? 'text-green-600'
                                  : device.status === 'warning'
                                  ? 'text-amber-600'
                                  : device.status === 'error'
                                  ? 'text-red-600'
                                  : 'text-slate-600'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{device.name}</p>
                            <p className="text-xs text-slate-500">
                              上次维护：{device.lastMaintenance}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDeviceStatusColor(
                            device.status
                          )}`}
                        >
                          {getDeviceStatusText(device.status)}
                        </span>
                      </div>
                      {device.consumables.length > 0 && (
                        <div className="mt-3 pl-14 space-y-2">
                          {device.consumables.map((consumable) => (
                            <div
                              key={consumable.id}
                              className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center">
                                <Droplets className="w-4 h-4 text-slate-400 mr-2" />
                                <span className="text-sm text-slate-700">
                                  {consumable.name}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span
                                  className={`text-sm font-medium ${
                                    consumable.stock < consumable.threshold
                                      ? 'text-red-600'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {consumable.stock} {consumable.unit}
                                </span>
                                <span className="text-xs text-slate-400 ml-2">
                                  / {consumable.threshold}
                                </span>
                                {consumable.stock < consumable.threshold && (
                                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                    不足
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>请选择一个站点查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SitePage
