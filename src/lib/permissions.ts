import { prisma } from '@/lib/prisma';

/**
 * Verifica se um usuário tem permissão para acessar uma rota específica
 */
export async function checkRoutePermission(
  accountId: string,
  businessId: string,
  route: string
): Promise<boolean> {
  try {
    // Buscar se o usuário tem algum cargo que permite acesso à rota
    const hasPermission = await prisma.accountRole.findFirst({
      where: {
        accountId,
        businessId,
        role: {
          active: true,
          routeRoles: {
            some: {
              route,
              businessId
            }
          }
        }
      }
    });

    return !!hasPermission;
  } catch (error) {
    console.error('Erro ao verificar permissão de rota:', error);
    return false;
  }
}

/**
 * Busca todas as rotas que um usuário pode acessar
 */
export async function getUserAccessibleRoutes(
  accountId: string,
  businessId: string
): Promise<string[]> {
  try {
    // Buscar o usuário e verificar se é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        businessId: businessId,
        active: true
      }
    });

    if (!account) {
      return [];
    }

    // Donos da empresa têm acesso a todas as rotas
    if (account.isCompanyOwner) {
      return ['/dashboard', '/profile', '/audit-logs', '/business-admin'];
    }

    // Buscar rotas que o usuário pode acessar baseado em seus cargos
    const routePermissions = await prisma.routeRole.findMany({
      where: {
        businessId: businessId,
        role: {
          active: true,
          accountRoles: {
            some: {
              accountId: accountId,
              businessId: businessId
            }
          }
        }
      },
      select: {
        route: true
      }
    });

    const accessibleRoutes = routePermissions.map(rp => rp.route);
    
    // Todo usuário sempre pode acessar o perfil
    if (!accessibleRoutes.includes('/profile')) {
      accessibleRoutes.push('/profile');
    }

    return [...new Set(accessibleRoutes)]; // Remove duplicatas
  } catch (error) {
    console.error('Error getting user accessible routes:', error);
    return ['/profile']; // Retorna pelo menos o perfil em caso de erro
  }
}

/**
 * Busca os cargos de um usuário
 */
export async function getUserRoles(accountId: string, businessId: string) {
  try {
    const userRoles = await prisma.accountRole.findMany({
      where: {
        accountId: accountId,
        businessId: businessId
      },
      include: {
        role: true
      }
    });

    return userRoles
      .map(ur => ur.role)
      .filter(role => role !== null && role.active);
  } catch (error) {
    console.error('Error getting user roles:', error);
    return [];
  }
}
