'use client';

import { useRouter } from 'next/navigation';
import { useAccount } from '../../contexts/AccountContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAccessibleRoutes } from '../../hooks/useAccessibleRoutes';
import { useTheme } from 'next-themes';
import { ThemeEnum } from '../../types';
import { 
  User, 
  Building,
  LogOut,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { navigationItems } from '@/constants/navigationItems';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { account, logout, updatePreferences } = useAccount();
  const { business } = useBusiness();
  const { theme, setTheme } = useTheme();
  const { canAccess } = useAccessibleRoutes();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filtrar itens baseado nas permissões
  const accessibleItems = navigationItems.filter(item => 
    item.always || canAccess(item.route)
  );

  const handleNavigation = (url: string) => {
    router.push(url);
    setIsMenuOpen(false);
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const currentTheme = theme || 'light';
    
    try {
      // Atualizar tema localmente
      setTheme(newTheme);
      
      // Persistir no backend
      await updatePreferences({ 
        theme: newTheme === 'light' ? ThemeEnum.LIGHT : ThemeEnum.DARK 
      });
    } catch (error) {
      console.error('Erro ao atualizar tema:', error);
      // Reverter mudança local em caso de erro
      setTheme(currentTheme);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e título */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {/* Logo da empresa ou ícone padrão */}
              {business?.logo ? (
                <img 
                  src={business.logo} 
                  alt={business.name || 'Logo da empresa'}
                  className="h-8 w-8 object-contain rounded"
                />
              ) : (
                <Building className="h-8 w-8" />
              )}
              <div className="hidden md:block">
                <div className="text-lg font-bold">Slipksoft</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {business?.name || 'Carregando...'}
                </div>
              </div>
            </button>

            {title && (
              <div className="hidden lg:block border-l border-gray-300 dark:border-gray-600 pl-4">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Navegação */}
            <nav className="flex items-center space-x-2">
              {accessibleItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => handleNavigation(item.route)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Toggle tema */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Perfil do usuário */}
            <div className="flex items-center space-x-3">
              {account?.photoProfile ? (
                <img
                  src={account.photoProfile}
                  alt={account.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {account?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {account?.email}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {/* User info */}
              <div className="flex items-center space-x-3 px-2 py-2">
                {account?.photoProfile ? (
                  <img
                    src={account.photoProfile}
                    alt={account.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {account?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {account?.email}
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-1">
                {accessibleItems.map((item) => (
                  <button
                    key={item.route}
                    onClick={() => handleNavigation(item.route)}
                    className="w-full text-left px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between px-2 py-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Tema</span>
                  <button
                    onClick={handleThemeToggle}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
