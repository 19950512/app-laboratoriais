import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/lib/jwt';
import { CacheService } from '@/lib/redis';
import { withErrorHandler, validateMethod, methodNotAllowed, successResponse, authenticate, logAuditoria } from '@/lib/auth';
import { ContextEnum } from '@/types';

async function logoutHandler(request: NextRequest): Promise<NextResponse> {
  // Validar método
  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  // Autenticar usuário
  const authResult = await authenticate(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 }
    );
  }

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.substring(7);

  if (!token) {
    return NextResponse.json(
      { error: 'Token não fornecido' },
      { status: 400 }
    );
  }

  try {
    // Desativar token no banco
    await prisma.tokenJwt.updateMany({
      where: {
        token: await JwtService.hashToken(token),
        accountId: authResult.user.accountId,
        active: true,
      },
      data: {
        active: false,
      },
    });

    // Adicionar token à blacklist no cache
    await CacheService.set(
      `blacklist:${token}`,
      true,
      JwtService.getTimeUntilExpiration(token)
    );

    // Log de logout
    await logAuditoria(
      authResult.user.businessId,
      authResult.user.accountId,
      ContextEnum.AUTH_LOGOUT,
      'Logout realizado',
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    return successResponse(null, 'Logout realizado com sucesso');

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(logoutHandler);
