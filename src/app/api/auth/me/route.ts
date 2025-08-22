import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, validateMethod, methodNotAllowed, successResponse, authenticate } from '@/middleware/auth';
import { ThemeEnum } from '@/types';

async function meHandler(request: NextRequest): Promise<NextResponse> {
  // Validar método
  if (!validateMethod(request, ['GET'])) {
    return methodNotAllowed(['GET']);
  }

  // Autenticar usuário
  const authResult = await authenticate(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  try {
    // Buscar dados completos do usuário
    const account = await prisma.account.findUnique({
      where: {
        id: authResult.user.accountId,
      },
      include: {
        business: true,
        accountPreference: true,
      },
    });

    if (!account || !account.active || !account.business.active) {
      return NextResponse.json(
        { error: 'Usuário não encontrado ou inativo' },
        { status: 404 }
      );
    }

    // Criar preferências padrão se não existir
    let preferences = account.accountPreference;
    if (!preferences) {
      preferences = await prisma.accountPreference.create({
        data: {
          businessId: account.businessId,
          accountId: account.id,
          theme: ThemeEnum.LIGHT,
        },
      });
    }

    // Remover senha do retorno
    const { hashPassword, ...accountData } = account;

    return successResponse({
      account: accountData,
      business: account.business,
      preferences,
    });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(meHandler);
