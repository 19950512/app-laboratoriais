"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { getCookie } from "cookies-next";

const bankOptions = [
  { value: "inter", label: "Banco Inter", logo: "/logos/inter.png" },
  { value: "asaas", label: "Asaas", logo: "/logos/asaas.svg" },
];

export default function CreateBankAccount() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    nameAccountBank: "",
    bankName: "",
    certificatePublic: "",
    certificatePrivate: "",
    clientId: "",
    secretId: "",
  });

  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getCookie("auth-token"); // Recupera o token do cookie

    if (!token) {
      console.error("Token não encontrado nos cookies.");
      addToast({
        type: "error",
        title: "Erro de autenticação",
        message: "Token não encontrado. Faça login novamente.",
      });
      return;
    }

    const response = await fetch("/api/bank-accounts", {
      method: "POST",
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
        title: "Conta criada com sucesso!",
      });
      router.push("/bank-accounts");
    } else {
      addToast({
        type: "error",
        title: "Erro ao criar conta",
        message: responseData.error || "Não foi possível criar a conta bancária. Tente novamente.",
      });
      console.error("Failed to create bank account", responseData);
    }
  };

  return (
    <AppLayout title="Criar Conta Bancária" subtitle="Adicione uma nova conta bancária ao sistema">
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
                required
              />
              <input
                type="text"
                name="secretId"
                placeholder="Exemplo: d8f1b2a8c9d7e4a7f5c8d0f3a6a1e3d8"
                value={formData.secretId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
              <textarea
                name="certificatePublic"
                placeholder="----------BEGIN CERTIFICATE------------
                ----------END CERTIFICATE----------"
                value={formData.certificatePublic}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
                required
              />
              <textarea
                name="certificatePrivate"
                placeholder="----------BEGIN PRIVATE KEY------------
                ------------END PRIVATE KEY-------------"
                value={formData.certificatePrivate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
                required
              />
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
