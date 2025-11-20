import type { ReactNode } from 'react'
import {
  CalendarDays,
  List,
  LayoutGrid,
  Boxes,
  UserCircle,
} from 'lucide-react'
import { createElement } from 'react'
import { AgendaEvent } from './agendaHelpers'

export type VistaAgenda = 'diaria' | 'semanal' | 'multi' | 'boxes' | 'paciente'

export const AGENDA_STORAGE_KEY = 'agenda.filters.v1'
export const VIEW_STORAGE_KEY = 'agenda.view.v1'
export const DAY_MODE_STORAGE_KEY = 'agenda.dayMode.v1'

export const ESTADO_FILTERS: Array<{
  id: AgendaEvent['estado'] | 'todos'
  label: string
  className: string
}> = [
  { id: 'todos', label: 'Todos', className: 'border border-border text-text-muted' },
  { id: 'programada', label: 'Programadas', className: 'bg-yellow-100 text-yellow-800' },
  { id: 'confirmada', label: 'Confirmadas', className: 'bg-green-100 text-green-800' },
  { id: 'realizada', label: 'Realizadas', className: 'bg-gray-200 text-gray-700' },
  { id: 'cancelada', label: 'Canceladas', className: 'bg-red-100 text-red-800' },
]

export const TIPO_FILTERS: Array<{ id: AgendaEvent['tipo'] | 'todos'; label: string }> = [
  { id: 'todos', label: 'Todos los tipos' },
  { id: 'consulta', label: 'Consulta' },
  { id: 'seguimiento', label: 'Seguimiento' },
  { id: 'revision', label: 'Revisión' },
  { id: 'tratamiento', label: 'Tratamiento' },
  { id: 'urgencia', label: 'Urgencia' },
  { id: 'administrativo', label: 'Administrativo' },
]

export const RECURSO_PRESETS = [
  { id: 'todos', label: 'Todos los recursos' },
  { id: 'medicina', label: 'Equipo médico' },
  { id: 'fisioterapia', label: 'Fisioterapia' },
  { id: 'enfermeria', label: 'Enfermería' },
] as const

export type RecursoPreset = typeof RECURSO_PRESETS[number]['id']

export const VIEW_TABS: Array<{
  id: VistaAgenda
  label: string
  helper: string
  icon: ReactNode
}> = [
  {
    id: 'diaria',
    label: 'Diaria',
    helper: 'Detalle por horas',
    icon: createElement(CalendarDays, { className: 'h-4 w-4' })
  },
  {
    id: 'semanal',
    label: 'Semanal',
    helper: 'Vista cronológica',
    icon: createElement(List, { className: 'h-4 w-4' })
  },
  {
    id: 'multi',
    label: 'Multi',
    helper: 'Columnas por profesional',
    icon: createElement(LayoutGrid, { className: 'h-4 w-4' })
  },
  {
    id: 'boxes',
    label: 'Boxes',
    helper: 'Flujo por salas',
    icon: createElement(Boxes, { className: 'h-4 w-4' })
  },
  {
    id: 'paciente',
    label: 'Paciente',
    helper: 'Seguimiento individual',
    icon: createElement(UserCircle, { className: 'h-4 w-4' })
  },
]
