'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/contexts/AccountContext';
import { Loader2 } from 'lucide-react';

export default function HomePage(): JSX.Element {
  const { isAuthenticated, isLoading } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Carregando Sistema Laboratorial...
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Verificando autenticação
        </p>
      </div>
    </div>
  );
}
