import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { JwtService } from '../../../../lib/jwt';
import { PasswordService } from '../../../../utils/crypto';
import { validate } from '../../../../utils/validation';
import { ContextEnum } from '@/types';
import Joi from 'joi';

// Schema para criação de usuário
const createUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
      'any.required': 'Nome é obrigatório',
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Email deve ter um formato válido',
      'string.max': 'Email deve ter no máximo 255 caracteres',
      'any.required': 'Email é obrigatório',
    }),
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
      'any.required': 'Senha é obrigatória',
    }),
});

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
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.max': 'Senha deve ter no máximo 128 caracteres',
    }),
});

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
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Buscar usuários da empresa
    const users = await prisma.account.findMany({
      where: {
        businessId: decoded.businessId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        photoProfile: true,
        active: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const validation = validate(createUserSchema, body);
    if (validation.error) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.details 
      }, { status: 400 });
    }

    const { name, email, password } = body;

    // Verificar se o email já está em uso na empresa
    const existingUser = await prisma.account.findFirst({
      where: {
        businessId: decoded.businessId,
        email,
        active: true
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Este email já está sendo usado por outro usuário' 
      }, { status: 409 });
    }

    // Hash da senha
    const hashPassword = await PasswordService.hashPassword(password);

    // Criar usuário
    const newUser = await prisma.account.create({
      data: {
        businessId: decoded.businessId,
        name,
        email,
        hashPassword,
        active: true
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

    // Criar preferências padrão para o usuário
    await prisma.accountPreference.create({
      data: {
        businessId: decoded.businessId,
        accountId: newUser.id,
        theme: 'light'
      }
    });

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.ACCOUNT_CREATE,
          description: `Usuário criado: ${name} (${email})`,
          additionalData: { 
            newUserId: newUser.id,
            newUserEmail: email,
            newUserName: name
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: newUser
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
