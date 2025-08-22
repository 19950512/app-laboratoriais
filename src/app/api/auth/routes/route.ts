import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getUserAccessibleRoutes } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { accountId, businessId } = authResult.user;

    // Buscar rotas acessíveis
    const accessibleRoutes = await getUserAccessibleRoutes(accountId, businessId);

    return NextResponse.json({
      success: true,
      data: {
        routes: accessibleRoutes,
        accountId,
        businessId
      }
    });
  } catch (error) {
    console.error('Error getting accessible routes:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}
