import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles = {
  '/': '工作台',
  '/cases': '签证进度',
  '/cases/new': '新建签证申请',
  '/documents': '材料管理',
  '/supplements': '补件回查',
  '/refunds': '退款协商',
  '/reports': '数据报表'
};

export function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || '签证管理系统';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
