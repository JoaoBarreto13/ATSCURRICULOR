'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisResult } from '@/types/resume';
import { ScoreCard } from '@/components/ScoreCard';
import { IssuesList } from '@/components/IssuesList';
import { CorrectedResume } from '@/components/CorrectedResume';
import { DownloadButton } from '@/components/DownloadButton';
import { JobMatchAnalyzer } from '@/components/JobMatchAnalyzer';

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('atsResult');
    if (!stored) {
      router.push('/');
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem('atsResult');
      router.push('/');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-gray-500">Carregando resultado...</div>
      </main>
    );
  }

  if (!result) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Resultado da Análise ATS</h1>
          <button onClick={() => router.push('/')} className="text-sm text-blue-600 hover:underline">← Analisar outro currículo</button>
        </div>

        <ScoreCard score={result.atsScore} feedback={result.generalFeedback} />

        <IssuesList issues={result.issues} />

        <CorrectedResume extractedData={result.extractedData} correctedResume={result.correctedResume} />

        <DownloadButton analysisResult={result} />

        <JobMatchAnalyzer analysisResult={result} />

      </div>
    </main>
  );
}
