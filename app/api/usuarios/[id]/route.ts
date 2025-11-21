import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';

// Schema para actualizar usuario
const updateUserSchema = z.object({
  displayName: z.string().min(2).optional(),
  role: z.enum(['admin', 'coordinador', 'profesional', 'recepcion', 'invitado']).optional(),
  active: z.boolean().optional(),
});

// GET - Obtener usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
    }

    const { id } = await params;
    const userDoc = await adminDb.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const data = userDoc.data()!;
    return NextResponse.json({
      user: {
        uid: userDoc.id,
        email: data.email,
        displayName: data.displayName || data.nombre || '',
        role: data.role,
        active: data.active ?? true,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

// PATCH - Actualizar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    // Actualizar en Firestore
    await userRef.update(updates);

    // Si se actualiza el nombre, también en Auth
    if (parsed.data.displayName && adminAuth) {
      try {
        await adminAuth.updateUser(id, {
          displayName: parsed.data.displayName,
        });
      } catch (authError) {
        console.warn('No se pudo actualizar displayName en Auth:', authError);
      }
    }

    // Si se desactiva, deshabilitar en Auth
    if (parsed.data.active === false && adminAuth) {
      try {
        await adminAuth.updateUser(id, { disabled: true });
      } catch (authError) {
        console.warn('No se pudo deshabilitar usuario en Auth:', authError);
      }
    } else if (parsed.data.active === true && adminAuth) {
      try {
        await adminAuth.updateUser(id, { disabled: false });
      } catch (authError) {
        console.warn('No se pudo habilitar usuario en Auth:', authError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles?.includes('admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
    }

    const { id } = await params;

    // No permitir eliminarse a sí mismo
    if (id === currentUser.uid) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      );
    }

    // Eliminar de Firestore
    await adminDb.collection('users').doc(id).delete();

    // Eliminar de Auth
    if (adminAuth) {
      try {
        await adminAuth.deleteUser(id);
      } catch (authError) {
        console.warn('No se pudo eliminar usuario de Auth:', authError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
