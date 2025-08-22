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
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [adding, setAdding] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const addRole = async () => {
    if (!selectedRoleId) {
      setError('Selecione um cargo');
      return;
    }

    setAdding(true);
    setError(null);

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
      setShowAddForm(false);
      await fetchUserRoles();
      onRoleChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
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
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
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

  // Filtrar cargos disponíveis (que o usuário ainda não possui)
  const rolesNotAssigned = availableRoles.filter(
    role => !userRoles.some(userRole => userRole.id === role.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Cargos de {userName}</h4>
        {rolesNotAssigned.length > 0 && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showAddForm ? 'Cancelar' : 'Adicionar Cargo'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {showAddForm && rolesNotAssigned.length > 0 && (
        <div className="p-3 border rounded bg-gray-50">
          <div className="flex items-center space-x-2">
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Selecione um cargo</option>
              {rolesNotAssigned.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <button
              onClick={addRole}
              disabled={adding || !selectedRoleId}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {userRoles.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            Usuário não possui cargos atribuídos
          </div>
        ) : (
          userRoles.map((role) => (
            <div key={role.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="text-sm">{role.name}</span>
              </div>
              <button
                onClick={() => removeRole(role.id)}
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
