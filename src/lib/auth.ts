import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { ContextEnum } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    accountId: string;
    businessId: string;
    email: string;
  };
}

/**
 * Middleware para autenticar requisições nas APIs
 */
export async function authenticate(request: NextRequest): Promise<{ 
  success: boolean; 
  user?: AuthenticatedRequest['user']; 
  error?: string 
}> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { success: false, error: 'Token não fornecido' };
    }

    const token = authHeader.substring(7);
    
    // Verificar assinatura do JWT
    await JwtService.verifyToken(token);
    
    // Verificar se o token existe no banco e está ativo
    const tokenRecord = await prisma.tokenJwt.findFirst({
      where: {
        token: await JwtService.hashToken(token),
        active: true,
        expireIn: {
          gt: new Date(),
        },
        account: {
          active: true,
        },
      },
      include: {
        account: true,
      },
    });

    if (!tokenRecord) {
      return { success: false, error: 'Token inválido ou expirado' };
    }

    return {
      success: true,
      user: {
        accountId: tokenRecord.account.id,
        businessId: tokenRecord.account.businessId,
        email: tokenRecord.account.email
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Erro de autenticação' };
  }
}

/**
 * Middleware para validar se usuário é dono da empresa
 */
export async function requireOwner(request: NextRequest): Promise<{ 
  success: boolean; 
  user?: AuthenticatedRequest['user']; 
  error?: string 
}> {
  const authResult = await authenticate(request);
  
  if (!authResult.success) {
    return authResult;
  }

  try {
    const account = await prisma.account.findFirst({
      where: {
        id: authResult.user!.accountId,
        businessId: authResult.user!.businessId,
        active: true
      }
    });

    if (!account?.isCompanyOwner) {
      return { success: false, error: 'Acesso negado - apenas donos da empresa' };
    }

    return authResult;
  } catch (error) {
    console.error('Owner validation error:', error);
    return { success: false, error: 'Erro na validação de permissões' };
  }
}

/**
 * Funções utilitárias para APIs
 */
export function successResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    message,
    data
  });
}

export function errorResponse(error: string, status: number = 400) {
  return NextResponse.json({
    success: false,
    error
  }, { status });
}

export function methodNotAllowed(allowedMethods: string[]) {
  return NextResponse.json({
    success: false,
    error: `Método não permitido. Métodos aceitos: ${allowedMethods.join(', ')}`
  }, { 
    status: 405,
    headers: {
      'Allow': allowedMethods.join(', ')
    }
  });
}

export function validateMethod(request: NextRequest, allowedMethods: string[]) {
  return allowedMethods.includes(request.method);
}

export function withErrorHandler(handler: (request: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      return errorResponse('Erro interno do servidor', 500);
    }
  };
}

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  request: NextRequest, 
  options: RateLimitOptions = { limit: 10, windowSeconds: 60 }
): Promise<{ success: boolean; error?: string }> {
  // Em desenvolvimento, ser mais permissivo
  const isDevelopment = process.env.NODE_ENV === 'development';
  const limit = isDevelopment ? options.limit * 10 : options.limit; // 10x mais permissivo em dev
  
  // Obter IP do cliente
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  
  const existing = rateLimitStore.get(key);
  
  if (existing) {
    if (now < existing.resetTime) {
      if (existing.count >= limit) {
        return {
          success: false,
          error: `Rate limit exceeded. Try again in ${Math.ceil((existing.resetTime - now) / 1000)} seconds.`
        };
      }
      existing.count++;
    } else {
      // Janela expirou, resetar
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    }
  } else {
    // Primeira requisição
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
  }
  
  // Limpar entradas antigas periodicamente (cleanup simples)
  if (Math.random() < 0.01) { // 1% de chance
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return { success: true };
}

export async function logAuditoria(
  businessId: string,
  accountId: string | null,
  context: ContextEnum,
  description: string,
  ipAddress?: string,
  userAgent?: string,
  additionalData?: any
) {
  try {
    await prisma.auditoria.create({
      data: {
        businessId,
        accountId,
        context,
        description,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        additionalData: additionalData || null
      }
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}
