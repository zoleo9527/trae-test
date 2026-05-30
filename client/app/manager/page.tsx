'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ManagerHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/manager/dashboard');
  }, [router]);

  return null;
}
