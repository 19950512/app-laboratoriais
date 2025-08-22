import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/lib/jwt';

export async function GET(req: NextRequest) {
  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);

    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Authorization header missing or invalid');
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;

    try {
      decoded = await JwtService.verifyToken(token);
      console.log('Decoded token:', decoded);
    } catch (error) {
      console.log('Token verification failed:', error);
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Testar acesso ao modelo `bankAccount`
    const testAccess = await prisma.$queryRaw`SELECT 1`;
    console.log('Teste de acesso ao banco de dados:', testAccess);

    try {
      const bankAccounts = await prisma.bankAccount.findMany({
        where: {
          businessId: decoded.businessId
        }
      });
      console.log('Bank accounts retrieved:', bankAccounts);
      return NextResponse.json(bankAccounts, { status: 200 });
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      return NextResponse.json({ error: 'Erro ao buscar contas bancárias' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro interno do servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
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

    const body = await req.json();
    const { nameAccountBank, bankName, certificatePublic, certificatePrivate, clientId, secretId } = body;

    if (!nameAccountBank || !bankName || !certificatePublic || !certificatePrivate || !clientId || !secretId) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    try {
      const newBankAccount = await prisma.bankAccount.create({
        data: {
          nameAccountBank,
          bankName,
          certificatePublic,
          certificatePrivate,
          clientId,
          secretId,
          businessId: decoded.businessId,
        },
      });

      return NextResponse.json(newBankAccount, { status: 201 });
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error);
      return NextResponse.json({ error: 'Erro ao criar conta bancária' }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro interno do servidor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
