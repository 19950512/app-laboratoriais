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
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Extrair parâmetros de query
    const url = new URL(request.url);
    const contexts = url.searchParams.get('contexts')?.split(',').filter(Boolean) || [];
    const accounts = url.searchParams.get('accounts')?.split(',').filter(Boolean) || [];
    const businesses = url.searchParams.get('businesses')?.split(',').filter(Boolean) || [];
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Construir filtros
    const where: any = {
      businessId: decoded.businessId // Sempre filtrar pela empresa do usuário logado
    };

    if (contexts.length > 0) {
      where.context = { in: contexts };
    }

    if (accounts.length > 0) {
      where.accountId = { in: accounts };
    }

    if (businesses.length > 0) {
      where.businessId = { in: businesses.filter(id => id === decoded.businessId) }; // Só permitir sua própria empresa
    }

    if (startDate) {
      where.moment = { ...where.moment, gte: new Date(startDate) };
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // Incluir todo o dia
      where.moment = { ...where.moment, lte: endDateTime };
    }

    // Buscar logs com paginação
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        orderBy: {
          moment: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          business: {
            select: {
              id: true,
              name: true
            }
          },
          account: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditoria.count({ where })
    ]);

    // Não registrar log de auditoria para visualização de logs (evita recursão infinita)

    return NextResponse.json({
      success: true,
      data: {
        logs: auditLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// API para buscar dados para os filtros
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

    // Buscar dados para os filtros
    const [accounts, contexts] = await Promise.all([
      // Buscar contas da empresa
      prisma.account.findMany({
        where: {
          businessId: decoded.businessId,
          active: true
        },
        select: {
          id: true,
          name: true,
          email: true
        },
        orderBy: {
          name: 'asc'
        }
      }),
      // Buscar contextos únicos nos logs da empresa
      prisma.auditoria.findMany({
        where: {
          businessId: decoded.businessId
        },
        select: {
          context: true
        },
        distinct: ['context'],
        orderBy: {
          context: 'asc'
        }
      })
    ]);

    // Buscar empresa atual
    const business = await prisma.business.findUnique({
      where: {
        id: decoded.businessId
      },
      select: {
        id: true,
        name: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        contexts: contexts.map(c => c.context),
        businesses: business ? [business] : [],
        allContexts: Object.values(ContextEnum)
      }
    });

  } catch (error) {
    console.error('Audit filters API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
