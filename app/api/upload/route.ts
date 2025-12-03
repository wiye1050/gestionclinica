import { NextRequest, NextResponse } from 'next/server';
import { bucket } from '@/lib/storage/client';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { logger } from '@/lib/utils/logger';
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  validateFileMetadataSchema,
  getFileExtension,
  getContentTypeFromExtension,
  type AllowedFolder,
} from '@/lib/validators';
import type { AppRole } from '@/lib/auth/roles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

// Upload allows more permissive access including reception role
const UPLOAD_ROLES = new Set<AppRole>(['admin', 'coordinador', 'profesional', 'recepcion']);

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!hasAnyRole(currentUser.roles, UPLOAD_ROLES)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFolder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Sanitizar nombre de archivo
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileExtension = getFileExtension(sanitizedFileName);
    const expectedContentType = getContentTypeFromExtension(fileExtension);

    // Validar metadata del archivo con Zod
    const validation = validateFileMetadataSchema.safeParse({
      filename: sanitizedFileName,
      contentType: expectedContentType || file.type,
      size: file.size,
      folder: targetFolder,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid file',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const sanitizedFolder = validation.data.folder;

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
    logger.error('Upload error:', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
