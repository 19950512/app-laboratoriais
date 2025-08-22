import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { authenticate, validateMethod, methodNotAllowed } from '@/lib/auth';
import { ContextEnum } from '@/types';

// GET - Listar cargos da empresa
export async function GET(request: NextRequest) {
  try {
    // Validar método
    if (!validateMethod(request, ['GET'])) {
      return methodNotAllowed(['GET']);
    }

    // Autenticar usuário
    const authResult = await authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é dono da empresa
    const account = await prisma.account.findFirst({
      where: {
        id: authResult.user.accountId,
        businessId: authResult.user.businessId,
        active: true,
        isCompanyOwner: true
      }
    });

    if (!account) {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas o dono da empresa pode gerenciar cargos.' 
      }, { status: 403 });
    }

    // Buscar cargos da empresa
    const roles = await prisma.role.findMany({
      where: {
        businessId: authResult.user.businessId,
        active: true
      },
      orderBy: {
        name: 'asc'
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

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: authResult.user.businessId,
          accountId: authResult.user.accountId,
          context: ContextEnum.BUSINESS_UPDATE,
          description: 'Visualização de cargos da empresa',
          additionalData: { totalRoles: roles.length }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: { roles }
    });

  } catch (error) {
    console.error('Roles GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cargo
export async function POST(request: NextRequest) {
  try {
    // Validar método
    if (!validateMethod(request, ['POST'])) {
      return methodNotAllowed(['POST']);
    }

    // Autenticar usuário
    const authResult = await authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
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
        error: 'Acesso negado. Apenas o dono da empresa pode criar cargos.' 
      }, { status: 403 });
    }

    // Parse do corpo da requisição
    const body = await request.json();
    const { name, color } = body;

    // Validação básica
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome do cargo é obrigatório (mínimo 2 caracteres)' 
      }, { status: 400 });
    }

    if (!color || !color.match(/^#[0-9A-F]{6}$/i)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cor é obrigatória e deve estar no formato hexadecimal (#FFFFFF)' 
      }, { status: 400 });
    }

    // Verificar se já existe cargo com este nome na empresa
    const existingRole = await prisma.role.findFirst({
      where: {
        businessId: authResult.user.businessId,
        name: name.trim(),
        active: true
      }
    });

    if (existingRole) {
      return NextResponse.json({
        success: false,
        error: 'Já existe um cargo com este nome'
      }, { status: 400 });
    }

    // Criar cargo
    const newRole = await prisma.role.create({
      data: {
        businessId: authResult.user.businessId,
        name: name.trim(),
        color: color.toUpperCase(),
        active: true
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: authResult.user.businessId,
          accountId: authResult.user.accountId,
          context: ContextEnum.ROLE_CREATE,
          description: `Cargo "${newRole.name}" criado`,
          additionalData: { 
            roleId: newRole.id,
            roleName: newRole.name,
            roleColor: newRole.color
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: { role: newRole },
      message: 'Cargo criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Role creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
