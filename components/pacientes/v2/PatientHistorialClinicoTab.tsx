'use client';

import { 
  AlertTriangle, 
  Pill, 
  Heart, 
  Users, 
  Syringe,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface Alergia {
  id: string;
  nombre: string;
  severidad: 'leve' | 'moderada' | 'severa';
  fechaDiagnostico?: Date;
  notas?: string;
}

interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  fechaInicio: Date;
  fechaFin?: Date;
  prescriptor?: string;
  activo: boolean;
}

interface Antecedente {
  id: string;
  tipo: 'personal' | 'familiar';
  condicion: string;
  fecha?: Date;
  notas?: string;
  familiar?: string; // Para antecedentes familiares
}

interface Vacuna {
  id: string;
  nombre: string;
  fecha: Date;
  dosis: string;
  lote?: string;
  proximaDosis?: Date;
}

interface PatientHistorialClinicoTabProps {
  alergias: Alergia[];
  medicamentos: Medicamento[];
  antecedentes: Antecedente[];
  vacunas: Vacuna[];
  onAddAlergia?: () => void;
  onAddMedicamento?: () => void;
  onAddAntecedente?: () => void;
  onAddVacuna?: () => void;
}

export default function PatientHistorialClinicoTab({
  alergias,
  medicamentos,
  antecedentes,
  vacunas,
  onAddAlergia,
  onAddMedicamento,
  onAddAntecedente,
  onAddVacuna
}: PatientHistorialClinicoTabProps) {

  const medicamentosActivos = medicamentos.filter(m => m.activo);
  const antecedentesPersonales = antecedentes.filter(a => a.tipo === 'personal');
  const antecedentesFamiliares = antecedentes.filter(a => a.tipo === 'familiar');

  const getSeveridadColor = (severidad: Alergia['severidad']) => {
    switch (severidad) {
      case 'severa':
        return 'bg-danger-bg text-danger border-danger';
      case 'moderada':
        return 'bg-warning-bg text-warning border-warning';
      case 'leve':
        return 'bg-warning-bg text-warning border-warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alergias e Intolerancias */}
      <section className="bg-card rounded-2xl shadow-sm border border-danger p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <h2 className="text-lg font-semibold text-danger">Alergias e Intolerancias</h2>
            {alergias.length > 0 && (
              <span className="px-2 py-1 bg-danger-bg text-danger rounded-full text-xs font-medium">
                {alergias.length}
              </span>
            )}
          </div>
          {onAddAlergia && (
            <button
              onClick={onAddAlergia}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-danger text-white rounded-2xl hover:opacity-90 transition-colors">
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>

        {alergias.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm bg-muted rounded-2xl">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p>No hay alergias registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alergias.map((alergia) => (
              <div
                key={alergia.id}
                className={`p-4 rounded-lg border-2 ${getSeveridadColor(alergia.severidad)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{alergia.nombre}</p>
                      <span className="px-2 py-0.5 bg-white/50 rounded-full text-xs uppercase font-medium">
                        {alergia.severidad}
                      </span>
                    </div>
                    {alergia.fechaDiagnostico && (
                      <p className="text-sm opacity-80">
                        Diagnosticada: {alergia.fechaDiagnostico.toLocaleDateString('es-ES')}
                      </p>
                    )}
                    {alergia.notas && (
                      <p className="text-sm mt-1 opacity-90">{alergia.notas}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-white/50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-white/50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Medicación Actual */}
      <section className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-text">Medicación Actual</h2>
            {medicamentosActivos.length > 0 && (
              <span className="px-2 py-1 bg-accent-bg text-accent rounded-full text-xs font-medium">
                {medicamentosActivos.length} activos
              </span>
            )}
          </div>
          {onAddMedicamento && (
            <button
              onClick={onAddMedicamento}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded-2xl hover:opacity-90 transition-colors">
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>

        {medicamentosActivos.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm bg-muted rounded-2xl">
            <Pill className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p>No hay medicación activa registrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicamentosActivos.map((med) => (
              <div
                key={med.id}
                className="p-4 bg-accent-bg rounded-2xl border border-accent"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-text">{med.nombre}</p>
                    <p className="text-sm text-text-muted mt-1">
                      <span className="font-medium">Dosis:</span> {med.dosis} • {med.frecuencia}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                      <span>Inicio: {med.fechaInicio.toLocaleDateString('es-ES')}</span>
                      {med.prescriptor && <span>Prescrito por: {med.prescriptor}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-accent-bg rounded">
                      <Edit className="w-4 h-4 text-accent" />
                    </button>
                    <button 
                      className="px-2 py-1 text-xs bg-success text-white rounded hover:opacity-90"
                      title="Marcar como completado"
                    >
                      Completar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Antecedentes Personales */}
      <section className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-semibold text-text">Antecedentes Personales</h2>
            {antecedentesPersonales.length > 0 && (
              <span className="px-2 py-1 bg-brand-subtle text-brand rounded-full text-xs font-medium">
                {antecedentesPersonales.length}
              </span>
            )}
          </div>
          {onAddAntecedente && (
            <button
              onClick={onAddAntecedente}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand text-white rounded-2xl hover:opacity-90 transition-colors">
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>

        {antecedentesPersonales.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm bg-muted rounded-2xl">
            <Heart className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p>No hay antecedentes personales registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {antecedentesPersonales.map((ant) => (
              <div
                key={ant.id}
                className="p-3 bg-brand-subtle rounded-2xl border border-brand flex items-start justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-text">{ant.condicion}</p>
                  {ant.fecha && (
                    <p className="text-sm text-text-muted">
                      {ant.fecha.toLocaleDateString('es-ES')}
                    </p>
                  )}
                  {ant.notas && (
                    <p className="text-sm text-text-muted mt-1">{ant.notas}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-brand-subtle rounded">
                    <Edit className="w-4 h-4 text-brand" />
                  </button>
                  <button className="p-1 hover:bg-brand-subtle rounded">
                    <Trash2 className="w-4 h-4 text-brand" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Antecedentes Familiares */}
      <section className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-text">Antecedentes Familiares</h2>
            {antecedentesFamiliares.length > 0 && (
              <span className="px-2 py-1 bg-success-bg text-success rounded-full text-xs font-medium">
                {antecedentesFamiliares.length}
              </span>
            )}
          </div>
          {onAddAntecedente && (
            <button
              onClick={onAddAntecedente}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-success text-white rounded-2xl hover:opacity-90 transition-colors">
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>

        {antecedentesFamiliares.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm bg-muted rounded-2xl">
            <Users className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p>No hay antecedentes familiares registrados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {antecedentesFamiliares.map((ant) => (
              <div
                key={ant.id}
                className="p-3 bg-success-bg rounded-2xl border border-success flex items-start justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-text">
                    {ant.condicion}
                    {ant.familiar && <span className="text-sm text-text-muted ml-2">({ant.familiar})</span>}
                  </p>
                  {ant.notas && (
                    <p className="text-sm text-text-muted mt-1">{ant.notas}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-success-bg rounded">
                    <Edit className="w-4 h-4 text-success" />
                  </button>
                  <button className="p-1 hover:bg-success-bg rounded">
                    <Trash2 className="w-4 h-4 text-success" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Vacunaciones */}
      <section className="bg-card rounded-2xl shadow-sm border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-text">Vacunaciones</h2>
            {vacunas.length > 0 && (
              <span className="px-2 py-1 bg-accent-bg text-accent rounded-full text-xs font-medium">
                {vacunas.length}
              </span>
            )}
          </div>
          {onAddVacuna && (
            <button
              onClick={onAddVacuna}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-accent text-white rounded-2xl hover:opacity-90 transition-colors">
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>

        {vacunas.length === 0 ? (
          <div className="text-center py-6 text-text-muted text-sm bg-muted rounded-2xl">
            <Syringe className="w-8 h-8 mx-auto mb-2 text-text-muted" />
            <p>No hay vacunas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vacunas.map((vacuna) => (
              <div
                key={vacuna.id}
                className="p-3 bg-accent-bg rounded-2xl border border-accent flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text">{vacuna.nombre}</p>
                    <span className="px-2 py-0.5 bg-accent-subtle text-accent rounded text-xs">
                      {vacuna.dosis}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted">
                    {vacuna.fecha.toLocaleDateString('es-ES')}
                    {vacuna.lote && ` • Lote: ${vacuna.lote}`}
                  </p>
                  {vacuna.proximaDosis && (
                    <p className="text-sm text-warning mt-1">
                      ⚠️ Próxima dosis: {vacuna.proximaDosis.toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-accent-bg rounded">
                    <Edit className="w-4 h-4 text-accent" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
