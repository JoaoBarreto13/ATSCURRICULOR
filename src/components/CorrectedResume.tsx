import { CorrectedResume as CR, ExtractedData } from '@/types/resume';

export function CorrectedResume({ extractedData, correctedResume }: { extractedData: ExtractedData; correctedResume: CR }) {
  const summary = correctedResume.summary || extractedData.summary;
  const experienceItems =
    correctedResume.experienceRewritten.length > 0
      ? correctedResume.experienceRewritten
      : extractedData.experience;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Currículo Corrigido (Preview)</h2>

      <div>
        <h3 className="font-semibold">Resumo</h3>
        <p className="text-sm text-gray-700 mb-3">{summary || 'Resumo não identificado na extração do currículo.'}</p>
      </div>

      <div>
        <h3 className="font-semibold mt-4">Experiência</h3>
        <div className="space-y-3 mt-2">
          {experienceItems.length > 0 ? experienceItems.map((exp, i) => (
            <div key={i} className="p-3 border rounded-md">
              <div className="font-semibold">{exp.role} — {exp.company}</div>
              <div className="text-xs text-gray-500 mb-2">{exp.startDate} — {exp.endDate}</div>
              <ul className="list-disc pl-5 text-sm">
                {(exp.bulletPoints || []).map((bp, j) => (
                  <li key={j}>{bp.replace(/^•\s*/, '')}</li>
                ))}
              </ul>
            </div>
          )) : (
            <p className="text-sm text-gray-500">Experiência não identificada na extração do currículo.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mt-4">Educação</h3>
        <div className="mt-2">
          {extractedData.education.length > 0 ? extractedData.education.map((edu, i) => (
            <div key={i} className="text-sm">
              <div className="font-medium">{edu.degree} em {edu.field}</div>
              <div className="text-xs text-gray-500">{edu.institution} — {edu.graduationYear}</div>
            </div>
          )) : (
            <p className="text-sm text-gray-500">Educação não identificada na extração do currículo.</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mt-4">Habilidades</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {extractedData.skills.length > 0 ? extractedData.skills.map((s, i) => (
            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{s}</span>
          )) : (
            <p className="text-sm text-gray-500">Habilidades não identificadas na extração do currículo.</p>
          )}
        </div>
      </div>

    </div>
  );
}
