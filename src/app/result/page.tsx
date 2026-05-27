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
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('atsResult');
    if (!stored) {
      router.push('/');
      return;
    }
    try {
      setAnalysisResult(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem('atsResult');
      router.push('/');
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (analysisResult) {
      sessionStorage.setItem('atsResult', JSON.stringify(analysisResult));
    }
  }, [analysisResult]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto text-gray-500">Carregando resultado...</div>
      </main>
    );
  }

  if (!analysisResult) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Resultado da Análise ATS</h1>
          <button onClick={() => router.push('/')} className="text-sm text-blue-600 hover:underline">← Analisar outro currículo</button>
        </div>

        <ScoreCard score={analysisResult.atsScore} feedback={analysisResult.generalFeedback} />

        <IssuesList issues={analysisResult.issues} />

        <CorrectedResume analysisResult={analysisResult} onChange={setAnalysisResult} />

        <DownloadButton analysisResult={analysisResult} />

        <JobMatchAnalyzer analysisResult={analysisResult} />

      </div>
    </main>
  );
}
