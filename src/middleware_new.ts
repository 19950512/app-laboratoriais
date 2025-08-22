import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/jwt';

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/create',
  '/',
  '/api/auth/login',
  '/api/auth/register'
];

// Rotas que precisam apenas de autenticação, mas não de verificação de cargo
const AUTH_ONLY_ROUTES = [
  '/profile',
  '/access-denied',
  '/api/account/profile',
  '/api/account/preferences',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/routes'
];

// Rotas que são exclusivas do dono da empresa
const OWNER_ONLY_ROUTES = [
  '/business-admin',
  '/api/business/update',
  '/api/business/users',
  '/api/roles',
  '/api/users'
];

/**
 * Função simplificada de autenticação para middleware
 * Só verifica a validade do JWT, sem consultar Redis ou banco
 */
async function simpleAuthenticate(request: NextRequest): Promise<{ 
  success: boolean; 
  user?: { accountId: string; businessId: string; email: string }; 
  error?: string 
}> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { success: false, error: 'Token não fornecido' };
    }

    const token = authHeader.substring(7);
    
    // Verificar apenas a assinatura do JWT
    const payload = JwtService.verifyToken(token);
    
    return {
      success: true,
      user: {
        accountId: payload.accountId,
        businessId: payload.businessId,
        email: payload.email
      }
    };
  } catch (error) {
    return { success: false, error: 'Token inválido' };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar arquivos estáticos, API do Next.js, etc.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Verificar se é uma rota pública
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Tentar autenticar o usuário
  const authResult = await simpleAuthenticate(request);
  
  if (!authResult.success) {
    // Se não autenticado, redirecionar para login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Para rotas que precisam apenas de autenticação
  if (AUTH_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Para rotas de dono da empresa, apenas verificar autenticação
  // A verificação detalhada será feita nas APIs individuais
  if (OWNER_ONLY_ROUTES.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Para outras rotas protegidas, permitir acesso
  // A verificação de permissões será feita nas APIs individuais
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
