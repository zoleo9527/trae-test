import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';

export const metadata = {
  title: '船舶代理管理系统',
  description: '费用垫付与回款核对系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
