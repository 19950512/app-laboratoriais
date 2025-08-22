'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAccount } from '../../contexts/AccountContext';
import { useToast } from '../../components/ui/Toast';
import { AppLayout } from '../../components/layout';
import { ProfileImageUpload } from '../../components/ui/ProfileImageUpload';
import { getCookie } from 'cookies-next';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  Loader2
} from 'lucide-react';

export default function ProfilePage(): JSX.Element {
  const { account, updateProfile, isLoading } = useAccount();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photoProfile: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'roles'>('info');
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    if (account && !isSubmitting) {
      setFormData(prev => ({
        ...prev,
        name: account.name || '',
        email: account.email || '',
        photoProfile: account.photoProfile || ''
      }));
    }
  }, [account, isSubmitting]);

  const loadUserRoles = async () => {
    if (!account?.id) return;
    
    setRolesLoading(true);
    try {
      const token = getCookie('auth-token');
      const response = await fetch(`/api/users/${account.id}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserRoles(data.data.roles);
      }
    } catch (error) {
      console.error('Error loading user roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roles' && account?.id) {
      loadUserRoles();
    }
  }, [activeTab, account?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      
      if (activeTab === 'password') {
        // Validação de senha
        if (!formData.currentPassword) {
          addToast({
            type: 'warning',
            title: 'Digite a senha atual'
          });
          return;
        }

        if (!formData.newPassword) {
          addToast({
            type: 'warning',
            title: 'Digite a nova senha'
          });
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          addToast({
            type: 'error',
            title: 'As senhas não coincidem'
          });
          return;
        }

        if (formData.newPassword.length < 6) {
          addToast({
            type: 'error',
            title: 'A nova senha deve ter pelo menos 6 caracteres'
          });
          return;
        }

        // Atualizar senha
        await updateProfile({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        });

        // Limpar campos de senha
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        addToast({
          type: 'success',
          title: 'Senha atualizada com sucesso!'
        });
      } else {
        // Atualizar informações básicas
        await updateProfile({
          name: formData.name,
          email: formData.email,
          photoProfile: formData.photoProfile
        });

        addToast({
          type: 'success',
          title: 'Perfil atualizado com sucesso!'
        });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: error.message || 'Erro ao atualizar perfil'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !account) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600 dark:text-gray-400">Carregando perfil...</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
        title='Meu Perfil'
        subtitle='Gerencie suas informações e configurações'
    >
        {/* Cabeçalho do perfil */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {account.photoProfile ? (
                <img
                  src={account.photoProfile}
                  alt={account.name}
                  className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
              ) : (
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Meu Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie suas informações pessoais e configurações
              </p>
            </div>
          </div>
        </div>

        {/* Formulário de perfil */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Informações Pessoais
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Alterar Senha
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'roles'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Meus Cargos
              </button>
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {activeTab === 'info' ? (
              <div className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Digite seu email"
                      required
                    />
                  </div>
                </div>

                {/* Status de Owner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status da conta
                  </label>
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    {account.isCompanyOwner ? (
                      <>
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          Proprietário da Empresa
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Você tem acesso total ao sistema
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          Funcionário
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Acesso baseado nos seus cargos
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload da Foto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Foto de perfil
                  </label>
                  <ProfileImageUpload
                    currentImage={formData.photoProfile}
                    onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, photoProfile: imageUrl }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            ) : activeTab === 'password' ? (
              <div className="space-y-6">
                {/* Senha Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha atual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Nova Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Digite sua nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                {/* Confirmar Nova Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Confirme sua nova senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : activeTab === 'roles' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Seus Cargos
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Cargos e funções atribuídos à sua conta
                  </p>
                </div>

                {rolesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-500">Carregando cargos...</span>
                  </div>
                ) : userRoles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhum cargo atribuído ainda
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userRoles.map((role) => (
                      <div key={role.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: role.color }}
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {role.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Atribuído em {new Date(role.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Botão de Submit */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Informações da conta
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <p>Conta criada em: <span className="font-medium">
                  {new Date(account.createdAt).toLocaleDateString('pt-BR')}
                </span></p>
                <p>Status: <span className="font-medium text-green-600 dark:text-green-400">
                  {account.active ? 'Ativa' : 'Inativa'}
                </span></p>
              </div>
            </div>
          </div>
        </div>
    </AppLayout>
  );
}
