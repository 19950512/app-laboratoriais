'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '../../contexts/AccountContext';
import { AppLayout } from '../../components/layout';
import { Loader2, User, Building, Users, Activity, BarChart3 } from 'lucide-react';

export default function DashboardPage(): JSX.Element {
  const { account, isAuthenticated, isLoading } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-400">Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !account) {
    return <div></div>;
  }

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Visão geral do seu laboratório"
    >
      {/* Cartões de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Usuários */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total de Usuários
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                1
              </p>
            </div>
          </div>
        </div>

        {/* Laboratórios Ativos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Laboratórios
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                1
              </p>
            </div>
          </div>
        </div>

        {/* Atividade Hoje */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Atividade Hoje
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                5
              </p>
            </div>
          </div>
        </div>

        {/* Relatórios */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Relatórios
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                12
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Boas-vindas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {account.photoProfile ? (
              <img
                src={account.photoProfile}
                alt={account.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bem-vindo de volta, {account.name}!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Aqui está o resumo das atividades do seu laboratório hoje.
            </p>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors">
              <div className="flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  Adicionar Usuário
                </span>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors">
              <div className="flex items-center">
                <Building className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Novo Laboratório
                </span>
              </div>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  Gerar Relatório
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividade Recente
          </h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Usuário criado há 5 min
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Relatório gerado há 1h
              </span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Sistema atualizado há 2h
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
              <span className="text-sm font-medium text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Versão</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">99.9%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico ou dados adicionais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Estatísticas dos Últimos 30 Dias
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              Gráficos serão implementados em breve
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
