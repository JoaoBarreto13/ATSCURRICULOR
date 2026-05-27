"use client";

import { AnalysisResult } from '@/types/resume';
import { useState } from 'react';

export function DownloadButton({ analysisResult }: { analysisResult: AnalysisResult }) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');

  const downloadConfig = {
    pdf: {
      route: '/api/generate-pdf',
      contentType: 'application/pdf',
      filename: `curriculo-ats-${Date.now()}.pdf`,
      label: 'PDF',
      loadingLabel: 'Gerando PDF...',
      buttonLabel: '⬇️ Baixar PDF',
    },
    docx: {
      route: '/api/generate-docx',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      filename: `curriculo-ats-${Date.now()}.docx`,
      label: 'DOCX',
      loadingLabel: 'Gerando DOCX...',
      buttonLabel: '⬇️ Baixar DOCX',
    },
  } as const;

  async function handleDownload() {
    setLoading(true);
    try {
      const selectedFormat = downloadConfig[format];
      const res = await fetch(selectedFormat.route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResult),
      });

      if (!res.ok) {
        let apiMessage = `Erro ao gerar o ${selectedFormat.label}. Tente novamente.`;
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
      if (!contentType.includes(selectedFormat.contentType)) {
        throw new Error(`Resposta inválida ao gerar o ${selectedFormat.label}. Tente novamente em instantes.`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFormat.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao gerar o arquivo. Tente novamente.';
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 p-1 mb-4">
        {(['pdf', 'docx'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFormat(item)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              format === item ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {downloadConfig[item].label}
          </button>
        ))}
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition-colors disabled:opacity-50"
      >
        {loading ? downloadConfig[format].loadingLabel : downloadConfig[format].buttonLabel}
      </button>
      <p className="mt-2 text-sm text-gray-400">
        O arquivo gerado usa o conteúdo editado no front end e mantém o texto pronto para ATS.
      </p>
    </div>
  );
}
