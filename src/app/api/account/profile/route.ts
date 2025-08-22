import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { JwtService } from '../../../../lib/jwt';
import { PasswordService } from '../../../../utils/crypto';
import { validate, updateAccountSchema } from '../../../../utils/validation';
import { ContextEnum } from '@/types';

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
    
    // Validar dados
    const validation = validate(updateAccountSchema, body);
    if (validation.error) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.details 
      }, { status: 400 });
    }

    const { name, email, photoProfile, currentPassword, newPassword } = body;

    // Buscar conta atual
    const currentAccount = await prisma.account.findFirst({
      where: { 
        id: decoded.accountId,
        active: true 
      }
    });

    if (!currentAccount) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {};

    // Atualizar informações básicas se fornecidas
    if (name && name !== currentAccount.name) {
      updateData.name = name;
    }

    if (email && email !== currentAccount.email) {
      // Verificar se o email já está em uso
      const existingAccount = await prisma.account.findFirst({
        where: {
          email,
          id: { not: decoded.accountId },
          active: true
        }
      });

      if (existingAccount) {
        return NextResponse.json({ 
          error: 'Este email já está sendo usado por outra conta' 
        }, { status: 409 });
      }

      updateData.email = email;
    }

    if (photoProfile !== undefined) {
      updateData.photoProfile = photoProfile || null;
    }

    // Atualizar senha se fornecida
    if (currentPassword && newPassword) {
      // Verificar senha atual
      const isCurrentPasswordValid = await PasswordService.verifyPassword(
        currentPassword, 
        currentAccount.hashPassword
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json({ 
          error: 'Senha atual incorreta' 
        }, { status: 400 });
      }

      // Validar nova senha
      if (newPassword.length < 6) {
        return NextResponse.json({ 
          error: 'A nova senha deve ter pelo menos 6 caracteres' 
        }, { status: 400 });
      }

      // Hash da nova senha
      updateData.hashPassword = await PasswordService.hashPassword(newPassword);
    }

    // Se não há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma alteração detectada',
        data: { account: currentAccount }
      });
    }

    // Atualizar conta
    const updatedAccount = await prisma.account.update({
      where: { id: decoded.accountId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        photoProfile: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        businessId: true
      }
    });

    // Log de auditoria
    try {
      const auditDescription: string[] = [];
      if (updateData.name) auditDescription.push('nome');
      if (updateData.email) auditDescription.push('email');
      if (updateData.photoProfile !== undefined) auditDescription.push('foto');
      if (updateData.hashPassword) auditDescription.push('senha');

      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.PROFILE_UPDATE,
          description: `Perfil atualizado: ${auditDescription.join(', ')}`,
          additionalData: { 
            accountId: updatedAccount.id,
            fieldsUpdated: auditDescription
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        account: updatedAccount
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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

    // Buscar informações do perfil
    const account = await prisma.account.findFirst({
      where: { 
        id: decoded.accountId,
        active: true 
      },
      select: {
        id: true,
        name: true,
        email: true,
        photoProfile: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        businessId: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { account }
    });

  } catch (error) {
    console.error('Profile get error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
