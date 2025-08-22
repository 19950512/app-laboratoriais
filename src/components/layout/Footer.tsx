'use client';

import { Building, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          {/* Logo e informações */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Building className="h-4 w-4" />
            <span>LabManager © {currentYear}</span>
          </div>

          {/* Links úteis */}
          <div className="flex items-center space-x-4 text-sm">
            <a 
              href="#"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Ajuda
            </a>
            <a 
              href="#"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Suporte
            </a>
            <a 
              href="#"
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Privacidade
            </a>
          </div>

          {/* Créditos */}
          <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Feito com</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>para laboratórios</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
