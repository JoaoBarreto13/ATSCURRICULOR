'use client';

import { AnalysisResult, JobRequirement } from '@/types/resume';
import { matchResumeWithJob } from '@/lib/jobMatcher';
import { useState } from 'react';

interface JobMatchProps {
  analysisResult: AnalysisResult;
}

export function JobMatchAnalyzer({ analysisResult }: JobMatchProps) {
  const [customJob, setCustomJob] = useState<Partial<JobRequirement>>({
    title: 'Vaga de Teste',
    requiredSkills: [],
  });

  const [showForm, setShowForm] = useState(false);

  function handleMatchTest() {
    if (!customJob.title || !customJob.requiredSkills?.length) {
      alert('Preencha título da vaga e pelo menos uma skill');
      return;
    }

    const jobReq: JobRequirement = {
      title: customJob.title || 'Sem título',
      requiredSkills: customJob.requiredSkills || [],
      minExperienceYears: customJob.minExperienceYears,
      minAge: customJob.minAge,
      maxAge: customJob.maxAge,
    };

    const match = matchResumeWithJob(analysisResult.extractedData, jobReq);

    alert(
      `Compatibilidade: ${match.matchPercentage}%\n\n` +
        `Skills combivadas: ${match.matchedSkills.join(', ') || 'nenhuma'}\n` +
        `Skills faltando: ${match.missingSkills.join(', ') || 'nenhuma'}\n\n` +
        `Idade compatível: ${match.ageCompatible ? 'Sim' : 'Não'} (${match.ageDetails})\n` +
        `Experiência: ${match.experienceYears} anos\n\n` +
        `Recomendações:\n${match.recommendations.map((r) => `• ${r}`).join('\n') || 'Nenhuma'}`
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Testador de Compatibilidade com Vagas</h2>

      <p className="text-sm text-gray-600 mb-4">
        Use esta ferramenta para testar se seu currículo é compatível com determinadas vagas. Insira os
        requisitos da vaga e veja o score de compatibilidade.
      </p>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
        >
          + Testar Compatibilidade com Vaga
        </button>
      ) : (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da Vaga</label>
            <input
              type="text"
              value={customJob.title || ''}
              onChange={(e) => setCustomJob({ ...customJob, title: e.target.value })}
              placeholder="Ex: Senior React Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills Requeridas (separadas por vírgula)</label>
            <input
              type="text"
              value={customJob.requiredSkills?.join(', ') || ''}
              onChange={(e) =>
                setCustomJob({
                  ...customJob,
                  requiredSkills: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Ex: React, TypeScript, Node.js"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experiência Mínima (anos)</label>
              <input
                type="number"
                value={customJob.minExperienceYears || ''}
                onChange={(e) =>
                  setCustomJob({
                    ...customJob,
                    minExperienceYears: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Ex: 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idade Máxima</label>
              <input
                type="number"
                value={customJob.maxAge || ''}
                onChange={(e) =>
                  setCustomJob({
                    ...customJob,
                    maxAge: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Ex: 65"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleMatchTest}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors font-medium"
            >
              🔍 Testar Compatibilidade
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>💡 Dica:</strong> Este teste simula como um ATS automático analisaria seu currículo contra
          requisitos de vagas. Uma compatibilidade de 80%+ é considerada excelente!
        </p>
      </div>
    </div>
  );
}
