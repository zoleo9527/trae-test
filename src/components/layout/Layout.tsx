import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children, title, subtitle, action }) => {
  return (
    <div className="flex min-h-screen bg-dark-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} action={action} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
