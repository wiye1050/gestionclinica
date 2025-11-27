/**
 * Hook para gestionar el estado de modales y drawers de la agenda
 *
 * Centraliza el estado y lógica de:
 * - Modal de creación/edición de eventos
 * - Drawer de detalles de evento
 * - Prefills desde URL/navegación
 */

import { useState, useCallback, useEffect } from 'react';
import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';

interface AgendaModalsOptions {
  prefillRequest?: {
    openModal?: boolean;
    pacienteId?: string;
    pacienteNombre?: string;
    profesionalId?: string;
  };
}

export function useAgendaModals(options: AgendaModalsOptions = {}) {
  const { prefillRequest } = options;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [eventToEdit, setEventToEdit] = useState<AgendaEvent | null>(null);
  const [modalPrefill, setModalPrefill] =
    useState<{ pacienteId?: string; profesionalId?: string } | null>(null);
  const [prefillRequestKey, setPrefillRequestKey] = useState<string | null>(null);

  // Drawer state
  const [drawerEvent, setDrawerEvent] = useState<AgendaEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Handle prefill request (from URL params)
  useEffect(() => {
    if (!prefillRequest || !prefillRequest.openModal) return;

    const requestKey = JSON.stringify({
      pacienteId: prefillRequest.pacienteId,
      profesionalId: prefillRequest.profesionalId,
      open: prefillRequest.openModal,
    });

    if (requestKey === prefillRequestKey) return;

    setPrefillRequestKey(requestKey);
    setModalPrefill({
      pacienteId: prefillRequest.pacienteId,
      profesionalId: prefillRequest.profesionalId,
    });
    setEventToEdit(null);
    setIsModalOpen(true);
  }, [prefillRequest, prefillRequestKey]);

  // Modal actions
  const openModal = useCallback((initialDate?: Date, prefill?: { pacienteId?: string; profesionalId?: string }) => {
    setModalInitialDate(initialDate);
    setEventToEdit(null);
    setModalPrefill(prefill || null);
    setIsModalOpen(true);
  }, []);

  const openEditModal = useCallback((event: AgendaEvent) => {
    setEventToEdit(event);
    setModalPrefill(null);
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEventToEdit(null);
    setModalPrefill(null);
    setModalInitialDate(undefined);
  }, []);

  // Drawer actions
  const openDrawer = useCallback((event: AgendaEvent) => {
    setDrawerEvent(event);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setDrawerEvent(null);
  }, []);

  return {
    // Modal state
    isModalOpen,
    modalInitialDate,
    eventToEdit,
    modalPrefill,

    // Modal actions
    openModal,
    openEditModal,
    closeModal,

    // Drawer state
    drawerEvent,
    isDrawerOpen,

    // Drawer actions
    openDrawer,
    closeDrawer,
  };
}
