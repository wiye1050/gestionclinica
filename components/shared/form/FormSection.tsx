import clsx from 'clsx';

interface FormSectionProps {
  /** Título de la sección */
  title?: string;
  /** Descripción opcional de la sección */
  description?: string;
  /** Contenido de la sección (campos del formulario) */
  children: React.ReactNode;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Sección agrupadora para campos relacionados en un formulario
 *
 * @example
 * ```tsx
 * <FormSection title="Datos personales" description="Información básica del paciente">
 *   <FormField name="nombre" label="Nombre" />
 *   <FormField name="apellidos" label="Apellidos" />
 * </FormSection>
 * ```
 */
export default function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={clsx('space-y-4', className)}>
      {(title || description) && (
        <div className="border-b border-border pb-3">
          {title && <h3 className="text-base font-semibold text-text">{title}</h3>}
          {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}
