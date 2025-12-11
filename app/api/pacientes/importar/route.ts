import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { adminDb } from '@/lib/firebaseAdmin';
import { initializeNHCCounter } from '@/lib/server/pacientesAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

const ADMIN_ROLES = new Set(['admin']);

const limiter = rateLimit(RATE_LIMIT_STRICT);

// Schema para cada paciente importado
const pacienteImportSchema = z.object({
  numeroHistoria: z.string().min(1, 'NHC requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellidos: z.string().min(1, 'Apellidos requeridos'),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  fechaNacimiento: z.string().optional().nullable(),
  documentoId: z.string().optional().nullable(),
  genero: z.enum(['masculino', 'femenino', 'otro', 'no-especificado']).optional(),
  direccion: z.string().optional().nullable(),
  codigoPostal: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
});

const importRequestSchema = z.object({
  pacientes: z.array(pacienteImportSchema).min(1).max(1000),
});

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Solo admins pueden importar
  const _hasAccess = (user.roles ?? []).some((role) => ADMIN_ROLES.has(role));
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json(
      { error: 'Solo administradores pueden importar pacientes' },
      { status: 403 }
    );
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const validation = importRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Datos de importación inválidos',
        details: validation.error.issues,
      },
      { status: 400 }
    );
  }

  const { pacientes } = validation.data;

  try {
    const results = {
      total: pacientes.length,
      importados: 0,
      errores: [] as Array<{ nhc: string; error: string }>,
      duplicados: [] as string[],
    };

    // Verificar NHCs duplicados en el lote
    const nhcsEnLote = pacientes.map((p) => p.numeroHistoria);
    const nhcsDuplicadosEnLote = nhcsEnLote.filter(
      (nhc, index) => nhcsEnLote.indexOf(nhc) !== index
    );
    if (nhcsDuplicadosEnLote.length > 0) {
      return NextResponse.json(
        {
          error: 'Hay NHCs duplicados en el archivo de importación',
          duplicados: [...new Set(nhcsDuplicadosEnLote)],
        },
        { status: 400 }
      );
    }

    // Verificar NHCs que ya existen en la base de datos
    const existingNHCs = new Set<string>();
    const batchSize = 10;
    for (let i = 0; i < nhcsEnLote.length; i += batchSize) {
      const batchNHCs = nhcsEnLote.slice(i, i + batchSize);
      const snapshot = await adminDb
        .collection('pacientes')
        .where('numeroHistoria', 'in', batchNHCs)
        .get();
      snapshot.docs.forEach((doc) => {
        const nhc = doc.data()?.numeroHistoria;
        if (nhc) existingNHCs.add(nhc);
      });
    }

    if (existingNHCs.size > 0) {
      results.duplicados = [...existingNHCs];
    }

    // Encontrar el NHC más alto para actualizar el contador
    let maxNHC = 0;
    for (const p of pacientes) {
      const nhcNum = parseInt(p.numeroHistoria, 10);
      if (!isNaN(nhcNum) && nhcNum > maxNHC) {
        maxNHC = nhcNum;
      }
    }

    // Importar pacientes en batches
    const BATCH_SIZE = 500;
    const ahora = new Date();

    for (let i = 0; i < pacientes.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const batchPacientes = pacientes.slice(i, i + BATCH_SIZE);

      for (const paciente of batchPacientes) {
        // Saltar si ya existe
        if (existingNHCs.has(paciente.numeroHistoria)) {
          continue;
        }

        const docRef = adminDb.collection('pacientes').doc();

        const fechaNac = paciente.fechaNacimiento
          ? new Date(paciente.fechaNacimiento)
          : null;

        batch.set(docRef, {
          numeroHistoria: paciente.numeroHistoria,
          nombre: paciente.nombre,
          apellidos: paciente.apellidos,
          telefono: paciente.telefono || null,
          email: paciente.email || null,
          fechaNacimiento: fechaNac && !isNaN(fechaNac.getTime()) ? fechaNac : null,
          documentoId: paciente.documentoId || null,
          tipoDocumento: paciente.documentoId ? 'dni' : null,
          genero: paciente.genero || 'no-especificado',
          direccion: paciente.direccion || null,
          codigoPostal: paciente.codigoPostal || null,
          ciudad: paciente.ciudad || null,
          alergias: [],
          alertasClinicas: [],
          diagnosticosPrincipales: [],
          riesgo: 'medio',
          estado: 'activo',
          consentimientos: [],
          createdAt: ahora,
          updatedAt: ahora,
          creadoPor: user.email ?? user.uid,
          creadoPorId: user.uid,
          importadoDesde: 'clinic-cloud',
          importadoEn: ahora,
        });

        results.importados++;
      }

      await batch.commit();
    }

    // Actualizar el contador de NHC si es necesario
    if (maxNHC > 0) {
      const counterRef = adminDb.collection('counters').doc('pacientes');
      const counterDoc = await counterRef.get();
      const currentValue = counterDoc.exists ? (counterDoc.data()?.lastNHC ?? 0) : 0;

      if (maxNHC > currentValue) {
        await initializeNHCCounter(maxNHC);
      }
    }

    // Log de auditoría
    await adminDb.collection('auditLogs').add({
      modulo: 'pacientes',
      accion: 'import',
      userId: user.uid,
      userEmail: user.email ?? undefined,
      detalles: {
        total: results.total,
        importados: results.importados,
        duplicados: results.duplicados.length,
        errores: results.errores.length,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    logger.error('[api/pacientes/importar] Error:', error as Error);
    const message = error instanceof Error ? error.message : 'Error al importar pacientes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
