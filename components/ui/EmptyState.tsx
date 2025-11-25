'use client';

interface EmptyStateProps {
  variant: 'appointments' | 'tasks' | 'patients' | 'files' | 'notifications' | 'search' | 'default';
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Componente de estado vacío con ilustraciones SVG
 * Proporciona feedback visual agradable cuando no hay datos
 */
export function EmptyState({ variant, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* SVG Illustration */}
      <div className="mb-4">
        {variant === 'appointments' && <AppointmentsIllustration />}
        {variant === 'tasks' && <TasksIllustration />}
        {variant === 'patients' && <PatientsIllustration />}
        {variant === 'files' && <FilesIllustration />}
        {variant === 'notifications' && <NotificationsIllustration />}
        {variant === 'search' && <SearchIllustration />}
        {variant === 'default' && <DefaultIllustration />}
      </div>

      {/* Text */}
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 mb-4 max-w-xs">{description}</p>}

      {/* Optional action */}
      {action && <div>{action}</div>}
    </div>
  );
}

// Ilustraciones SVG minimalistas

function AppointmentsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="20" width="50" height="48" rx="4" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="2"/>
      <path d="M27 20 L27 14 M53 20 L53 14" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round"/>
      <rect x="15" y="28" width="50" height="6" fill="#DBEAFE"/>
      <circle cx="25" cy="44" r="2" fill="#93C5FD"/>
      <circle cx="35" cy="44" r="2" fill="#93C5FD"/>
      <circle cx="45" cy="44" r="2" fill="#93C5FD"/>
      <circle cx="55" cy="44" r="2" fill="#93C5FD"/>
      <circle cx="25" cy="54" r="2" fill="#93C5FD"/>
      <circle cx="35" cy="54" r="2" fill="#60A5FA"/>
      <circle cx="45" cy="54" r="2" fill="#93C5FD"/>
    </svg>
  );
}

function TasksIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="15" width="40" height="8" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="2"/>
      <rect x="20" y="28" width="40" height="8" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="2"/>
      <rect x="20" y="41" width="40" height="8" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="2"/>
      <rect x="20" y="54" width="28" height="8" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="2"/>
      <circle cx="24" cy="19" r="2" fill="#A78BFA"/>
      <circle cx="24" cy="32" r="2" fill="#A78BFA"/>
      <circle cx="24" cy="45" r="2" fill="#A78BFA"/>
      <circle cx="24" cy="58" r="2" fill="#8B5CF6"/>
      <path d="M22.5 58 L23.5 59 L25.5 57" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PatientsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="30" r="12" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="2"/>
      <circle cx="40" cy="28" r="5" fill="#86EFAC"/>
      <path d="M 28 52 Q 28 42, 40 42 Q 52 42, 52 52 L 52 60 Q 52 62, 50 62 L 30 62 Q 28 62, 28 60 Z" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="2"/>
      <circle cx="35" cy="30" r="1.5" fill="#22C55E"/>
      <circle cx="45" cy="30" r="1.5" fill="#22C55E"/>
      <path d="M 37 35 Q 40 37, 43 35" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function FilesIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 20 L25 60 Q25 62 27 62 L53 62 Q55 62 55 60 L55 30 L45 20 Z" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="2"/>
      <path d="M45 20 L45 30 L55 30" fill="#FCD34D" stroke="#FDE68A" strokeWidth="2"/>
      <rect x="30" y="40" width="20" height="3" rx="1.5" fill="#FBBF24"/>
      <rect x="30" y="48" width="15" height="3" rx="1.5" fill="#FBBF24"/>
      <rect x="30" y="56" width="18" height="3" rx="1.5" fill="#FBBF24"/>
    </svg>
  );
}

function NotificationsIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 40 25 Q 35 25, 35 30 L 35 45 Q 35 48, 32 51 L 28 55 L 52 55 L 48 51 Q 45 48, 45 45 L 45 30 Q 45 25, 40 25 Z" fill="#E0E7FF" stroke="#C7D2FE" strokeWidth="2"/>
      <path d="M 37 55 Q 37 58, 40 58 Q 43 58, 43 55" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <circle cx="48" cy="28" r="4" fill="#EF4444" stroke="white" strokeWidth="2"/>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="35" r="15" fill="#F3F4F6" stroke="#D1D5DB" strokeWidth="2"/>
      <circle cx="35" cy="35" r="10" fill="white" stroke="#D1D5DB" strokeWidth="2"/>
      <path d="M 45 45 L 55 55" stroke="#9CA3AF" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="56" cy="56" r="4" fill="#6B7280"/>
    </svg>
  );
}

function DefaultIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="40" height="30" rx="4" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2"/>
      <circle cx="32" cy="37" r="3" fill="#94A3B8"/>
      <circle cx="40" cy="37" r="3" fill="#94A3B8"/>
      <circle cx="48" cy="37" r="3" fill="#94A3B8"/>
    </svg>
  );
}
