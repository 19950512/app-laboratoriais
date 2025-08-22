'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { LogoUpload } from '../../components/ui/LogoUpload';
import { useAccount } from '../../contexts/AccountContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useToast } from '../../components/ui/Toast';
import { getCookie } from 'cookies-next';
import { 
  Building, 
  Users, 
  Save, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  UserCheck,
  UserX,
  Mail,
  Calendar
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  photoProfile?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessAdminPage() {
  const { account } = useAccount();
  const { business, loadBusinessData } = useBusiness();
  const { addToast } = useToast();
  
  // Estado da empresa
  const [businessData, setBusinessData] = useState({
    name: '',
    document: '',
    logo: ''
  });
  
  // Estado dos usuários
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    active: true
  });
  
  // Estados de loading e mensagens
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (business) {
      setBusinessData({
        name: business.name || '',
        document: business.document || '',
        logo: business.logo || ''
      });
    }
    loadUsers();
  }, [business]);

  const loadUsers = async () => {
    try {
      const token = getCookie('auth-token');
      const response = await fetch('/api/business/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data.users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getCookie('auth-token');
      const response = await fetch('/api/business/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(businessData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addToast({ 
          type: 'success', 
          title: 'Sucesso!',
          message: 'Empresa atualizada com sucesso!' 
        });
        loadBusinessData(); // Recarregar dados da empresa
      } else {
        // Se há detalhes de validação, mostrar cada erro
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: any) => {
            addToast({ 
              type: 'error', 
              title: 'Erro de Validação',
              message: detail.message || `Erro no campo: ${detail.field || 'desconhecido'}` 
            });
          });
        } else {
          addToast({ 
            type: 'error', 
            title: 'Erro!',
            message: result.error || 'Erro ao atualizar empresa' 
          });
        }
      }
    } catch (error) {
      console.error('Error in handleBusinessSubmit:', error);
      addToast({ 
        type: 'error', 
        title: 'Erro!',
        message: 'Erro interno do servidor' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getCookie('auth-token');
      const url = editingUser 
        ? `/api/business/users/${editingUser.id}`
        : '/api/business/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const body = editingUser 
        ? { 
            name: userForm.name, 
            email: userForm.email, 
            active: userForm.active,
            ...(userForm.password ? { password: userForm.password } : {})
          }
        : userForm;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addToast({ 
          type: 'success', 
          title: 'Sucesso!',
          message: editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!' 
        });
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ name: '', email: '', password: '', active: true });
        loadUsers();
      } else {
        // Se há detalhes de validação, mostrar cada erro
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: any) => {
            addToast({ 
              type: 'error', 
              title: 'Erro de Validação',
              message: detail.message || `Erro no campo: ${detail.field || 'desconhecido'}` 
            });
          });
        } else {
          addToast({ 
            type: 'error', 
            title: 'Erro!',
            message: result.error || 'Erro ao salvar usuário' 
          });
        }
      }
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Erro!',
        message: 'Erro interno do servidor' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) {
      return;
    }

    try {
      const token = getCookie('auth-token');
      const response = await fetch(`/api/business/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addToast({ 
          type: 'success', 
          title: 'Sucesso!',
          message: 'Usuário desativado com sucesso!' 
        });
        loadUsers();
      } else {
        // Se há detalhes de validação, mostrar cada erro
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail: any) => {
            addToast({ 
              type: 'error', 
              title: 'Erro de Validação',
              message: detail.message || `Erro no campo: ${detail.field || 'desconhecido'}` 
            });
          });
        } else {
          addToast({ 
            type: 'error', 
            title: 'Erro!',
            message: result.error || 'Erro ao desativar usuário' 
          });
        }
      }
    } catch (error) {
      addToast({ 
        type: 'error', 
        title: 'Erro!',
        message: 'Erro interno do servidor' 
      });
    }
  };

  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        password: '',
        active: user.active
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', password: '', active: true });
    }
    setShowUserModal(true);
  };

  if (isLoading) {
    return (
      <AppLayout title="Administração da Empresa">
        <div className="flex justify-center items-center min-h-64">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Administração da Empresa" subtitle="Gerencie as informações da empresa e usuários">
      <div className="space-y-8">
        {/* Informações da Empresa */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Logo atual da empresa */}
                {business?.logo ? (
                  <img 
                    src={business.logo} 
                    alt={business.name || 'Logo da empresa'}
                    className="h-12 w-12 object-contain rounded border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <Building className="h-12 w-12 text-blue-500" />
                )}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Informações da Empresa
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {business?.name || 'Carregando...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleBusinessSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={businessData.name}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CNPJ/CPF
                  </label>
                  <input
                    type="text"
                    value={businessData.document}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, document: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Apenas números"
                    required
                  />
                </div>
              </div>

              <div>
                <LogoUpload
                  currentLogo={businessData.logo}
                  onLogoChange={(logoPath) => setBusinessData(prev => ({ ...prev, logo: logoPath }))}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>

        {/* Gerenciamento de Usuários */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Usuários da Empresa
              </h2>
            </div>
            <button
              onClick={() => openUserModal()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Usuário
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photoProfile ? (
                          <img
                            src={user.photoProfile}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.active ? (
                          <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openUserModal(user)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar usuário"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {user.id !== account?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Desativar usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Usuário */}
        {showUserModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleUserSubmit}>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={userForm.name}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={userForm.password}
                            onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            required={!editingUser}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {editingUser && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="active"
                            checked={userForm.active}
                            onChange={(e) => setUserForm(prev => ({ ...prev, active: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="active" className="ml-2 block text-sm text-gray-900 dark:text-white">
                            Usuário ativo
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
