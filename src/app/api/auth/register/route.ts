import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { ContextEnum } from '@/types';

async function registerHandler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { success: false, error: 'Método não permitido' },
      { status: 405 }
    );
  }

  try {
    const body = await request.json();
    
    // Validações básicas
    if (!body.businessName || !body.businessDocument || !body.name || !body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (body.password !== body.confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Senhas não coincidem' },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se já existe empresa com este documento
    const existingBusiness = await prisma.business.findFirst({
      where: { document: body.businessDocument }
    });

    if (existingBusiness) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma empresa com este documento' },
        { status: 400 }
      );
    }

    // Verificar se já existe usuário com este email
    const existingAccount = await prisma.account.findFirst({
      where: { email: body.email }
    });

    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Já existe um usuário com este email' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Criar empresa e conta
    const result = await prisma.$transaction(async (tx) => {
      // Criar empresa
      const business = await tx.business.create({
        data: {
          name: body.businessName,
          document: body.businessDocument,
          active: true,
        },
      });

      // Criar conta
      const account = await tx.account.create({
        data: {
          businessId: business.id,
          email: body.email,
          name: body.name,
          hashPassword: hashedPassword,
          isCompanyOwner: true, // Primeiro usuário é sempre o dono da empresa
          active: true,
        },
      });

      // Criar preferências padrão
      const preferences = await tx.accountPreference.create({
        data: {
          businessId: business.id,
          accountId: account.id,
          theme: 'light',
        },
      });

      // Log de auditoria para criação da empresa
      await tx.auditoria.create({
        data: {
          businessId: business.id,
          accountId: account.id,
          context: ContextEnum.BUSINESS_CREATE,
          description: `Empresa "${business.name}" criada durante registro`,
          additionalData: {
            businessName: business.name,
            businessDocument: business.document,
            createdByAccount: account.email
          }
        }
      });

      // Log de auditoria para criação da conta
      await tx.auditoria.create({
        data: {
          businessId: business.id,
          accountId: account.id,
          context: ContextEnum.ACCOUNT_CREATE,
          description: `Conta "${account.name}" criada para empresa "${business.name}"`,
          additionalData: {
            accountName: account.name,
            accountEmail: account.email,
            businessName: business.name
          }
        }
      });

      return { business, account, preferences };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Conta criada com sucesso! Faça login para continuar.',
        data: {
          business: result.business,
          account: {
            id: result.account.id,
            email: result.account.email,
            name: result.account.name,
          },
          preferences: result.preferences,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export const POST = registerHandler;
