'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from '../../../contexts/AccountContext';
import { useToast } from '../../../components/ui/Toast';
import { Mail, Lock, Eye, EyeOff, Loader2, User } from 'lucide-react';

interface LoginDto {
  email: string;
  password: string;
}

export default function LoginPage(): JSX.Element {
  const { login, isAuthenticated, isLoading } = useAccount();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [formData, setFormData] = useState<LoginDto>({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Verificar se há mensagem na URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    
    if (message) {
      addToast({
        type: 'success',
        title: 'Conta criada com sucesso!',
        message: 'Agora você pode fazer login',
        duration: 5000
      });
      
      // Limpar a URL
      window.history.replaceState({}, '', '/auth/login');
    }
  }, [addToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(formData);
      addToast({
        type: 'success',
        title: 'Login realizado com sucesso!',
        message: 'Redirecionando para o dashboard...',
        duration: 3000
      });
      
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro no login',
        message: err instanceof Error ? err.message : 'Erro ao fazer login',
        persistent: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              Sistema Laboratorial
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Plataforma completa para gestão laboratorial com tecnologia de ponta
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span className="text-blue-100">Gestão multitenant</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span className="text-blue-100">Segurança avançada</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span className="text-blue-100">Interface moderna</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-48 -translate-x-48" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bem-vindo de volta
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             transition-colors duration-200"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                             transition-colors duration-200"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Lembrar de mim
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  href="/auth/recovery" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm 
                       text-sm font-medium text-white bg-primary hover:bg-primary/90 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não tem uma conta?{' '}
              <Link 
                href="/auth/create" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
