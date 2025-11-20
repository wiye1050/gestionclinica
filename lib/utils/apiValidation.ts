import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Valida el body de una request con un schema Zod
 */
export async function validateRequest<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse }
> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Datos inválidos',
            details: result.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Body JSON inválido' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Valida query params con un schema Zod
 */
export function validateSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: NextResponse } {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const result = schema.safeParse(params)

  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: 'Parámetros inválidos',
          details: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      ),
    }
  }

  return { success: true, data: result.data }
}

// Schemas comunes reutilizables
export const commonSchemas = {
  id: z.string().min(1, 'ID requerido'),
  email: z.string().email('Email inválido'),
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
}
