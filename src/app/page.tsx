'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/UploadZone';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(file: File) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao analisar o currículo.');
        return;
      }

      sessionStorage.setItem('atsResult', JSON.stringify(data));
      router.push('/result');
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ATS Resume Analyzer</h1>
        <p className="text-gray-500 mb-8">Analise e corrija seu currículo com IA • Compatível com sistemas como Gupy, LinkedIn, Workday</p>

        <UploadZone onUpload={handleUpload} loading={loading} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <p className="mt-6 text-xs text-gray-400">Seu currículo não é armazenado. O processamento ocorre em tempo real.</p>
      </div>
    </main>
  );
}
