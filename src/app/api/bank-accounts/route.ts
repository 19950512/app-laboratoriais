import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JwtService } from '@/lib/jwt';
import { Bank, ContextEnum } from '@/types';

export async function GET(req: NextRequest, { params }: { params: { id?: string } }) {
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

    const id = params?.id || req.nextUrl.searchParams.get('id');

    if (id) {
      try {
        const bankAccount = await prisma.bankAccount.findUnique({
          where: { id },
        });

        if (!bankAccount || bankAccount.businessId !== decoded.businessId) {
          return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
          id: bankAccount.id,
          nameAccountBank: bankAccount.nameAccountBank,
          bankName: bankAccount.bankName,
          createdAt: bankAccount.createdAt,
          updatedAt: bankAccount.updatedAt,
          bankLogo: bankAccount.bankName == Bank.INTER ? '/logos/inter.png' : '/logos/asaas.svg',
        }, { status: 200 });
      } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar conta bancária' }, { status: 500 });
      }
    } else {
      try {
        const bankAccounts = await prisma.bankAccount.findMany({
          where: {
            businessId: decoded.businessId,
          },
        });

        return NextResponse.json(bankAccounts.map(bankAccount => ({
          id: bankAccount.id,
          nameAccountBank: bankAccount.nameAccountBank,
          bankName: bankAccount.bankName,
          createdAt: bankAccount.createdAt,
          bankLogo: bankAccount.bankName == Bank.INTER ? '/logos/inter.png' : '/logos/asaas.svg',
          updatedAt: bankAccount.updatedAt,
        })), { status: 200 });
      } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar contas bancárias' }, { status: 500 });
      }
    }
  } catch (error) {
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

    if (!nameAccountBank || !bankName) {
      return NextResponse.json({ error: 'Nome da conta e banco são obrigatórios' }, { status: 400 });
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

    // Log de auditoria
    try {
      await prisma.auditoria.create({
        data: {
          businessId: decoded.businessId,
          accountId: decoded.accountId,
          context: ContextEnum.BANK_ACCOUNT_CREATE,
          description: `Conta bancária criada: ${nameAccountBank} (${bankName})`,
          additionalData: {
            newBankAccountId: newBankAccount.id,
            newBankAccountName: nameAccountBank,
            newBankAccountBank: bankName,
            newBankAccountCertificatePublic: certificatePublic,
            newBankAccountCertificatePrivate: certificatePrivate,
            newBankAccountClientId: clientId,
            newBankAccountSecretId: secretId
          }
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed:', auditError);
    }
      return NextResponse.json(newBankAccount, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao criar conta bancária' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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


    const id: string = params?.id || req.nextUrl.searchParams.get('id') || '';
    const body = await req.json();

    const {
      nameAccountBank,
      bankName,
      certificatePublic,
      certificatePrivate,
      clientId,
      secretId,
    } = body;

    console.log('ID fornecido para atualização:', id);
    console.log('Business ID do token:', decoded.businessId);

    try {
      const existingAccount = await prisma.bankAccount.findUnique({
        where: { id },
      });

      console.log('Conta bancária encontrada para atualização:', existingAccount);

      if (!existingAccount || existingAccount.businessId !== decoded.businessId) {
        return NextResponse.json({ error: 'Conta bancária não encontrada' }, { status: 404 });
      }

      const updatedData: any = {};

      if (nameAccountBank) updatedData.nameAccountBank = nameAccountBank;
      if (bankName) updatedData.bankName = bankName;
      if (certificatePublic) updatedData.certificatePublic = certificatePublic;
      if (certificatePrivate) updatedData.certificatePrivate = certificatePrivate;
      if (clientId) updatedData.clientId = clientId;
      if (secretId) updatedData.secretId = secretId;

      const updatedAccount = await prisma.bankAccount.update({
        where: { id },
        data: updatedData,
      });

      // Log de auditoria
      try {
        await prisma.auditoria.create({
          data: {
            businessId: decoded.businessId,
            accountId: decoded.accountId,
            context: ContextEnum.BANK_ACCOUNT_UPDATE,
            description: `Conta bancária atualizada: ${nameAccountBank} (${bankName})`,
            additionalData: {
              updatedBankAccountId: updatedAccount.id,
              updatedBankAccountName: nameAccountBank,
              updatedBankAccountBank: bankName,
              updatedBankAccountCertificatePublic: certificatePublic,
              updatedBankAccountCertificatePrivate: certificatePrivate,
              updatedBankAccountClientId: clientId,
              updatedBankAccountSecretId: secretId
            }
          }
        });
      } catch (auditError) {
        console.warn('Audit log failed:', auditError);
      }

      return NextResponse.json(updatedAccount, { status: 200 });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao atualizar conta bancária' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
