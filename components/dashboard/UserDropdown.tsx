'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  LogOut,
  Mail,
  Activity,
  HelpCircle,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { UserSettingsModal } from './UserSettingsModal';

interface UserDropdownProps {
  user: {
    displayName?: string | null;
    email?: string | null;
  };
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function UserDropdown({ user, isDark, onToggleTheme, onLogout }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const displayName = user.displayName || user.email || 'Usuario';
  const initial = displayName[0]?.toUpperCase() || 'U';

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 transition hover:bg-white"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-xs font-semibold text-white shadow-md shadow-brand/20">
            {initial}
          </div>
          <span className="hidden sm:block text-xs font-medium text-slate-700 max-w-[100px] truncate">
            {displayName}
          </span>
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200/70 bg-white shadow-lg shadow-slate-200/50 z-50">
            {/* Info del usuario */}
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              {user.email && user.displayName && (
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              )}
            </div>

            {/* Enlaces externos */}
            <div className="border-b border-slate-100 py-1">
              <a
                href="https://email.ionos.es/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Mail className="h-4 w-4 text-slate-400" />
                <span>Correo IONOS</span>
              </a>
              <a
                href="https://app.clinic-cloud.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Activity className="h-4 w-4 text-slate-400" />
                <span>Clinic Cloud</span>
              </a>
              <a
                href="https://support.clinic-cloud.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <HelpCircle className="h-4 w-4 text-slate-400" />
                <span>Centro de ayuda</span>
              </a>
            </div>

            {/* Preferencias */}
            <div className="border-b border-slate-100 py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Configuración</span>
              </button>
              <button
                onClick={() => {
                  onToggleTheme();
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {isDark ? (
                  <>
                    <Sun className="h-4 w-4 text-slate-400" />
                    <span>Modo claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-slate-400" />
                    <span>Modo oscuro</span>
                  </>
                )}
              </button>
            </div>

            {/* Cerrar sesión */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de configuración */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
