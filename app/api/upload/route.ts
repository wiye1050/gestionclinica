import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/storage/client';
import { getCurrentUser } from '@/lib/auth/server';
import type { AppRole } from '@/lib/auth/roles';

// Configuración de seguridad para uploads
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_ROLES: AppRole[] = ['admin', 'coordinador', 'profesional', 'recepcion'];

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const hasAccess = (currentUser.roles ?? []).some((role) => ALLOWED_ROLES.includes(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFolder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 415 }
      );
    }

    // Sanitizar carpeta/nombre de archivo
    const sanitizedFolder = /^[a-z0-9/_-]+$/i.test(targetFolder)
      ? targetFolder
      : 'general';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const timestamp = Date.now();
    const fileName = `${sanitizedFolder}/${timestamp}-${sanitizedFileName}`;

    const blob = bucket.file(fileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await blob.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // URLs firmadas privadas con expiración de 7 días
    const [url] = await blob.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
