import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { JwtService } from '../../../../lib/jwt';
import { validate } from '../../../../utils/validation';
import Joi from 'joi';

// Schema para atualização da empresa
const updateBusinessSchema = Joi.object({
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
  document: Joi.string()
    .pattern(/^(\d{11}|\d{14})$/)
    .required()
    .messages({
      'string.pattern.base': 'Documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos)',
      'any.required': 'Documento é obrigatório',
    }),
  logo: Joi.string()
    .max(500)
    .optional()
    .allow('', null)
    .messages({
      'string.max': 'Caminho do logo deve ter no máximo 500 caracteres',
    }),
});

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
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Parse do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const validation = validate(updateBusinessSchema, body);
    if (validation.error) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.details 
      }, { status: 400 });
    }

    const { name, document, logo } = body;

    // Buscar empresa atual
    const currentBusiness = await prisma.business.findFirst({
      where: { 
        id: decoded.businessId,
        active: true 
      }
    });

    if (!currentBusiness) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Verificar se o documento já está em uso por outra empresa
    if (document !== currentBusiness.document) {
      const existingBusiness = await prisma.business.findFirst({
        where: {
          document,
          id: { not: decoded.businessId },
          active: true
        }
      });

      if (existingBusiness) {
        return NextResponse.json({ 
          error: 'Este documento já está sendo usado por outra empresa' 
        }, { status: 409 });
      }
    }

    // Atualizar empresa
    const updatedBusiness = await prisma.business.update({
      where: { id: decoded.businessId },
      data: {
        name,
        document,
        logo: logo || null,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        document: true,
        logo: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log de auditoria
    try {
      const changedFields: string[] = [];
      if (name !== currentBusiness.name) changedFields.push('nome');
      if (document !== currentBusiness.document) changedFields.push('documento');
      if (logo !== currentBusiness.logo) changedFields.push('logo');

      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: 'business_update',
          description: `Dados da empresa atualizados: ${changedFields.join(', ')}`,
          additionalData: { 
            businessId: updatedBusiness.id,
            fieldsUpdated: changedFields,
            previousData: {
              name: currentBusiness.name,
              document: currentBusiness.document,
              logo: currentBusiness.logo
            },
            newData: {
              name: updatedBusiness.name,
              document: updatedBusiness.document,
              logo: updatedBusiness.logo
            }
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Empresa atualizada com sucesso',
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
