import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

interface LayoutProps {
  children?: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  )
}
