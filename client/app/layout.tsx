import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '家具展厅-订单配置与到货跟踪',
  description: '完整订单配置、到货跟踪、安装预约、样品借出、补件确认处理链',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
      </body>
    </html>
  )
}