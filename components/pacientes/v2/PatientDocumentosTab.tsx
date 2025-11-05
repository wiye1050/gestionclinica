// components/pacientes/v2/PatientDocumentosTab.tsx
// Tab de gestión de documentos (temporal hasta implementar Storage)

import { Documento } from '@/types/paciente-v2';
import { FileText, Upload, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PatientDocumentosTabProps {
  documentos: Documento[];
  onUpload: () => void;
  onDownload: (documentoId: string) => void;
  onView: (documentoId: string) => void;
}

export default function PatientDocumentosTab({
  documentos,
  onUpload,
  onDownload,
  onView,
}: PatientDocumentosTabProps) {
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'informe':
        return 'bg-blue-100 text-blue-700';
      case 'analisis':
        return 'bg-purple-100 text-purple-700';
      case 'imagen':
        return 'bg-green-100 text-green-700';
      case 'consentimiento':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Documentos del Paciente</h3>
            <p className="text-sm text-gray-500 mt-1">Total: {documentos.length} documentos</p>
          </div>
          <button
            onClick={onUpload}
            disabled={true}
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
            title="Funcionalidad en desarrollo"
          >
            <Upload className="w-4 h-4" />
            Subir Documento
          </button>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="space-y-4">
        {documentos.length > 0 ? (
          documentos.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{doc.nombre}</h4>
                    {doc.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">{doc.descripcion}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full font-medium ${getTipoColor(doc.tipo)}`}>
                        {doc.tipo}
                      </span>
                      <span>{format(doc.fechaSubida, "d 'de' MMM yyyy", { locale: es })}</span>
                      <span>Por: {doc.subidoPorNombre}</span>
                      {doc.tamano && <span>{(doc.tamano / 1024).toFixed(0)} KB</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(doc.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver documento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownload(doc.id)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay documentos registrados</p>
            <p className="text-xs text-gray-400">La funcionalidad de subida estará disponible próximamente</p>
          </div>
        )}
      </div>
    </div>
  );
}
