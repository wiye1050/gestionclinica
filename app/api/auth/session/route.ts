import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import {
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
  isAuthConfigured,
} from '@/lib/auth/session';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

const isProduction = process.env.NODE_ENV === 'production';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;
  if (!adminAuth || !isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Autenticación del lado del servidor no está configurada.' },
      { status: 500 }
    );
  }

  const { idToken } = await request.json().catch(() => ({}));

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'idToken requerido' }, { status: 400 });
  }

  try {
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE_MS,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('[auth] No se pudo crear la cookie de sesión', error as Error);
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
