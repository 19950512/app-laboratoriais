import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/lib/jwt';

// Rotas que não precisam de autenticação
const PUBLIC_ROUTES = ['/auth/login', '/auth/create'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar token de autenticação
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    await JwtService.verifyToken(token);
    // Se tem token válido, permitir acesso
    // A verificação de permissões específicas é feita nas páginas
    return NextResponse.next();

  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};