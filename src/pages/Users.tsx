import { useState } from 'react'
import { Search, Phone } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { getRoleName } from '../utils'

export default function Users() {
  const { users, deliveries, bucketReturns, complaints } = useApp()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = users.filter(u =>
    u.name.includes(searchTerm) || u.phone.includes(searchTerm)
  )

  const getUserStats = (userId: string) => {
    const userDeliveries = deliveries.filter(d => d.driverId === userId)
    const userReturns = bucketReturns.filter(br => br.driverId === userId)
    const assignedComplaints = complaints.filter(c => c.assignedTo === userId)

    return {
      totalDeliveries: userDeliveries.length,
      completedDeliveries: userDeliveries.filter(d => d.status === 'completed').length,
      totalBuckets: userReturns.reduce((sum, br) => sum + br.actualQuantity, 0),
      disputedReturns: userReturns.filter(br => br.status === 'disputed').length,
      pendingComplaints: assignedComplaints.filter(c => c.status === 'pending' || c.status === 'processing').length,
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'station_master': return 'bg-purple-100 text-purple-700'
      case 'driver': return 'bg-blue-100 text-blue-700'
      case 'customer_service': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索人员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => {
          const stats = getUserStats(user.id)
          return (
            <div key={user.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <span className={`badge ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
                <Phone className="w-4 h-4" />
                <span>{user.phone}</span>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">工作统计</h4>

                {user.role === 'driver' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">总配送</p>
                      <p className="text-xl font-bold text-gray-800">{stats.totalDeliveries}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">已完成</p>
                      <p className="text-xl font-bold text-green-600">{stats.completedDeliveries}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">回收桶</p>
                      <p className="text-xl font-bold text-blue-600">{stats.totalBuckets}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">争议单</p>
                      <p className="text-xl font-bold text-red-600">{stats.disputedReturns}</p>
                    </div>
                  </div>
                )}

                {user.role === 'customer_service' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">处理投诉</p>
                      <p className="text-xl font-bold text-gray-800">{stats.pendingComplaints}</p>
                    </div>
                  </div>
                )}

                {user.role === 'station_master' && (
                  <p className="text-sm text-gray-500">
                    负责全站运营管理
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
