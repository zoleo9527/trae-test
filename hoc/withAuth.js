import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function withAuth(WrappedComponent, requiredRoles = null) {
  return function AuthenticatedComponent(props) {
    const { user, loading, hasRole } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
      if (!loading && user && requiredRoles && !hasRole(requiredRoles)) {
        router.push('/403');
      }
    }, [user, loading, router, hasRole]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-4 animate-spin">⚙️</div>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">权限不足</h1>
            <p className="text-gray-500">您没有访问此页面的权限</p>
          </div>
        </div>
      );
    }

    return (
      <Layout>
        <WrappedComponent {...props} />
      </Layout>
    );
  };
}
