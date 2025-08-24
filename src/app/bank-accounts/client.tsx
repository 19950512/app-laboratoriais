"use client";

import { BankAccount } from '@/types';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getCookie } from 'cookies-next';
import Link from 'next/link';
import Image from 'next/image';

const BankAccountsPage = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const token = getCookie('auth-token');
      const response = await fetch('/api/bank-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      } else {
        console.error('Erro ao buscar contas bancárias:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
    }
  };

  return (
    <AppLayout title="Contas Bancárias" subtitle="Gerencie as contas bancárias do sistema">
      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Contas Bancárias
              </h2>
            </div>
            <Link href="/bank-accounts/create">
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Conta
              </button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            {bankAccounts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">Nenhuma conta bancária encontrada. Clique em "Nova Conta" para adicionar uma.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nome da Conta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Banco
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {bankAccounts.map((bank) => (
                    <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {bank.nameAccountBank}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Image
                            src={bank.bankLogo}
                            alt={bank.bankName}
                            width={100}
                            height={100}
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {bank.bankName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/bank-accounts/edit?id=${bank.id}`}>
                            <button
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Editar conta"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => {}}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Excluir conta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BankAccountsPage;
