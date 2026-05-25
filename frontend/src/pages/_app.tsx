import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';
import { useAuthStore } from '../store/authStore';

export default function App({ Component, pageProps }: AppProps) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <Component {...pageProps} />;
}
