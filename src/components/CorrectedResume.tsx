import { AnalysisResult, CorrectedResume as CR, ExtractedData, Education } from '@/types/resume';
import { useEffect, useState } from 'react';
import { formatEducationLabel } from '@/lib/resumeDisplay';

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
  
  // Utiliza os metadados (cargo, empresa, datas) estritamente do currículo original,
  // mas as "Responsabilidades / Conquistas" vêm da IA (se geradas) para ficarem formatadas para ATS.
  const experienceItems = (extractedData.experience || []).map((exp, idx) => {
    const correctedExp = correctedResume.experienceRewritten?.[idx];
    const bulletPoints = correctedExp?.bulletPoints?.length 
      ? correctedExp.bulletPoints 
      : exp.bulletPoints || [];

    return {
      ...exp,
      bulletPoints,
    };
  });

  const [skillsText, setSkillsText] = useState(extractedData.skills.join(', '));

  useEffect(() => {
    setSkillsText(extractedData.skills.join(', '));
  }, [extractedData.skills]);

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
    setSkillsText(value);
    updateAnalysis({
      ...extractedData,
      skills: splitSkills(value),
    });
  };

  const updateGithub = (value: string) => {
    updateAnalysis({
      ...extractedData,
      github: value.trim(),
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

  const updateExperienceField = (
    index: number,
    field: keyof typeof experienceItems[number],
    value: string,
  ) => {
    // Atualiza apenas os metadados no extractedData
    const nextExperience = (extractedData.experience || []).map((exp, currentIndex) =>
      currentIndex === index ? { ...exp, [field]: value } : exp,
    );

    updateAnalysis(
      {
        ...extractedData,
        experience: nextExperience,
      },
      correctedResume // Não alteramos a IA base (correctedResume) para metadados
    );
  };

  const updateExperienceBulletPoints = (index: number, value: string) => {
    const bullets = value
      .split(/\n|\r\n/)
      .map((b) => b.replace(/^•\s*/, '').trim())
      .filter(Boolean);

    // Se houver bulletPoints editados, atualizamos *apenas* a versão corrigida (correctedResume),
    // para que esses bullets sejam a nova base exibida e exportada
    const nextCorrectedExperience = [...(correctedResume.experienceRewritten || [])];
    
    // Garantir que a entidade existe no index
    if (!nextCorrectedExperience[index]) {
      const baseExp = extractedData.experience[index];
      nextCorrectedExperience[index] = { ...baseExp, bulletPoints: bullets };
    } else {
      nextCorrectedExperience[index] = { ...nextCorrectedExperience[index], bulletPoints: bullets };
    }

    updateAnalysis(
      extractedData,
      {
        ...correctedResume,
        experienceRewritten: nextCorrectedExperience,
      }
    );
  };

  const addExperience = () => {
    const defaultExp = { company: '', role: '', startDate: '', endDate: '', bulletPoints: [] };
    const nextExperience = [...(extractedData.experience || []), defaultExp];
    
    // Adiciona array dummy no correctedResume para alinhar o índice
    const nextCorrectedExperience = [...(correctedResume.experienceRewritten || []), defaultExp];

    updateAnalysis(
      { ...extractedData, experience: nextExperience },
      { ...correctedResume, experienceRewritten: nextCorrectedExperience }
    );
  };

  const removeExperience = (index: number) => {
    const nextExperience = (extractedData.experience || []).filter((_, i) => i !== index);
    const nextCorrectedExperience = (correctedResume.experienceRewritten || []).filter((_, i) => i !== index);

    updateAnalysis(
      { ...extractedData, experience: nextExperience },
      { ...correctedResume, experienceRewritten: nextCorrectedExperience }
    );
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
        <label className="block font-semibold text-gray-900 mb-2" htmlFor="resume-github">
          GitHub
        </label>
        <input
          id="resume-github"
          value={extractedData.github || ''}
          onChange={(event) => updateGithub(event.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="https://github.com/seu-perfil"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-gray-900">Experiência</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addExperience}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Adicionar experiência
            </button>
          </div>
        </div>

        <div className="space-y-3 mt-2">
          {experienceItems.length > 0 ? experienceItems.map((exp, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">Experiência {i + 1}</p>
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remover
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Cargo</span>
                  <input
                    value={exp.role}
                    onChange={(event) => updateExperienceField(i, 'role', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Empresa</span>
                  <input
                    value={exp.company}
                    onChange={(event) => updateExperienceField(i, 'company', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Início</span>
                  <input
                    value={exp.startDate}
                    onChange={(event) => updateExperienceField(i, 'startDate', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Ex.: 01/2022"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-gray-600">Término</span>
                  <input
                    value={exp.endDate}
                    onChange={(event) => updateExperienceField(i, 'endDate', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Ex.: Presente"
                  />
                </label>
                <label className="block text-sm md:col-span-2">
                  <span className="mb-1 block text-gray-600">Responsabilidades / Conquistas (uma por linha)</span>
                  <textarea
                    value={(exp.bulletPoints || []).join('\n')}
                    onChange={(event) => updateExperienceBulletPoints(i, event.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="- Implementou...\n- Melhorou..."
                  />
                </label>
              </div>

              <div>
                <p className="text-xs text-gray-500">Prévia:</p>
                <ul className="list-disc pl-5 text-sm">
                  {(exp.bulletPoints || []).map((bp, j) => (
                    <li key={j}>{bp.replace(/^•\s*/, '')}</li>
                  ))}
                </ul>
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              Experiência não identificada na extração do currículo.
            </div>
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
            <div key={i} className="rounded-lg border border-gray-200 p-4 bg-gray-50 space-y-3">
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
              <p className="text-xs text-gray-500">Prévia: {formatEducationLabel(edu)}</p>
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
          value={skillsText}
          onChange={(event) => updateSkills(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          placeholder="Liste as habilidades separadas por vírgula ou por linha"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {splitSkills(skillsText).length > 0 ? splitSkills(skillsText).map((skill, i) => (
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
