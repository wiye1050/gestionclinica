import DOMPurify from 'isomorphic-dompurify';

const defaultOptions = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

export function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, defaultOptions).trim();
}

export function sanitizeHTML(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['style'],
  });
}

export function sanitizeObject<T extends Record<string, unknown>>(
  data: T,
  fields: Array<keyof T>,
  sanitizer: (value: string) => string = sanitizeInput
): T {
  const sanitized = { ...data };
  for (const field of fields) {
    const value = sanitized[field];
    if (typeof value === 'string') {
      sanitized[field] = sanitizer(value) as T[keyof T];
    }
  }
  return sanitized;
}

export function sanitizeStringArray(
  values: Array<unknown>,
  sanitizer: (value: string) => string = sanitizeInput
): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (typeof value === 'string' ? sanitizer(value) : ''))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function sanitizeText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const sanitized = sanitizeInput(value);
  return sanitized.length > 0 ? sanitized : fallback;
}

export function sanitizeRichText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const sanitized = sanitizeHTML(value);
  return sanitized.length > 0 ? sanitized : fallback;
}
