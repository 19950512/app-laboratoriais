'use client';

import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AccessDeniedPage() {
  return (
    <AppLayout title="Acesso Negado" subtitle="Você não possui permissão para acessar esta área">
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/20">
            <Shield className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você não possui os cargos necessários para acessar esta página.
              <br />
              Entre em contato com o administrador da empresa para solicitar as permissões adequadas.
            </p>
            
            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Link>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Precisa de ajuda? Entre em contato com o suporte.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
