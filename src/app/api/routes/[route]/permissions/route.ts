import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContextEnum } from '@/types';
import { authenticate } from '@/lib/auth';

// GET - Listar permissões de uma rota específica
export async function GET(
  request: NextRequest,
  { params }: { params: { route: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

        // Buscar os dados completos do usuário para verificar se é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: authResult.user.accountId,
        businessId: authResult.user.businessId,
        active: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        businessId: true,
        isCompanyOwner: true,
        active: true
      }
    });

    if (!account || !account.isCompanyOwner) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o dono da empresa pode gerenciar permissões de rotas.' 
      }, { status: 403 });
    }

    const { route } = await params;
    const decodedRoute = decodeURIComponent(route);

    // Buscar permissões da rota
    const routePermissions = await prisma.routeRole.findMany({
      where: {
        businessId: authResult.user.businessId,
        route: decodedRoute
      },
      include: {
        role: true
      }
    });

    const roles = routePermissions
      .map((rp: any) => rp.role)
      .filter((role: any) => role !== null && role.active);

    return NextResponse.json({
      success: true,
      data: { 
        route: decodedRoute,
        roles 
      }
    });

  } catch (error) {
    console.error('Route permissions GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar permissão de cargo para uma rota
export async function POST(
  request: NextRequest,
  { params }: { params: { route: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Buscar os dados completos do usuário para verificar se é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: authResult.user.accountId,
        businessId: authResult.user.businessId,
        active: true
      }
    });

    if (!account || !account.isCompanyOwner) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o dono da empresa pode definir permissões de rotas.' 
      }, { status: 403 });
    }

    const { route } = await params;
    const decodedRoute = decodeURIComponent(route);
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ 
        error: 'ID do cargo é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se o cargo existe na mesma empresa
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        businessId: authResult.user.businessId,
        active: true
      }
    });

    if (!role) {
      return NextResponse.json({ 
        error: 'Cargo não encontrado' 
      }, { status: 404 });
    }

    // Verificar se já existe permissão para esta rota e cargo
    const existingPermission = await prisma.routeRole.findFirst({
      where: {
        businessId: authResult.user.businessId,
        route: decodedRoute,
        roleId: roleId
      }
    });

    if (existingPermission) {
      return NextResponse.json({ 
        error: 'Este cargo já tem permissão para acessar esta rota' 
      }, { status: 400 });
    }

    // Criar permissão
    const newPermission = await prisma.routeRole.create({
      data: {
        businessId: authResult.user.businessId,
        route: decodedRoute,
        roleId: roleId
      },
      include: {
        role: true
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: authResult.user.businessId,
          accountId: authResult.user.accountId,
          context: ContextEnum.BUSINESS_UPDATE,
          description: `Permissão criada: cargo "${role.name}" pode acessar rota "${decodedRoute}"`,
          additionalData: { 
            route: decodedRoute,
            roleId: roleId,
            roleName: role.name
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: { permission: newPermission },
      message: 'Permissão criada com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Route permission creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover permissão de uma rota específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: { route: string } }
) {
  try {
    // Verificar autenticação
    const authResult = await authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se o usuário é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: authResult.user.accountId,
        businessId: authResult.user.businessId,
        active: true
      }
    });

    if (!account || !account.isCompanyOwner) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o dono da empresa pode remover permissões de rotas.' 
      }, { status: 403 });
    }

    const { route } = await params;
    const decodedRoute = decodeURIComponent(route);
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ 
        error: 'ID do cargo é obrigatório' 
      }, { status: 400 });
    }

    // Buscar a permissão
    const permission = await prisma.routeRole.findFirst({
      where: {
        businessId: authResult.user.businessId,
        route: decodedRoute,
        roleId: roleId
      },
      include: {
        role: true
      }
    });

    if (!permission) {
      return NextResponse.json({ 
        error: 'Permissão não encontrada' 
      }, { status: 404 });
    }

    // Remover permissão
    await prisma.routeRole.delete({
      where: {
        id: permission.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Permissão removida com sucesso'
    });

  } catch (error) {
    console.error('Route permission removal error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
