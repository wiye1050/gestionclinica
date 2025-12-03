import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface FormErrorProps {
  /** Mensaje de error a mostrar */
  children?: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Mensaje de error consistente para campos de formulario
 *
 * @example
 * ```tsx
 * {errors.email && <FormError>{errors.email}</FormError>}
 * ```
 */
export default function FormError({ children, className }: FormErrorProps) {
  if (!children) return null;

  return (
    <div className={clsx('mt-1 flex items-center gap-1 text-xs text-danger', className)}>
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}
