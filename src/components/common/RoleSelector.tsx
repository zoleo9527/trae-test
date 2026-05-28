import React, { useState } from 'react'
import { useRoleStore } from '../../store/roleStore'
import { Role, RoleLabels } from '../../types'
import { getRolePermissions } from '../../data/mockData'

const roleIcons: Record<Role, React.ReactNode> = {
  merchandiser: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  warehouse: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  finance: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  manager: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

export const RoleSelector: React.FC = () => {
  const { currentRole, setRole } = useRoleStore()
  const [isOpen, setIsOpen] = useState(false)

  const roles: Role[] = ['merchandiser', 'warehouse', 'finance', 'manager']
  const permissions = getRolePermissions(currentRole)

  const permissionSummary: Record<Role, string> = {
    merchandiser: '创建订单、录入回执',
    warehouse: '拆单发货、确认物流',
    finance: '审核退款、确认回款',
    manager: '全权限、数据汇总',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-dark-200 rounded-btn hover:bg-dark-50 transition-colors"
      >
        <span className="text-dark-500">{roleIcons[currentRole]}</span>
        <span className="font-medium text-dark-700">{RoleLabels[currentRole]}</span>
        <svg className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white border border-dark-200 rounded-lg shadow-lg z-50 animate-fade-in">
            <div className="px-4 py-3 border-b border-dark-100">
              <p className="text-sm font-medium text-dark-800">切换角色</p>
              <p className="text-xs text-dark-500 mt-0.5">不同角色拥有不同操作权限</p>
            </div>
            <div className="py-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setRole(role)
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-dark-50 transition-colors text-left ${
                    currentRole === role ? 'bg-primary-50' : ''
                  }`}
                >
                  <span className={`${currentRole === role ? 'text-primary-600' : 'text-dark-400'}`}>
                    {roleIcons[role]}
                  </span>
                  <div className="flex-1">
                    <div className={`font-medium ${currentRole === role ? 'text-primary-700' : 'text-dark-700'}`}>
                      {RoleLabels[role]}
                    </div>
                    <div className="text-xs text-dark-500">{permissionSummary[role]}</div>
                  </div>
                  {currentRole === role && (
                    <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 bg-dark-50 border-t border-dark-100 rounded-b-lg">
              <p className="text-xs text-dark-500">
                当前权限：
                <span className="text-dark-700 ml-1">
                  {Object.entries(permissions)
                    .filter(([, v]) => v)
                    .map(([k]) => k.replace('can', ''))
                    .join('、')}
                </span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
