"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export function UploadZone({ onUpload, loading }: { onUpload: (f: File) => void; loading?: boolean }) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    onUpload(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 cursor-pointer ${isDragActive ? 'border-blue-500' : 'border-gray-200'}`}>
      <input {...getInputProps()} />
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">Arraste e solte seu currículo (PDF) aqui</p>
        <p className="text-sm text-gray-400 mt-2">Ou clique para selecionar um arquivo. Tamanho máximo: 5MB.</p>
        <div className="mt-4">
          <button
            type="button"
            className="px-6 py-2 bg-blue-600 text-white rounded-md"
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Selecionar PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
