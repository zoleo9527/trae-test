import { AppProvider } from "@/components/AppProvider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "自助洗车 - 设备补货与耗材盘点",
  description: "自助洗车站点运营管理系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
