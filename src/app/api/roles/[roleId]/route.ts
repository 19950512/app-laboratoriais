import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/lib/auth';
import { ContextEnum } from '@/types';

// PUT - Editar cargo
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
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
        error: 'Acesso negado. Apenas o dono da empresa pode editar cargos.' 
      }, { status: 403 });
    }

    const { roleId } = await params;
    const body = await request.json();
    const { name, color } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: 'Nome e cor são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o cargo existe e pertence à empresa
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        businessId: authResult.user.businessId,
        active: true
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Cargo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe outro cargo com o mesmo nome
    const duplicateRole = await prisma.role.findFirst({
      where: {
        businessId: authResult.user.businessId,
        name: name.trim(),
        active: true,
        id: {
          not: roleId
        }
      }
    });

    if (duplicateRole) {
      return NextResponse.json({
        error: 'Já existe um cargo com este nome'
      }, { status: 400 });
    }

    // Atualizar cargo
    const updatedRole = await prisma.role.update({
      where: {
        id: roleId
      },
      data: {
        name: name.trim(),
        color: color.toUpperCase(),
        updatedAt: new Date()
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: authResult.user.businessId,
          accountId: authResult.user.accountId,
          context: ContextEnum.ROLE_UPDATE,
          description: `Cargo "${existingRole.name}" editado para "${updatedRole.name}"`,
          additionalData: { 
            roleId: updatedRole.id,
            oldName: existingRole.name,
            newName: updatedRole.name,
            oldColor: existingRole.color,
            newColor: updatedRole.color
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: { role: updatedRole },
      message: 'Cargo editado com sucesso'
    });

  } catch (error) {
    console.error('Role edit error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cargo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
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
        error: 'Acesso negado. Apenas o dono da empresa pode excluir cargos.' 
      }, { status: 403 });
    }

    const { roleId } = await params;

    // Verificar se o cargo existe e pertence à empresa
    const existingRole = await prisma.role.findFirst({
      where: {
        id: roleId,
        businessId: authResult.user.businessId,
        active: true
      },
      include: {
        _count: {
          select: {
            accountRoles: true,
            routeRoles: true
          }
        }
      }
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Cargo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o cargo tem usuários ou permissões associadas
    if (existingRole._count.accountRoles > 0) {
      return NextResponse.json({
        error: 'Não é possível excluir um cargo que possui usuários associados'
      }, { status: 400 });
    }

    if (existingRole._count.routeRoles > 0) {
      return NextResponse.json({
        error: 'Não é possível excluir um cargo que possui permissões de rotas associadas'
      }, { status: 400 });
    }

    // Marcar cargo como inativo (soft delete)
    await prisma.role.update({
      where: {
        id: roleId
      },
      data: {
        active: false,
        updatedAt: new Date()
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: authResult.user.businessId,
          accountId: authResult.user.accountId,
          context: ContextEnum.ROLE_DELETE,
          description: `Cargo "${existingRole.name}" excluído`,
          additionalData: { 
            roleId: existingRole.id,
            roleName: existingRole.name
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cargo excluído com sucesso'
    });

  } catch (error) {
    console.error('Role delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
