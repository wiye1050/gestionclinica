import { useEffect } from 'react';
import type { VistaAgenda } from '@/components/agenda/v2/agendaConstants';

export interface UseAgendaKeyboardProps {
  handlePrev: () => void;
  handleNext: () => void;
  handleToday: () => void;
  setVista: (vista: VistaAgenda) => void;
  openModal: (date: Date) => void;
}

/**
 * Hook para manejar atajos de teclado de la agenda
 *
 * Atajos disponibles:
 * - ←/→: Navegar anterior/siguiente
 * - t: Ir a hoy
 * - 1/2/3: Cambiar vista (diaria/semanal/multi)
 * - n: Nueva cita
 * - /: Enfocar búsqueda
 *
 * @param props - Handlers y setters necesarios
 */
export function useAgendaKeyboard({
  handlePrev,
  handleNext,
  handleToday,
  setVista,
  openModal,
}: UseAgendaKeyboardProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow '/' to focus search even in inputs
        if (e.key === '/' && !target.classList.contains('agenda-search')) {
          e.preventDefault();
          const searchInput = document.querySelector('.agenda-search') as HTMLInputElement;
          searchInput?.focus();
        }
        return;
      }

      // Navigation shortcuts
      if (e.key === 'ArrowLeft' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleNext();
      }
      // View shortcuts (1-3)
      else if (e.key === '1') {
        e.preventDefault();
        setVista('diaria');
      } else if (e.key === '2') {
        e.preventDefault();
        setVista('semanal');
      } else if (e.key === '3') {
        e.preventDefault();
        setVista('multi');
      }
      // Today shortcut
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleToday();
      }
      // New event shortcut
      else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openModal(new Date());
      }
      // Search focus
      else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector('.agenda-search') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, handleToday, setVista, openModal]);
}
