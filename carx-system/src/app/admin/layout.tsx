'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '../../lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('carx_token');
        const userStr = localStorage.getItem('carx_user');

        if (!token || !userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);

        // Optional: Verify the role client-side first
        if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'manager') {
          router.push('/login');
          return;
        }

        // Verify with backend
        const res = await api.auth.verify();
        if (res.error) {
          localStorage.removeItem('carx_token');
          localStorage.removeItem('carx_user');
          router.push('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-luxury-gold/30 border-t-luxury-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
