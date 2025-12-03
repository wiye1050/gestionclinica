import { forwardRef } from 'react';
import clsx from 'clsx';
import FormLabel from './FormLabel';
import FormError from './FormError';

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox';

interface BaseFormFieldProps {
  /** Nombre del campo (usado para form submission) */
  name: string;
  /** Label del campo */
  label?: string;
  /** Tipo de campo */
  type?: FormFieldType;
  /** Placeholder */
  placeholder?: string;
  /** Campo requerido */
  required?: boolean;
  /** Campo deshabilitado */
  disabled?: boolean;
  /** Mensaje de error */
  error?: string;
  /** Texto de ayuda debajo del campo */
  helperText?: string;
  /** Clases CSS adicionales para el contenedor */
  className?: string;
  /** Clases CSS adicionales para el input/textarea/select */
  inputClassName?: string;
  /** Opciones para select */
  options?: Array<{ value: string | number; label: string }>;
  /** Número de filas para textarea */
  rows?: number;
  /** Valor por defecto */
  defaultValue?: string | number;
  /** Valor controlado */
  value?: string | number | boolean;
  /** Handler de cambio */
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /** Ancho completo del contenedor (default: true) */
  fullWidth?: boolean;
}

export type FormFieldProps = BaseFormFieldProps & Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, keyof BaseFormFieldProps>;

/**
 * Campo de formulario genérico con estilos consistentes
 * Compatible con react-hook-form usando ref forwarding
 *
 * @example
 * ```tsx
 * // Input básico
 * <FormField
 *   name="email"
 *   label="Correo electrónico"
 *   type="email"
 *   required
 *   error={errors.email}
 * />
 *
 * // Select con opciones
 * <FormField
 *   name="tipo"
 *   label="Tipo de proyecto"
 *   type="select"
 *   options={[
 *     { value: 'desarrollo', label: 'Desarrollo' },
 *     { value: 'investigacion', label: 'Investigación' },
 *   ]}
 * />
 *
 * // Con react-hook-form
 * <FormField
 *   {...register('nombre')}
 *   label="Nombre"
 *   error={errors.nombre?.message}
 * />
 * ```
 */
const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
  (
    {
      name,
      label,
      type = 'text',
      placeholder,
      required,
      disabled,
      error,
      helperText,
      className,
      inputClassName,
      options = [],
      rows = 4,
      defaultValue,
      value,
      onChange,
      fullWidth = true,
      ...rest
    },
    ref
  ) => {
    const inputId = `field-${name}`;

    const baseInputClasses = clsx(
      'w-full rounded-xl border px-3 py-2 text-text transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
      {
        'border-border bg-card': !error,
        'border-danger bg-danger-bg/10': error,
        'opacity-60 cursor-not-allowed': disabled,
      },
      inputClassName
    );

    const renderInput = () => {
      if (type === 'textarea') {
        return (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            name={name}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            defaultValue={defaultValue}
            value={value as string | undefined}
            onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
            className={baseInputClasses}
            {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        );
      }

      if (type === 'select') {
        return (
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            id={inputId}
            name={name}
            required={required}
            disabled={disabled}
            defaultValue={defaultValue}
            value={value as string | number | undefined}
            onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
            className={baseInputClasses}
            {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      }

      if (type === 'checkbox') {
        return (
          <div className="flex items-center">
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              id={inputId}
              name={name}
              type="checkbox"
              required={required}
              disabled={disabled}
              defaultChecked={defaultValue as boolean | undefined}
              checked={value as boolean | undefined}
              onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
              className={clsx(
                'h-4 w-4 rounded border-border text-brand focus:ring-2 focus:ring-brand',
                { 'opacity-60 cursor-not-allowed': disabled },
                inputClassName
              )}
              {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            />
            {label && (
              <label htmlFor={inputId} className="ml-2 text-sm text-text">
                {label}
                {required && <span className="ml-1 text-danger">*</span>}
              </label>
            )}
          </div>
        );
      }

      return (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          defaultValue={defaultValue}
          value={value as string | number | undefined}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          className={baseInputClasses}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      );
    };

    return (
      <div className={clsx({ 'md:col-span-2': fullWidth }, className)}>
        {type !== 'checkbox' && label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        {renderInput()}
        {error && <FormError>{error}</FormError>}
        {helperText && !error && <p className="mt-1 text-xs text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
