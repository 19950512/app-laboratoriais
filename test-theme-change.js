const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50SWQiOiJmZDJiMDJlYi0xYzk1LTQ4MzItYTcwMS1iMzkwMzgzOTVmMTgiLCJidXNpbmVzc0lkIjoiYmJjZDI1OGYtNWU2NC00MDZkLWI5MzYtOTc2ZTY1ZmEyNTYwIiwiZW1haWwiOiJhZG1pbkBkZW1vLmNvbSIsImlhdCI6MTc1NTgyNTAwMSwiZXhwIjoxNzU2NDI5ODAxfQ.Vk4TrY_Lg9dqioH3DeJVL9DJd56wO-btcpI0fPBFO28';

async function testThemeChange() {
  try {
    console.log('🧪 Testando mudança de tema...');
    
    // Buscar preferências atuais
    const currentPrefs = await fetch('http://localhost:3000/api/account/preferences', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const prefsData = await currentPrefs.json();
    console.log('📋 Preferências atuais:', prefsData.data?.preferences);
    
    const currentTheme = prefsData.data?.preferences?.theme || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Alterar tema
    console.log(`🎨 Alterando tema de ${currentTheme} para ${newTheme}...`);
    
    const response = await fetch('http://localhost:3000/api/account/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ theme: newTheme })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Tema alterado com sucesso!');
      console.log('📋 Novas preferências:', result.data.preferences);
      
      // Verificar se foi registrado na auditoria
      await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar um pouco
      
      const auditResponse = await fetch('http://localhost:3000/api/audit-logs?page=1&limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const auditData = await auditResponse.json();
      const themeChangeLogs = auditData.data?.logs?.filter(log => 
        log.context === 'theme_change' || log.description.includes('Tema alterado')
      );
      
      if (themeChangeLogs && themeChangeLogs.length > 0) {
        console.log('📝 Registros de auditoria encontrados:');
        themeChangeLogs.forEach(log => {
          console.log(`  - ${log.description} (${new Date(log.moment).toLocaleString()})`);
          console.log(`    Dados adicionais:`, log.additionalData);
        });
      } else {
        console.log('⚠️  Nenhum registro de auditoria de mudança de tema encontrado');
      }
      
    } else {
      console.error('❌ Erro ao alterar tema:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testThemeChange();
