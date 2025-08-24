"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { getCookie } from "cookies-next";

const bankOptions = [
  { value: "inter", label: "Banco Inter", logo: "/logos/inter.png" },
  { value: "asaas", label: "Asaas", logo: "/logos/asaas.svg" },
];

export default function EditBankAccount() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    nameAccountBank: "", // Valor padrão vazio
    bankName: "", // Valor padrão vazio
    certificatePublic: "", // Valor padrão vazio
    certificatePrivate: "", // Valor padrão vazio
    clientId: "", // Valor padrão vazio
    secretId: "", // Valor padrão vazio
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const accountId = searchParams.get("id");

  useEffect(() => {
    if (accountId) {
      fetchBankAccount(accountId);
    }
  }, [accountId]);

  const fetchBankAccount = async (id: string) => {
    try {
      const token = getCookie("auth-token");
      const response = await fetch(`/api/bank-accounts/?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        addToast({
          type: "error",
          title: "Erro ao carregar conta",
          message: "Não foi possível carregar os dados da conta bancária.",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar conta bancária:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getCookie("auth-token");

    if (!token) {
      console.error("Token não encontrado nos cookies.");
      addToast({
        type: "error",
        title: "Erro de autenticação",
        message: "Token não encontrado. Faça login novamente.",
      });
      return;
    }

    const response = await fetch(`/api/bank-accounts/?id=${accountId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    const responseData = await response.json();

    if (response.ok) {
      addToast({
        type: "success",
        title: "Conta atualizada com sucesso!",
      });
      router.push("/bank-accounts");
    } else {
      addToast({
        type: "error",
        title: "Erro ao atualizar conta",
        message: responseData.error || responseData.message || "Não foi possível atualizar a conta bancária. Tente novamente.",
      });
      console.error("Failed to update bank account", responseData);
    }
  };

  return (
    <AppLayout title="Editar Conta Bancária" subtitle="Atualize os dados da conta bancária">
      <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="nameAccountBank"
                placeholder="Digite o nome da conta bancária"
                value={formData.nameAccountBank}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
              <div className="space-y-2">
                {bankOptions.map((bank) => (
                  <label key={bank.value} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="bankName"
                      value={bank.value}
                      checked={formData.bankName === bank.value}
                      onChange={handleChange}
                      className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-900 dark:text-white">{bank.label}</span>
                    <Image src={bank.logo} alt={bank.label} width={80} height={80} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Credenciais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="clientId"
                placeholder="Exemplo: f4b3c9e0d8e5c1a3b5f9d1e2c6b7a9d9"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                name="secretId"
                placeholder="Exemplo: d8f1b2a8c9d7e4a7f5c8d0f3a6a1e3d8"
                value={formData.secretId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <textarea
                name="certificatePublic"
                placeholder="----------BEGIN CERTIFICATE------------
                ----------END CERTIFICATE----------"
                value={formData.certificatePublic}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
              />
              <textarea
                name="certificatePrivate"
                placeholder="----------BEGIN PRIVATE KEY------------
                ------------END PRIVATE KEY-------------"
                value={formData.certificatePrivate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
              />
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Atualizar Conta
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
