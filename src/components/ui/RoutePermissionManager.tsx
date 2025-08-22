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
  const [adding, setAdding] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addPermission = async () => {
    if (!selectedRoleId) {
      return;
    }

    setAdding(true);

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
      await fetchRoutePermissions();
      onPermissionChange?.();
    } catch (err) {
      console.error(err);
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
      console.error(err);
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

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-xl font-semibold">Gerenciar Permissões para {route}</h3>
      <div className="flex items-center space-x-4">
        <select
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
        >
          <option value="">Selecione um cargo</option>
          {availableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={addPermission}
          disabled={adding}
        >
          {adding ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>
      <div className="space-y-2">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-700 rounded-md"
          >
            <span>{role.name}</span>
            <button
              className="px-2 py-1 text-red-500 hover:text-red-700 focus:outline-none"
              onClick={() => removePermission(role.id)}
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
