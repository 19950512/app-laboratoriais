import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';

interface UseAccessibleRoutesReturn {
  routes: string[];
  loading: boolean;
  error: string | null;
  canAccess: (route: string) => boolean;
  refreshRoutes: () => void;
}

export function useAccessibleRoutes(): UseAccessibleRoutesReturn {
  const [routes, setRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getCookie('auth-token');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const response = await fetch('/api/auth/routes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar rotas acessíveis');
      }

      const data = await response.json();
      setRoutes(data.data.routes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const canAccess = (route: string): boolean => {
    // A rota /profile sempre é acessível
    if (route === '/profile' || route.startsWith('/profile/')) {
      return true;
    }

    // Verificar se a rota está na lista de rotas acessíveis
    return routes.includes(route);
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return {
    routes,
    loading,
    error,
    canAccess,
    refreshRoutes: fetchRoutes
  };
}
