import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';

interface Role {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

interface RoutePermissionManagerProps {
  route: string;
  onPermissionChange?: () => void;
  refreshTrigger?: number; // Para forçar refresh quando roles são alterados
}

export function RoutePermissionManager({ route, onPermissionChange, refreshTrigger }: RoutePermissionManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchRoutePermissions = async () => {
    try {
      const token = getCookie('auth-token');
      const encodedRoute = encodeURIComponent(route);
      
      const [permissionsResponse, allRolesResponse] = await Promise.all([
        fetch(`/api/routes/${encodedRoute}/permissions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!permissionsResponse.ok || !allRolesResponse.ok) {
        throw new Error('Erro ao carregar permissões');
      }

      const permissionsData = await permissionsResponse.json();
      const allRolesData = await allRolesResponse.json();

      setRoles(permissionsData.data.roles);
      setAvailableRoles(allRolesData.data.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const addPermission = async () => {
    if (!selectedRoleId) {
      setError('Selecione um cargo');
      return;
    }

    setAdding(true);
    setError(null);

    try {
      const token = getCookie('auth-token');
      const encodedRoute = encodeURIComponent(route);
      
      const response = await fetch(`/api/routes/${encodedRoute}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId: selectedRoleId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar permissão');
      }

      setSelectedRoleId('');
      setShowAddForm(false);
      await fetchRoutePermissions();
      onPermissionChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setAdding(false);
    }
  };

  const removePermission = async (roleId: string) => {
    if (!confirm('Deseja remover esta permissão?')) {
      return;
    }

    try {
      const token = getCookie('auth-token');
      const encodedRoute = encodeURIComponent(route);
      
      const response = await fetch(`/api/routes/${encodedRoute}/permissions?roleId=${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover permissão');
      }

      await fetchRoutePermissions();
      onPermissionChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  useEffect(() => {
    fetchRoutePermissions();
  }, [route]);

  // Adicionar useEffect para o refreshTrigger
  useEffect(() => {
    if (refreshTrigger) {
      fetchRoutePermissions();
    }
  }, [refreshTrigger]);

  if (loading) {
    return <div className="p-4">Carregando permissões...</div>;
  }

  // Filtrar apenas cargos ativos e que não tenham permissão
  const rolesWithoutPermission = availableRoles
    .filter(role => role.active !== false) // Apenas cargos ativos
    .filter(role => !roles.some(r => r.id === role.id)); // Que não tenham permissão

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Permissões para {route}</h4>
        {rolesWithoutPermission.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showAddForm ? 'Cancelar' : 'Adicionar'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {showAddForm && rolesWithoutPermission.length > 0 && (
        <div className="p-3 border rounded bg-gray-50">
          <div className="flex items-center space-x-2">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Selecione um cargo</option>
              {rolesWithoutPermission.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              onClick={addPermission}
              disabled={adding || !selectedRoleId}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {roles.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            Nenhum cargo tem permissão para esta rota
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="text-sm">{role.name}</span>
              </div>
              <button
                onClick={() => removePermission(role.id)}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
