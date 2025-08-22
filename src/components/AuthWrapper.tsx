import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { JwtService } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

interface AuthWrapperProps {
  children: React.ReactNode;
  requiredRoute?: string;
  allowOwnerOnly?: boolean;
}

export async function AuthWrapper({ 
  children, 
  requiredRoute,
  allowOwnerOnly = false 
}: AuthWrapperProps) {
  // Verificar token
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/auth/login');
  }

  try {
    const payload = await JwtService.verifyToken(token);
    if (!payload) {
      redirect('/auth/login');
    }

    const { accountId, businessId } = payload;

    // Buscar dados do usuário
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        businessId: businessId,
        active: true
      }
    });

    if (!account) {
      redirect('/auth/login');
    }

    // Se allowOwnerOnly está habilitado, só donos podem acessar
    if (allowOwnerOnly && !account.isCompanyOwner) {
      redirect('/access-denied');
    }

    // Se não especificou rota requerida, permitir acesso
    if (!requiredRoute) {
      return <>{children}</>;
    }

    // Donos sempre têm acesso
    if (account.isCompanyOwner) {
      return <>{children}</>;
    }

    // Verificar se tem permissão para a rota específica
    const hasPermission = await prisma.accountRole.findFirst({
      where: {
        accountId,
        businessId,
        role: {
          active: true,
          routeRoles: {
            some: {
              route: requiredRoute,
              businessId
            }
          }
        }
      }
    });

    if (!hasPermission) {
      redirect('/access-denied');
    }

    return <>{children}</>;

  } catch (error) {
    console.error('AuthWrapper error:', error);
    redirect('/auth/login');
  }
}
