import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_MODERATE } from '@/lib/middleware/rateLimit';

const limiter = rateLimit(RATE_LIMIT_MODERATE);

// Schema para crear usuario
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'coordinador', 'profesional', 'recepcion', 'invitado']),
});

// GET - Listar todos los usuarios
export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
    }

    const usersSnap = await adminDb
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users = usersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        displayName: data.displayName || data.nombre || '',
        role: data.role,
        active: data.active ?? true,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    logger.error('Error listando usuarios:', error as Error);
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 });
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { email, password, displayName, role } = parsed.data;

    // Crear usuario en Firebase Auth
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin no configurado' },
        { status: 500 }
      );
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // Crear documento en Firestore usando Admin SDK
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email,
        displayName,
        role,
        active: true,
      },
    });
  } catch (error) {
    logger.error('Error creando usuario:', error as Error);
    const message = error instanceof Error ? error.message : 'Error al crear usuario';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
