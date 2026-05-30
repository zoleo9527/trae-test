import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '高尔夫练习场 - 会员储值与消耗对账系统',
  description: '高尔夫练习场会员储值管理、球道预约、器材借还、消耗对账一体化管理系统',
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
