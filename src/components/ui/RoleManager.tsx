import React, { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';

interface Role {
  id: string;
  name: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    accountRoles: number;
    routeRoles: number;
  };
}

interface RoleManagerProps {
  onRoleChange?: () => void;
}

export function RoleManager({ onRoleChange }: RoleManagerProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', color: '#3b82f6' });
  const [creating, setCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState({ name: '', color: '' });
  const [updating, setUpdating] = useState(false);

  const fetchRoles = async () => {
    try {
      const token = getCookie('auth-token');
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar cargos');
      }

      const data = await response.json();
      setRoles(data.data.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) {
      setError('Nome do cargo é obrigatório');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const token = getCookie('auth-token');
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRole)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar cargo');
      }

      setNewRole({ name: '', color: '#3b82f6' });
      setShowCreateForm(false);
      await fetchRoles();
      onRoleChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setEditForm({ name: role.name, color: role.color });
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditForm({ name: '', color: '' });
  };

  const updateRole = async () => {
    if (!editingRole || !editForm.name.trim()) {
      setError('Nome do cargo é obrigatório');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const token = getCookie('auth-token');
      const response = await fetch(`/api/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao editar cargo');
      }

      setEditingRole(null);
      setEditForm({ name: '', color: '' });
      await fetchRoles();
      onRoleChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setUpdating(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (!confirm(`Deseja excluir o cargo "${role.name}"?`)) {
      return;
    }

    try {
      const token = getCookie('auth-token');
      const response = await fetch(`/api/roles/${role.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir cargo');
      }

      await fetchRoles();
      onRoleChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (loading) {
    return <div className="p-4">Carregando cargos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciar Cargos</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancelar' : 'Novo Cargo'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Criar Novo Cargo</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cargo
              </label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Administrador, Técnico, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={createRole}
                disabled={creating}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? 'Criando...' : 'Criar Cargo'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum cargo criado ainda
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="border rounded-lg">
              {editingRole?.id === role.id ? (
                // Formulário de edição
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do cargo</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Digite o nome do cargo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cor</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-8 h-8 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={updateRole}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Visualização normal
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-gray-500">
                        {role._count?.accountRoles || 0} usuários • {role._count?.routeRoles || 0} permissões
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{role.color}</span>
                    <button 
                      onClick={() => startEdit(role)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => deleteRole(role)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
