import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/lib/jwt';
import { ContextEnum } from '@/types';

// GET - Listar cargos de um usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = await JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { userId } = params;

    // Verificar se o usuário existe na mesma empresa
    const targetUser = await prisma.account.findFirst({
      where: {
        id: userId,
        businessId: decoded.businessId,
        active: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    // Buscar cargos do usuário
    const userRoles = await prisma.accountRole.findMany({
      where: {
        accountId: userId,
        businessId: decoded.businessId
      },
      include: {
        role: true
      }
    });

    const roles = userRoles
      .map(ur => ur.role)
      .filter(role => role !== null && role.active);

    return NextResponse.json({
      success: true,
      data: { 
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        },
        roles 
      }
    });

  } catch (error) {
    console.error('User roles GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Atribuir cargo a um usuário
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = await JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se o usuário é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: decoded.accountId,
        businessId: decoded.businessId,
        active: true
      }
    });

    if (!account || !account.isCompanyOwner) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o dono da empresa pode atribuir cargos.' 
      }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ 
        error: 'ID do cargo é obrigatório' 
      }, { status: 400 });
    }

    // Verificar se o usuário existe na mesma empresa
    const targetUser = await prisma.account.findFirst({
      where: {
        id: userId,
        businessId: decoded.businessId,
        active: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'Usuário não encontrado' 
      }, { status: 404 });
    }

    // Verificar se o cargo existe na mesma empresa
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        businessId: decoded.businessId,
        active: true
      }
    });

    if (!role) {
      return NextResponse.json({ 
        error: 'Cargo não encontrado' 
      }, { status: 404 });
    }

    // Verificar se o usuário já possui este cargo
    const existingAssignment = await prisma.accountRole.findFirst({
      where: {
        accountId: userId,
        roleId: roleId,
        businessId: decoded.businessId
      }
    });

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'Usuário já possui este cargo' 
      }, { status: 400 });
    }

    // Atribuir cargo ao usuário
    const newAssignment = await prisma.accountRole.create({
      data: {
        businessId: decoded.businessId,
        accountId: userId,
        roleId: roleId
      },
      include: {
        role: true,
        account: {
          select: { name: true, email: true }
        }
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.ACCOUNT_ROLE_ADD,
          description: `Cargo "${role.name}" atribuído ao usuário "${targetUser.name}"`,
          additionalData: { 
            targetUserId: userId,
            targetUserName: targetUser.name,
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
      data: { assignment: newAssignment },
      message: 'Cargo atribuído com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Role assignment error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover cargo de um usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = await JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se o usuário é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: decoded.accountId,
        businessId: decoded.businessId,
        active: true
      }
    });

    if (!account || !account.isCompanyOwner) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o dono da empresa pode remover cargos.' 
      }, { status: 403 });
    }

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('roleId');

    if (!roleId) {
      return NextResponse.json({ 
        error: 'ID do cargo é obrigatório' 
      }, { status: 400 });
    }

    // Buscar a atribuição
    const assignment = await prisma.accountRole.findFirst({
      where: {
        accountId: userId,
        roleId: roleId,
        businessId: decoded.businessId
      },
      include: {
        role: true,
        account: {
          select: { name: true, email: true }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ 
        error: 'Atribuição de cargo não encontrada' 
      }, { status: 404 });
    }

    // Remover atribuição
    await prisma.accountRole.delete({
      where: {
        businessId_accountId_roleId: {
          businessId: decoded.businessId,
          accountId: userId,
          roleId: roleId
        }
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.ACCOUNT_ROLE_REMOVE,
          description: `Cargo "${assignment.role.name}" removido do usuário "${assignment.account.name}"`,
          additionalData: { 
            targetUserId: userId,
            targetUserName: assignment.account.name,
            roleId: roleId,
            roleName: assignment.role.name
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Cargo removido com sucesso'
    });

  } catch (error) {
    console.error('Role removal error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
