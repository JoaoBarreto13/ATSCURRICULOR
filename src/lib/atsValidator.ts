/**
 * Funções de teste para validar ATS compatibility e job matching
 * Uso: Import estas funções para testar a compatibilidade
 */

import { AnalysisResult, JobRequirement } from '@/types/resume';
import { matchResumeWithJob, calculateExperienceYears } from './jobMatcher';
import {
  isOpenEndedDate,
  validateDateRealism,
  normalizeExperienceDateRange,
} from './dateValidator';

/**
 * Valida se o currículo atende aos critérios de ATS básicos
 */
export function validateATSCompatibility(result: AnalysisResult): {
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const { extractedData } = result;

  // Validar informações de contato
  if (!extractedData.email || extractedData.email.trim() === '') {
    warnings.push('Email não encontrado - crítico para ATS');
  }

  if (!extractedData.phone || extractedData.phone.trim() === '') {
    warnings.push('Telefone não encontrado - crítico para ATS');
  }

  if (!extractedData.name || extractedData.name.trim() === '') {
    warnings.push('Nome não extraído corretamente');
  }

  // Validar resumo
  if (!extractedData.summary || extractedData.summary.trim().length < 50) {
    warnings.push('Resumo profissional muito curto ou ausente');
    recommendations.push(
      'Adicionar resumo profissional com 2-3 linhas destacando principais características',
    );
  }

  // Validar experiência
  if (!extractedData.experience || extractedData.experience.length === 0) {
    warnings.push('Nenhuma experiência profissional encontrada');
  } else {
    // Validar datas de experiência
    extractedData.experience.forEach((exp, idx) => {
      const normalized = normalizeExperienceDateRange(
        exp.startDate,
        exp.endDate,
      );

      if (!exp.startDate || exp.startDate.trim() === '') {
        warnings.push(`Experiência ${idx + 1}: data de início faltando`);
      }

      if (!exp.endDate || exp.endDate.trim() === '') {
        warnings.push(`Experiência ${idx + 1}: data de término faltando`);
      } else if (!isOpenEndedDate(exp.endDate) && !normalized.endDate) {
        warnings.push(
          `Experiência ${idx + 1}: data de término inválida (${exp.endDate})`,
        );
      }

      // Checar datas
      if (!isOpenEndedDate(exp.endDate)) {
        const endValidation = validateDateRealism(exp.endDate, true);
        if (!endValidation.isValid) {
          warnings.push(
            `Experiência ${idx + 1}: ${endValidation.issue || 'data inválida'}`,
          );
        }
      }

      if (normalized.startDate && normalized.endDate) {
        if (normalized.endDate < normalized.startDate) {
          warnings.push(
            `Experiência ${idx + 1}: datas invertidas (${exp.startDate} → ${exp.endDate})`,
          );
        }
      }

      if (!exp.bulletPoints || exp.bulletPoints.length === 0) {
        recommendations.push(
          `Experiência em ${exp.company || exp.role}: Adicionar bullet points com resultados mensuráveis`,
        );
      }
    });
  }

  // Validar educação
  if (!extractedData.education || extractedData.education.length === 0) {
    warnings.push('Educação/formação não encontrada');
  } else {
    // Verifica ano de graduação futuro ou inválido
    extractedData.education.forEach((edu, idx) => {
      if (edu.graduationYear) {
        const raw = edu.graduationYear.trim();
        const yearMatch = raw.match(/^(\d{4})$/) || raw.match(/(\d{4})/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const currentYear = new Date().getFullYear();
          if (year > currentYear) {
            warnings.push(
              `Educação ${idx + 1}: ano de graduação no futuro (${edu.graduationYear})`,
            );
          }
        }
      }
    });
  }

  // Validar skills
  if (!extractedData.skills || extractedData.skills.length < 3) {
    recommendations.push('Adicionar mais skills técnicas à seção de habilidades');
  }

  // Validar ATS Score
  if (result.atsScore < 50) {
    warnings.push(
      `Score ATS baixo (${result.atsScore}/100) - currículo pode não passar em filtros automáticos`,
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    recommendations,
  };
}

/**
 * Testa se o currículo é compatível com uma vaga específica
 * @param result - Resultado da análise ATS
 * @param jobRequirement - Requisitos da vaga
 * @returns Compatibilidade em porcentagem e detalhes
 */
export function testJobCompatibility(
  result: AnalysisResult,
  jobRequirement: JobRequirement,
) {
  const matchResult = matchResumeWithJob(
    result.extractedData,
    jobRequirement,
  );

  return {
    job: jobRequirement.title,
    matchPercentage: matchResult.matchPercentage,
    isQualified: matchResult.matchPercentage >= 80,
    details: {
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      experienceYears: matchResult.experienceYears,
      ageCompatible: matchResult.ageCompatible,
      ageDetails: matchResult.ageDetails,
      educationMatch: matchResult.educationMatch,
      languageMatch: matchResult.languageMatch,
    },
    recommendations: matchResult.recommendations,
  };
}

/**
 * Testa múltiplas vagas contra um currículo
 * Útil para simular o candidato em múltiplas posições
 */
export function testAgainstMultipleJobs(
  result: AnalysisResult,
  jobs: JobRequirement[],
) {
  return jobs.map((job) => testJobCompatibility(result, job));
}

/**
 * Exemplo de uso - dados de teste
 */
export const EXAMPLE_JOB_REQUIREMENTS: JobRequirement = {
  title: 'Senior Full Stack Developer',
  requiredSkills: [
    'TypeScript',
    'React',
    'Node.js',
    'PostgreSQL',
    'Git',
  ],
  preferredSkills: ['Next.js', 'Docker', 'AWS'],
  minExperienceYears: 5,
  maxAge: 60,
  minAge: 25,
  educationLevel: 'Bachelor',
  requiredLanguages: [
    { language: 'English', minLevel: 'Intermediário' },
    { language: 'Português', minLevel: 'Fluente' },
  ],
};

/**
 * Log estruturado de compatibilidade (para debug)
 */
export function logATSValidation(result: AnalysisResult): void {
  const validation = validateATSCompatibility(result);

  console.group('📋 ATS Validation Report');
  console.log(`Status: ${validation.isValid ? '✅ VALID' : '⚠️ WARNINGS'}`);

  if (validation.warnings.length > 0) {
    console.group('Warnings:');
    validation.warnings.forEach((w) => console.warn(`  - ${w}`));
    console.groupEnd();
  }

  if (validation.recommendations.length > 0) {
    console.group('Recommendations:');
    validation.recommendations.forEach((r) => console.info(`  - ${r}`));
    console.groupEnd();
  }

  console.log(`ATS Score: ${result.atsScore}/100`);
  console.log(`Experience: ${calculateExperienceYears(result.extractedData)} years`);
  console.groupEnd();
}

/**
 * Log de job matching (para debug)
 */
export function logJobMatching(
  result: AnalysisResult,
  job: JobRequirement,
): void {
  const match = testJobCompatibility(result, job);

  console.group(`🎯 Job Match: ${match.job}`);
  console.log(`Match: ${match.matchPercentage}%`);
  console.log(`Qualified: ${match.isQualified ? '✅ YES' : '❌ NO'}`);

  console.group('Skills:');
  console.log(`  Matched: ${match.details.matchedSkills.join(', ') || 'none'}`);
  console.log(`  Missing: ${match.details.missingSkills.join(', ') || 'none'}`);
  console.groupEnd();

  console.log(`Experience: ${match.details.experienceYears} years`);
  console.log(`Age Compatible: ${match.details.ageCompatible} (${match.details.ageDetails})`);
  console.log(`Education Match: ${match.details.educationMatch ? '✅' : '❌'}`);

  if (match.recommendations.length > 0) {
    console.group('Recommendations:');
    match.recommendations.forEach((r) => console.info(`  - ${r}`));
    console.groupEnd();
  }

  console.groupEnd();
}
