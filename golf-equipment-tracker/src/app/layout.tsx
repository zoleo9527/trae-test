import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "高尔夫练习场 - 器材借用与归还验收",
  description: "高尔夫练习场器材借用、归还验收、连续回查一体化管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AppProvider>
          <AppLayout>{children}</AppLayout>
        </AppProvider>
      </body>
    </html>
  );
}
