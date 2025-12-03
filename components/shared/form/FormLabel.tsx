import clsx from 'clsx';

interface FormLabelProps {
  /** Texto del label */
  children: React.ReactNode;
  /** ID del campo asociado (para accesibilidad) */
  htmlFor?: string;
  /** Indica si el campo es requerido (muestra asterisco) */
  required?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Label consistente para formularios
 *
 * @example
 * ```tsx
 * <FormLabel htmlFor="email" required>
 *   Correo electrónico
 * </FormLabel>
 * ```
 */
export default function FormLabel({ children, htmlFor, required, className }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx('block text-sm font-medium text-text mb-1', className)}
    >
      {children}
      {required && <span className="ml-1 text-danger">*</span>}
    </label>
  );
}
