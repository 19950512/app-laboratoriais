import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';

interface Role {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

interface UserRole {
  id: string;
  name: string;
  color: string;
}

interface UserRoleManagerProps {
  userId: string;
  userName: string;
  onRoleChange?: () => void;
  refreshTrigger?: number;
}

export function UserRoleManager({ userId, userName, onRoleChange, refreshTrigger }: UserRoleManagerProps) {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const fetchUserRoles = async () => {
    try {
      const token = getCookie('auth-token');
      
      const [userRolesResponse, allRolesResponse] = await Promise.all([
        fetch(`/api/users/${userId}/roles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!userRolesResponse.ok || !allRolesResponse.ok) {
        throw new Error('Erro ao carregar cargos');
      }

      const userRolesData = await userRolesResponse.json();
      const allRolesData = await allRolesResponse.json();
      
      setUserRoles(userRolesData.data.roles);
      setAvailableRoles(allRolesData.data.roles.filter((role: Role) => role.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addRole = async () => {
    if (!selectedRoleId) {
      return;
    }

    setAdding(true);

    try {
      const token = getCookie('auth-token');
      
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId: selectedRoleId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar cargo');
      }

      setSelectedRoleId('');
      await fetchUserRoles();
      onRoleChange?.();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const removeRole = async (roleId: string) => {
    if (!confirm('Deseja remover este cargo do usuário?')) {
      return;
    }

    try {
      const token = getCookie('auth-token');
      
      const response = await fetch(`/api/users/${userId}/roles?roleId=${roleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover cargo');
      }

      await fetchUserRoles();
      onRoleChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, [userId]);

  useEffect(() => {
    if (refreshTrigger) {
      fetchUserRoles();
    }
  }, [refreshTrigger]);

  if (loading) {
    return <div className="p-4">Carregando cargos...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-6 rounded-lg shadow space-y-4">
      <h3 className="text-xl font-semibold">Gerenciar Cargos para {userName}</h3>
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
          onClick={addRole}
          disabled={adding}
        >
          {adding ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>
      <div className="space-y-2">
        {userRoles.map((role) => (
          <div
            key={role.id}
            className="flex items-center justify-between p-2 border border-gray-300 dark:border-gray-700 rounded-md"
          >
            <span>{role.name}</span>
            <button
              className="px-2 py-1 text-red-500 hover:text-red-700 focus:outline-none"
              onClick={() => removeRole(role.id)}
            >
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
