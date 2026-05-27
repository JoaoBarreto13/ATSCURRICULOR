import { AnalysisResult, CorrectedResume as CR, ExtractedData, Education } from '@/types/resume';
import { getResumeSkills } from '@/lib/resumeSkills';

function formatEducationItem(education: Education): string {
  const degreeLabel = [education.degree, education.field ? `em ${education.field}` : '']
    .filter(Boolean)
    .join(' ')
    .trim();
  const graduationLabel = education.graduationYear?.trim() ? education.graduationYear.trim() : 'Em andamento';

  return `${degreeLabel || 'Formação'} — ${education.institution || 'Instituição não informada'} (${graduationLabel})`;
}

function splitSkills(text: string): string[] {
  return text
    .split(/,|\n/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function CorrectedResume({
  analysisResult,
  onChange,
}: {
  analysisResult: AnalysisResult;
  onChange: (nextResult: AnalysisResult) => void;
}) {
  const { extractedData, correctedResume } = analysisResult;
  const summary = correctedResume.summary || extractedData.summary;
  const experienceItems =
    correctedResume.experienceRewritten.length > 0
      ? correctedResume.experienceRewritten
      : extractedData.experience;
  const displayedSkills = extractedData.skills.length > 0
    ? extractedData.skills
    : correctedResume.suggestedKeywords;

  const updateAnalysis = (nextExtractedData: ExtractedData, nextCorrectedResume: CR = correctedResume) => {
    onChange({
      ...analysisResult,
      extractedData: nextExtractedData,
      correctedResume: nextCorrectedResume,
    });
  };

  const updateSummary = (value: string) => {
    updateAnalysis(
      {
        ...extractedData,
        summary: value,
      },
      {
        ...correctedResume,
        summary: value,
      },
    );
  };

  const updateSkills = (value: string) => {
    updateAnalysis({
      ...extractedData,
      skills: splitSkills(value),
    });
  };

  const updateEducationField = (index: number, field: keyof Education, value: string) => {
    const nextEducation = extractedData.education.map((education, currentIndex) =>
      currentIndex === index ? { ...education, [field]: value } : education,
    );

    updateAnalysis({
      ...extractedData,
      education: nextEducation,
    });
  };

  const addEducation = () => {
    updateAnalysis({
      ...extractedData,
      education: [
        ...extractedData.education,
        {
          degree: '',
          field: '',
          institution: '',
          graduationYear: '',
        },
      ],
    });
  };

  const removeEducation = (index: number) => {
    updateAnalysis({
      ...extractedData,
      education: extractedData.education.filter((_, currentIndex) => currentIndex !== index),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Currículo Corrigido</h2>
        <p className="text-sm text-gray-500">
          Ajuste os campos abaixo no front end antes de baixar o PDF. As mudanças são refletidas no preview e no download.
        </p>
      </div>

      <div>
        <label className="block font-semibold text-gray-900 mb-2" htmlFor="resume-summary">
          Resumo
        </label>
        <textarea
          id="resume-summary"
          value={summary}
          onChange={(event) => updateSummary(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Resumo não identificado na extração do currículo."
        />
      </div>

      <div>
        <h3 className="font-semibold text-gray-900">Experiência</h3>
        <div className="space-y-3 mt-2">
          {experienceItems.length > 0 ? experienceItems.map((exp, i) => (
            <div key={`${exp.company}-${exp.role}-${i}`} className="p-3 border rounded-md bg-gray-50">
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
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-semibold text-gray-900">Educação</h3>
          <button
            type="button"
            onClick={addEducation}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + Adicionar formação
          </button>
        </div>
        <div className="space-y-3">
          {extractedData.education.length > 0 ? extractedData.education.map((edu, i) => (
            <div key={`${edu.institution}-${edu.degree}-${i}`} className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">Formação {i + 1}</p>
                <button
                  type="button"
                  onClick={() => removeEducation(i)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remover
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Grau</span>
                  <input
                    value={edu.degree}
                    onChange={(event) => updateEducationField(i, 'degree', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Área</span>
                  <input
                    value={edu.field}
                    onChange={(event) => updateEducationField(i, 'field', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm md:col-span-2">
                  <span className="mb-1 block text-gray-600">Instituição</span>
                  <input
                    value={edu.institution}
                    onChange={(event) => updateEducationField(i, 'institution', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm md:col-span-2">
                  <span className="mb-1 block text-gray-600">Ano de conclusão ou status</span>
                  <input
                    value={edu.graduationYear}
                    onChange={(event) => updateEducationField(i, 'graduationYear', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Ex.: 2025 ou Em andamento"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">Prévia: {formatEducationItem(edu)}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              Educação não identificada na extração do currículo.
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block font-semibold text-gray-900 mb-2" htmlFor="resume-skills">
          Habilidades
        </label>
        <textarea
          id="resume-skills"
          value={displayedSkills.join(', ')}
          onChange={(event) => updateSkills(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Liste as habilidades separadas por vírgula ou por linha"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {displayedSkills.length > 0 ? displayedSkills.map((skill, i) => (
            <span key={`${skill}-${i}`} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
              {skill}
            </span>
          )) : (
            <p className="text-sm text-gray-500">Habilidades não identificadas na extração do currículo.</p>
          )}
        </div>
      </div>

    </div>
  );
}
