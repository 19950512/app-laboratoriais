'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Loader2 } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { useBusiness } from '../../contexts/BusinessContext';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
  showFooter?: boolean;
  containerClassName?: string;
}

export function AppLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false, 
  backUrl,
  showFooter = true,
  containerClassName = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
}: AppLayoutProps) {
  const { isLoading: accountLoading } = useAccount();
  const { isLoading: businessLoading } = useBusiness();

  // Loading state
  if (accountLoading || businessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <Header 
        title={title || ''}
        subtitle={subtitle || ''}
        showBackButton={showBackButton || false}
        backUrl={backUrl || ''}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className={containerClassName}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}
