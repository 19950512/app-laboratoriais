import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { JwtService } from '../../../../lib/jwt';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      JwtService.verifyToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Parse do FormData
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar tipo do arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou SVG.' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 5MB' },
        { status: 400 }
      );
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logos');
    await mkdir(uploadDir, { recursive: true });

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retornar caminho relativo para salvar no banco
    const relativePath = `/uploads/logos/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Logo enviado com sucesso',
      data: {
        logoPath: relativePath,
        fileName,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
