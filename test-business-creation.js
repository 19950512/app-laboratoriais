// Teste para verificar criação de empresa e log de auditoria

async function testBusinessCreation() {
  const testData = {
    name: 'João Teste Auditoria',
    email: `teste.auditoria.${Date.now()}@example.com`,
    password: '123456',
    confirmPassword: '123456',
    businessName: `Empresa Teste Auditoria ${Date.now()}`,
    businessDocument: '12345678901234'
  };

  try {
    console.log('🧪 Testando criação de empresa...');
    console.log('Dados do teste:', testData);

    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Empresa criada com sucesso!');
      console.log('Resposta:', result);
      
      // Verificar se os dados foram salvos
      console.log('\n📋 Dados criados:');
      console.log('- Business ID:', result.data.business.id);
      console.log('- Account ID:', result.data.account.id);
      console.log('- Business Name:', result.data.business.name);
      console.log('- Account Email:', result.data.account.email);
      
      console.log('\n🔍 Verifique no Prisma Studio (http://localhost:5556) se os logs de auditoria foram criados:');
      console.log('- Tabela "Auditoria"');
      console.log('- Context: "business_create" e "account_create"');
      console.log('- Business ID:', result.data.business.id);
      
    } else {
      console.error('❌ Erro ao criar empresa:');
      console.error('Status:', response.status);
      console.error('Resposta:', result);
    }

  } catch (error) {
    console.error('❌ Erro de rede:', error);
  }
}

// Executar o teste
testBusinessCreation();
