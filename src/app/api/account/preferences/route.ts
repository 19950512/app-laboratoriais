import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { JwtService } from '../../../../lib/jwt';
import { validate, updatePreferencesSchema } from '../../../../utils/validation';

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

    // Buscar preferências do usuário
    const preferences = await prisma.accountPreference.findUnique({
      where: {
        businessId_accountId: {
          businessId: decoded.businessId,
          accountId: decoded.accountId
        }
      },
      select: {
        theme: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Se não existir, criar com valores padrão
    if (!preferences) {
      const newPreferences = await prisma.accountPreference.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          theme: 'light'
        },
        select: {
          theme: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        success: true,
        data: { preferences: newPreferences }
      });
    }

    return NextResponse.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
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
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Parse do corpo da requisição
    const body = await request.json();
    
    // Validar dados
    const validation = validate(updatePreferencesSchema, body);
    if (validation.error) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.error.details 
      }, { status: 400 });
    }

    const { theme } = body;

    // Buscar preferências atuais
    const currentPreferences = await prisma.accountPreference.findUnique({
      where: {
        businessId_accountId: {
          businessId: decoded.businessId,
          accountId: decoded.accountId
        }
      }
    });

    let updatedPreferences;

    if (currentPreferences) {
      // Atualizar preferências existentes
      updatedPreferences = await prisma.accountPreference.update({
        where: {
          businessId_accountId: {
            businessId: decoded.businessId,
            accountId: decoded.accountId
          }
        },
        data: {
          theme,
          updatedAt: new Date()
        },
        select: {
          theme: true,
          createdAt: true,
          updatedAt: true
        }
      });
    } else {
      // Criar novas preferências
      updatedPreferences = await prisma.accountPreference.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          theme
        },
        select: {
          theme: true,
          createdAt: true,
          updatedAt: true
        }
      });
    }

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: 'theme_change',
          description: `Tema alterado para: ${theme}`,
          additionalData: { 
            previousTheme: currentPreferences?.theme || null,
            newTheme: theme
          }
        }
      });
    } catch (auditError) {
      console.error('Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      data: {
        preferences: updatedPreferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
