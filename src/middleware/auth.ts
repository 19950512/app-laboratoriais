import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { CacheService } from '@/lib/redis';
import { ContextEnum } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    accountId: string;
    businessId: string;
    email: string;
  };
}

/**
 * Middleware para autenticar requisições
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
    
    // Verificar se o token está em blacklist no cache
    const isBlacklisted = await CacheService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return { success: false, error: 'Token inválido' };
    }

    // Verificar assinatura do JWT
    const payload = JwtService.verifyToken(token);
    
    // Verificar se o token existe no banco e está ativo
    const tokenRecord = await prisma.tokenJwt.findFirst({
      where: {
        token: JwtService.hashToken(token),
        active: true,
        expireIn: {
          gt: new Date(),
        },
        account: {
          active: true,
          business: {
            active: true,
          },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            name: true,
            active: true,
            businessId: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return { success: false, error: 'Token inválido ou expirado' };
    }

    return {
      success: true,
      user: {
        accountId: payload.accountId,
        businessId: payload.businessId,
        email: payload.email,
      },
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Falha na autenticação' };
  }
}

/**
 * Middleware para rate limiting
 */
export async function rateLimit(
  request: NextRequest,
  options: { 
    limit: number; 
    windowSeconds: number; 
    keyGenerator?: (req: NextRequest) => string 
  }
): Promise<{ success: boolean; error?: string; headers?: Record<string, string> }> {
  try {
    const key = options.keyGenerator 
      ? options.keyGenerator(request) 
      : getClientIP(request);
    
    const result = await CacheService.rateLimit(
      `rate_limit:${key}`,
      options.limit,
      options.windowSeconds
    );

    const headers = {
      'X-RateLimit-Limit': options.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    };

    if (!result.allowed) {
      return {
        success: false,
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        headers,
      };
    }

    return { success: true, headers };

  } catch (error) {
    console.error('Rate limit error:', error);
    // Em caso de erro no Redis, permite a requisição
    return { success: true };
  }
}

/**
 * Utilitário para obter IP do cliente
 */
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  
  return xRealIP || remoteAddr || 'unknown';
}

/**
 * Utilitário para obter User-Agent
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Logger de auditoria
 */
export async function logAuditoria(params: {
  businessId: string;
  accountId?: string;
  description: string;
  context: ContextEnum;
  request: NextRequest;
  additionalData?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Validar se businessId é um UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(params.businessId)) {
      console.warn('Invalid businessId for audit log:', params.businessId);
      return; // Não registrar logs com businessId inválido
    }

    const auditData: any = {
      businessId: params.businessId,
      accountId: params.accountId || null,
      description: params.description,
      context: params.context,
      ipAddress: getClientIP(params.request),
      userAgent: getUserAgent(params.request),
    };

    if (params.additionalData) {
      auditData.additionalData = params.additionalData;
    }

    await prisma.auditoria.create({
      data: auditData,
    });
  } catch (error) {
    console.error('Audit log error:', error);
    // Não falhar a operação por causa do log
  }
}

/**
 * Wrapper para tratamento de erros em rotas da API
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (
    request: NextRequest, 
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        // Erros conhecidos
        if (error.message.includes('Token')) {
          return NextResponse.json(
            { error: 'Não autorizado', message: error.message },
            { status: 401 }
          );
        }
        
        if (error.message.includes('Validation')) {
          return NextResponse.json(
            { error: 'Dados inválidos', message: error.message },
            { status: 400 }
          );
        }
      }
      
      // Erro genérico
      return NextResponse.json(
        { error: 'Erro interno do servidor', message: 'Tente novamente mais tarde' },
        { status: 500 }
      );
    }
  };
}

/**
 * Validador de método HTTP
 */
export function validateMethod(request: NextRequest, allowedMethods: string[]): boolean {
  return allowedMethods.includes(request.method);
}

/**
 * Resposta padronizada para método não permitido
 */
export function methodNotAllowed(allowedMethods: string[]): NextResponse {
  return NextResponse.json(
    { error: 'Método não permitido', allowedMethods },
    { 
      status: 405,
      headers: {
        'Allow': allowedMethods.join(', '),
      },
    }
  );
}

/**
 * Resposta padronizada de sucesso
 */
export function successResponse<T>(
  data: T, 
  message?: string, 
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Resposta padronizada de erro
 */
export function errorResponse(
  message: string, 
  status: number = 400, 
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
    },
    { status }
  );
}
