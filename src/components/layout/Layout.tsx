import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '@/store/app.store';
import { LoginPage } from '@/pages/LoginPage';

export function Layout({ children }: { children?: React.ReactNode }) {
  const { isLoggedIn } = useAppStore();

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
