import React from 'react'
import { RoleSelector } from '../common/RoleSelector'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, action }) => {
  return (
    <header className="bg-white border-b border-dark-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-dark-900">{title}</h1>
          {subtitle && <p className="text-sm text-dark-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          {action}
          <RoleSelector />
        </div>
      </div>
    </header>
  )
}
