import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { JwtService } from '../../../lib/jwt';
import { ContextEnum } from '@/types';

export async function GET(request: NextRequest) {
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

    // Buscar informações da empresa
    const business = await prisma.business.findFirst({
      where: {
        id: decoded.businessId,
        active: true
      },
      select: {
        id: true,
        name: true,
        document: true,
        logo: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: {
              where: { active: true }
            }
          }
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.BUSINESS_UPDATE,
          description: 'Visualização de dados da empresa',
          additionalData: { businessId: business.id }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        business: {
          ...business,
          totalUsers: business._count.accounts
        }
      }
    });

  } catch (error) {
    console.error('Business API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Parse do corpo da requisição
    const body = await request.json();
    const { name } = body;

    // Validação básica
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nome da empresa é obrigatório (mínimo 2 caracteres)' 
      }, { status: 400 });
    }

    // Verificar se a empresa existe e pertence ao usuário
    const existingBusiness = await prisma.business.findFirst({
      where: {
        id: decoded.businessId,
        active: true
      }
    });

    if (!existingBusiness) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Atualizar dados da empresa
    const updatedBusiness = await prisma.business.update({
      where: {
        id: decoded.businessId
      },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        document: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.BUSINESS_UPDATE,
          description: `Empresa atualizada: ${existingBusiness.name} → ${name.trim()}`,
          additionalData: { 
            oldName: existingBusiness.name,
            newName: name.trim()
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: {
        business: updatedBusiness
      }
    });

  } catch (error) {
    console.error('Business update error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
