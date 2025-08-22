'use client';

import { Building, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna 1 */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Laboratoriais</h3>
            <p className="text-sm text-gray-400">
              Soluções inovadoras para gestão laboratorial. Transformando ideias em realidade.
            </p>
          </div>

          {/* Coluna 2 */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="hover:text-white transition">Política de Privacidade</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Termos de Uso</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Contato</a>
              </li>
            </ul>
          </div>

          {/* Coluna 3 */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Siga-nos</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © {currentYear} Laboratoriais. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
