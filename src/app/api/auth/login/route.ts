import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/lib/jwt';
import { PasswordService } from '@/utils/crypto';
import { validate, loginSchema } from '@/utils/validation';
import { withErrorHandler, validateMethod, methodNotAllowed, successResponse, errorResponse, rateLimit, logAuditoria } from '@/middleware/auth';
import { ContextEnum, ThemeEnum } from '@/types';

async function loginHandler(request: NextRequest): Promise<NextResponse> {
  // Validar método
  if (!validateMethod(request, ['POST'])) {
    return methodNotAllowed(['POST']);
  }

  // Rate limiting - 5 tentativas por minuto por IP
  const rateLimitResult = await rateLimit(request, {
    limit: 5,
    windowSeconds: 60,
  });

  if (!rateLimitResult.success) {
    return errorResponse(rateLimitResult.error!, 429);
  }

  const body = await request.json();
  
  // Validar dados de entrada
  const validation = validate(loginSchema, body);
  if (validation.error) {
    return errorResponse('Dados inválidos', 400, validation.error.details);
  }

  const { email, password } = validation.data;

  try {
    // Buscar usuário
    const account = await prisma.account.findFirst({
      where: {
        email: email.toLowerCase(),
        active: true,
        business: {
          active: true,
        },
      },
      include: {
        business: true,
        accountPreference: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordValid = await PasswordService.verifyPassword(password, account.hashPassword);
    
    if (!passwordValid) {
      // Log de tentativa de login com senha incorreta
      await logAuditoria({
        businessId: account.businessId,
        accountId: account.id,
        description: `Tentativa de login com senha incorreta para: ${email}`,
        context: ContextEnum.AUTH_DENY,
        request,
        additionalData: { email },
      });

      return errorResponse('Email ou senha incorretos', 401);
    }

    // Gerar token JWT
    const token = JwtService.generateToken({
      accountId: account.id,
      businessId: account.businessId,
      email: account.email,
    });

    const tokenExpiration = JwtService.getTokenExpiration(token);
    
    if (!tokenExpiration) {
      throw new Error('Failed to get token expiration');
    }

    // Salvar token no banco
    await prisma.tokenJwt.create({
      data: {
        businessId: account.businessId,
        accountId: account.id,
        token: JwtService.hashToken(token),
        expireIn: tokenExpiration,
        active: true,
      },
    });

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

    // Log de login bem-sucedido
    await logAuditoria({
      businessId: account.businessId,
      accountId: account.id,
      description: `Login realizado com sucesso`,
      context: ContextEnum.AUTH_LOGIN,
      request,
      additionalData: {
        email: account.email,
        name: account.name,
      },
    });

    // Remover senha do retorno
    const { hashPassword, ...accountData } = account;

    return successResponse({
      token,
      account: accountData,
      business: account.business,
      preferences,
    }, 'Login realizado com sucesso');

  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Erro interno do servidor', 500);
  }
}

export const POST = withErrorHandler(loginHandler);
