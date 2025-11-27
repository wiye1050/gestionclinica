/**
 * UI Components - Componentes base reutilizables
 *
 * Este archivo exporta todos los componentes UI disponibles
 * para facilitar su importación en toda la aplicación.
 */

export { Button, type ButtonProps } from './Button';
export { Badge } from './Badge';
export { default as Card } from './Card';
export { default as Loading } from './Loading';
export { EmptyState } from './EmptyState';
export { ErrorBoundary, ModuleErrorBoundary, useErrorBoundary } from './ErrorBoundary';
export { FileUpload } from './FileUpload';
export { GlobalSearch } from './GlobalSearch';
export { NotificacionesDropdown } from './NotificacionesDropdown';
export { ExportButton } from './ExportButton';
export { default as Stat } from './Stat';

// Nuevos componentes
export { Modal, ModalFooter, type ModalProps } from './Modal';
export { Drawer, DrawerFooter, type DrawerProps } from './Drawer';
export { Tooltip, SimpleTooltip, type TooltipProps } from './Tooltip';
