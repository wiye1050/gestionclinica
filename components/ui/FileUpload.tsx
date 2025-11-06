'use client';

import { useState } from 'react';
import { uploadFileToStorage } from '@/lib/storage/helpers';
import { Upload, X, File } from 'lucide-react';

interface FileUploadProps {
  folder: string;
  onUpload: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({ folder, onUpload, accept, maxSizeMB = 10 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo supera el tamaño máximo de ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const url = await uploadFileToStorage(file, folder);
      setUploadedUrl(url);
      onUpload(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setUploadedUrl('');
    setError('');
  };

  return (
    <div className="space-y-3">
      {!uploadedUrl ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:bg-gray-100">
          <Upload className="h-8 w-8 text-gray-400" />
          <span className="mt-2 text-sm text-gray-600">
            {uploading ? 'Subiendo...' : 'Click para seleccionar archivo'}
          </span>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            accept={accept}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">Archivo subido</span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
