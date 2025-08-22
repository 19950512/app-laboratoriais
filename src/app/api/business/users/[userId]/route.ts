import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { JwtService } from '../../../../../lib/jwt';
import { PasswordService } from '../../../../../utils/crypto';
import { validate } from '../../../../../utils/validation';
import { ContextEnum } from '@/types';
import Joi from 'joi';

// Schema para atualização de usuário
const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .optional()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .optional()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
    }),
  active: Joi.boolean()
    .optional(),
  password: Joi.string()
    .min(6)
    .max(128)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
    }),
});

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { userId } = params;

    // Parse do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const validation = validate(updateUserSchema, body);
    if (validation.error) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.details 
      }, { status: 400 });
    }

    const { name, email, active, password } = body;

    // Buscar usuário atual
    const currentUser = await prisma.account.findFirst({
      where: { 
        id: userId,
        businessId: decoded.businessId
      }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não permitir que o próprio usuário se desative
    if (userId === decoded.accountId && active === false) {
      return NextResponse.json({ 
        error: 'Você não pode desativar sua própria conta' 
      }, { status: 400 });
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (name !== undefined && name !== currentUser.name) {
      updateData.name = name;
    }

    if (email !== undefined && email !== currentUser.email) {
      // Verificar se o email já está em uso
      const existingUser = await prisma.account.findFirst({
        where: {
          businessId: decoded.businessId,
          email,
          id: { not: userId },
          active: true
        }
      });

      if (existingUser) {
        return NextResponse.json({ 
          error: 'Este email já está sendo usado por outro usuário' 
        }, { status: 409 });
      }

      updateData.email = email;
    }

    if (active !== undefined && active !== currentUser.active) {
      updateData.active = active;
    }

    if (password && password.trim() !== '') {
      updateData.hashPassword = await PasswordService.hashPassword(password);
    }

    // Se não há dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma alteração detectada',
        data: { 
          user: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            photoProfile: currentUser.photoProfile,
            active: currentUser.active,
            createdAt: currentUser.createdAt,
            updatedAt: currentUser.updatedAt
          }
        }
      });
    }

    // Atualizar usuário
    const updatedUser = await prisma.account.update({
      where: { id: userId },
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
        updatedAt: true
      }
    });

    // Log de auditoria
    try {
      const changedFields: string[] = [];
      if (updateData.name) changedFields.push('nome');
      if (updateData.email) changedFields.push('email');
      if (updateData.active !== undefined) changedFields.push('status');
      if (updateData.hashPassword) changedFields.push('senha');

      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.ACCOUNT_UPDATE,
          description: `Usuário ${currentUser.name} atualizado: ${changedFields.join(', ')}`,
          additionalData: { 
            targetUserId: updatedUser.id,
            targetUserEmail: updatedUser.email,
            fieldsUpdated: changedFields
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { userId } = params;

    // Não permitir que o próprio usuário se delete
    if (userId === decoded.accountId) {
      return NextResponse.json({ 
        error: 'Você não pode deletar sua própria conta' 
      }, { status: 400 });
    }

    // Buscar usuário
    const user = await prisma.account.findFirst({
      where: { 
        id: userId,
        businessId: decoded.businessId
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Desativar usuário (soft delete)
    const updatedUser = await prisma.account.update({
      where: { id: userId },
      data: {
        active: false,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        active: true
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.ACCOUNT_DEACTIVATE,
          description: `Usuário ${user.name} (${user.email}) foi desativado`,
          additionalData: { 
            targetUserId: user.id,
            targetUserEmail: user.email,
            targetUserName: user.name
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário desativado com sucesso',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
