import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '../lib/routes';
import Layout from '../components/Layout';
import UnifiedWorkspace from '../components/UnifiedWorkspace';

export default function Home() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push(ROUTES.LOGIN);
    } else {
      setLoading(false);
    }
  }, [token, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <Layout>
      <UnifiedWorkspace />
    </Layout>
  );
}
