'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '../../contexts/AccountContext';
import { useToast } from '../../components/ui/Toast';
import { AppLayout } from '../../components/layout';
import { 
  Filter,
  User,
  Building,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Shield
} from 'lucide-react';

interface AuditLog {
  id: string;
  context: string;
  description: string;
  moment: string;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: any;
  business: {
    id: string;
    name: string;
  };
  account?: {
    id: string;
    name: string;
    email: string;
  };
}

interface FilterData {
  accounts: Array<{ id: string; name: string; email: string; }>;
  contexts: string[];
  businesses: Array<{ id: string; name: string; }>;
  allContexts: string[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function AuditLogsPage(): JSX.Element {
  const { account, isLoading } = useAccount();
  const { addToast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50
  });

  const [filters, setFilters] = useState({
    contexts: [] as string[],
    accounts: [] as string[],
    businesses: [] as string[],
    startDate: '',
    endDate: ''
  });

  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Carregar dados iniciais para filtros
  useEffect(() => {
    if (account) {
      loadFilterData();
      loadLogs(1);
    }
  }, [account]);

  const loadFilterData = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados dos filtros');
      }

      const result = await response.json();
      setFilterData(result.data);

    } catch (error: any) {
      addToast({
        type: 'error',
        title: `Erro ao carregar filtros: ${error.message}`
      });
    }
  };

  const loadLogs = async (page: number = 1) => {
    try {
      setIsLoadingLogs(true);

      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filters.contexts.length > 0) {
        params.append('contexts', filters.contexts.join(','));
      }
      if (filters.accounts.length > 0) {
        params.append('accounts', filters.accounts.join(','));
      }
      if (filters.businesses.length > 0) {
        params.append('businesses', filters.businesses.join(','));
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
      }

      const response = await fetch(`/api/audit-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar logs');
      }

      const result = await response.json();
      setLogs(result.data.logs);
      setPagination(result.data.pagination);

    } catch (error: any) {
      addToast({
        type: 'error',
        title: `Erro ao carregar logs: ${error.message}`
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleFilterChange = (filterType: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleFilterValue = (filterType: 'contexts' | 'accounts' | 'businesses', value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearFilters = () => {
    setFilters({
      contexts: [],
      accounts: [],
      businesses: [],
      startDate: '',
      endDate: ''
    });
  };

  const applyFilters = () => {
    loadLogs(1);
    setShowFilters(false);
  };

  const formatContextLabel = (context: string) => {
    const labels: Record<string, string> = {
      auth_login: 'Login',
      auth_logout: 'Logout',
      auth_recovery: 'Recuperação de Senha',
      auth_deny: 'Acesso Negado',
      auth_password_change: 'Alteração de Senha',
      account_create: 'Criação de Conta',
      account_update: 'Atualização de Conta',
      account_deactivate: 'Desativação de Conta',
      business_create: 'Criação de Empresa',
      business_update: 'Atualização de Empresa',
      profile_update: 'Atualização de Perfil',
      session_create: 'Criação de Sessão',
      session_revoke: 'Revogação de Sessão'
    };
    return labels[context] || context;
  };

  const getContextIcon = (context: string) => {
    const icons: Record<string, JSX.Element> = {
      auth_login: <Shield className="h-4 w-4 text-green-500" />,
      auth_logout: <Shield className="h-4 w-4 text-red-500" />,
      auth_recovery: <Shield className="h-4 w-4 text-yellow-500" />,
      auth_deny: <Shield className="h-4 w-4 text-red-600" />,
      auth_password_change: <Shield className="h-4 w-4 text-blue-500" />,
      account_create: <User className="h-4 w-4 text-green-500" />,
      account_update: <User className="h-4 w-4 text-blue-500" />,
      account_deactivate: <User className="h-4 w-4 text-red-500" />,
      business_create: <Building className="h-4 w-4 text-green-500" />,
      business_update: <Building className="h-4 w-4 text-blue-500" />,
      profile_update: <User className="h-4 w-4 text-blue-500" />,
      session_create: <Clock className="h-4 w-4 text-green-500" />,
      session_revoke: <Clock className="h-4 w-4 text-red-500" />
    };
    return icons[context] || <Clock className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading || !account) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Carregando...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
        title='Logs de Auditoria'
        subtitle='Monitore todas as atividades do sistema'
    >
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Logs de Auditoria
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Visualize e monitore todas as atividades do sistema
          </p>
        </div>

        {/* Barra de ferramentas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {(filters.contexts.length + filters.accounts.length + filters.businesses.length > 0 || filters.startDate || filters.endDate) && (
                  <span className="ml-2 bg-blue-500 text-xs px-2 py-1 rounded-full">
                    {filters.contexts.length + filters.accounts.length + filters.businesses.length + (filters.startDate ? 1 : 0) + (filters.endDate ? 1 : 0)}
                  </span>
                )}
              </button>

              <button
                onClick={() => loadLogs(pagination.currentPage)}
                disabled={isLoadingLogs}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {pagination.totalCount} registro(s) encontrado(s)
              </span>
            </div>
          </div>
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Filtro de Eventos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipos de Evento
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                  {filterData?.allContexts.map((context) => (
                    <label key={context} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={filters.contexts.includes(context)}
                        onChange={() => toggleFilterValue('contexts', context)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        {getContextIcon(context)}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {formatContextLabel(context)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de Usuários */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Usuários
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                  {filterData?.accounts.map((account) => (
                    <label key={account.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                      <input
                        type="checkbox"
                        checked={filters.accounts.includes(account.id)}
                        onChange={() => toggleFilterValue('accounts', account.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{account.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{account.email}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de Datas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data Início</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Data Fim</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Limpar Filtros
              </button>
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Lista de logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar os filtros para encontrar os logs desejados.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Evento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getContextIcon(log.context)}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatContextLabel(log.context)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                            {log.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.account?.name || 'Sistema'}
                            </span>
                            {log.account?.email && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {log.account.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.moment).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrando {((pagination.currentPage - 1) * pagination.limit) + 1} até{' '}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} de{' '}
                      {pagination.totalCount} registros
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadLogs(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Página {pagination.currentPage} de {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => loadLogs(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de detalhes do log */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Detalhes do Log
                  </h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Evento
                      </label>
                      <div className="flex items-center space-x-2">
                        {getContextIcon(selectedLog.context)}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatContextLabel(selectedLog.context)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Data/Hora
                      </label>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(selectedLog.moment).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedLog.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Usuário
                      </label>
                      <div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {selectedLog.account?.name || 'Sistema'}
                        </span>
                        {selectedLog.account?.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedLog.account.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Empresa
                      </label>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedLog.business.name}
                      </span>
                    </div>
                  </div>

                  {selectedLog.ipAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Endereço IP
                      </label>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {selectedLog.ipAddress}
                      </span>
                    </div>
                  )}

                  {selectedLog.userAgent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        User Agent
                      </label>
                      <span className="text-sm text-gray-900 dark:text-white break-all">
                        {selectedLog.userAgent}
                      </span>
                    </div>
                  )}

                  {selectedLog.additionalData && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dados Adicionais
                      </label>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded-lg overflow-x-auto text-gray-900 dark:text-white">
                        {JSON.stringify(selectedLog.additionalData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </AppLayout>
  );
}
