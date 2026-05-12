"use client";

import { AnalysisResult } from '@/types/resume';
import { useState } from 'react';

export function DownloadButton({ analysisResult }: { analysisResult: AnalysisResult }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResult),
      });

      if (!res.ok) {
        let apiMessage = 'Erro ao gerar o PDF. Tente novamente.';
        try {
          const payload = await res.json();
          if (typeof payload?.error === 'string' && payload.error.trim()) {
            apiMessage = payload.error;
          }
        } catch {
          // Se a API não retornar JSON, mantemos a mensagem padrão.
        }
        throw new Error(apiMessage);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        throw new Error('Resposta inválida ao gerar PDF. Tente novamente em instantes.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo-ats-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar o PDF. Tente novamente.';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center py-6">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Gerando PDF...' : '⬇️ Baixar Currículo Corrigido (PDF)'}
      </button>
      <p className="mt-2 text-sm text-gray-400">O PDF gerado é formatado para ser 100% legível por sistemas ATS</p>
    </div>
  );
}
