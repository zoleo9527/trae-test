import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '手作烘焙坊 - 原料盘点与损耗分析',
  description: '烘焙坊管理系统 - 订单、排产、原料、损耗一体化管理',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
