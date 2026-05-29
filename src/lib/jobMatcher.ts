import {
  ExtractedData,
  JobRequirement,
  JobMatchResult,
} from '@/types/resume';
import {
  isOpenEndedDate,
  normalizeExperienceDateRange,
  calculateMonthsDifference,
} from './dateValidator';

/**
 * Calcula os anos de experiência baseado no histórico de empregos
 */
export function calculateExperienceYears(extractedData: ExtractedData): number {
  if (!extractedData.experience || extractedData.experience.length === 0) {
    return 0;
  }

  let totalMonths = 0;
  const today = new Date();

  extractedData.experience.forEach((exp) => {
    const normalized = normalizeExperienceDateRange(exp.startDate, exp.endDate);

    if (normalized.startDate && normalized.endDate) {
      const diffMonths = calculateMonthsDifference(
        normalized.startDate,
        normalized.endDate,
      );
      if (diffMonths > 0) {
        totalMonths += diffMonths;
      }
    }
  });

  return Math.round((totalMonths / 12) * 10) / 10; // Retorna anos com 1 decimal
}

/**
 * Calcula a idade baseada na data de nascimento
 */
export function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;

  // Parsear data de nascimento manualmente
  const raw = birthDate.trim();
  let birth: Date | null = null;

  // Tenta formato YYYY-MM-DD
  const yyyymmddMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Tenta formato DD/MM/YYYY
  if (!birth) {
    const ddmmyyyyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  if (!birth || isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age > 0 && age < 150 ? age : null;
}

/**
 * Normaliza skills para comparação (lowercase, trim)
 */
function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim();
}

/**
 * Verifica compatibilidade entre skills do currículo e da vaga
 */
function matchSkills(
  resumeSkills: string[],
  requiredSkills: string[],
): {
  matched: string[];
  missing: string[];
} {
  const normalizedResumeSkills = resumeSkills.map(normalizeSkill);
  const normalizedRequiredSkills = requiredSkills.map(normalizeSkill);

  const matched = normalizedRequiredSkills.filter((skill) =>
    normalizedResumeSkills.some(
      (resumeSkill) =>
        resumeSkill.includes(skill) || skill.includes(resumeSkill),
    ),
  );

  const missing = normalizedRequiredSkills.filter(
    (skill) => !matched.includes(skill),
  );

  return {
    matched: matched.map((m) => {
      // Retorna o skill original do currículo se possível
      const idx = normalizedRequiredSkills.indexOf(m);
      return requiredSkills[idx] || m;
    }),
    missing,
  };
}

/**
 * Verifica compatibilidade de idade
 */
function checkAgeCompatibility(
  resumeAge: number | null,
  minAge: number | undefined,
  maxAge: number | undefined,
): { compatible: boolean; details: string } {
  if (resumeAge === null) {
    return {
      compatible: true,
      details: 'Idade não informada no currículo',
    };
  }

  let compatible = true;
  let details = `Candidato com ${resumeAge} anos`;

  if (minAge && resumeAge < minAge) {
    compatible = false;
    details += ` (mínimo ${minAge} anos requerido)`;
  }

  if (maxAge && resumeAge > maxAge) {
    compatible = false;
    details += ` (máximo ${maxAge} anos permitido)`;
  }

  if (compatible && !minAge && !maxAge) {
    details += ' - Dentro do esperado';
  }

  return { compatible, details };
}

/**
 * Mapeia o grau de educação para um nível numérico (para comparação)
 */
function getEducationRank(degree: string): number {
  const norm = degree.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (norm.includes('phd') || norm.includes('doutorado')) return 4;
  if (norm.includes('master') || norm.includes('mestrado')) return 3;
  if (norm.includes('bachelor') || norm.includes('bacharel') || norm.includes('tecnologo') || norm.includes('licenciatura')) return 2;
  if (norm.includes('tecnico')) return 1;
  return 0;
}

/**
 * Verifica compatibilidade de educação
 */
function checkEducationMatch(
  education: string[],
  requiredLevel: string | undefined,
): boolean {
  if (!requiredLevel) return true;

  const reqRanks: Record<string, number> = {
    'Técnico': 1,
    'Bachelor': 2,
    'Master': 3,
    'PhD': 4,
  };

  const requiredRank = reqRanks[requiredLevel] || 0;
  if (requiredRank === 0) return true;

  return education.some((edu) => getEducationRank(edu) >= requiredRank);
}

/**
 * Compara currículo com requisitos de vaga
 * Retorna score de compatibilidade 0-100%
 */
export function matchResumeWithJob(
  extractedData: ExtractedData,
  jobRequirement: JobRequirement,
): JobMatchResult {
  const experienceYears = calculateExperienceYears(extractedData);
  const resumeAge = calculateAge(extractedData.birthDate);

  // 1. Verificar skills (40%)
  const { matched, missing } = matchSkills(
    extractedData.skills,
    jobRequirement.requiredSkills,
  );
  const skillsScore =
    jobRequirement.requiredSkills.length > 0
      ? (matched.length / jobRequirement.requiredSkills.length) * 40
      : 40;

  // 2. Verificar experiência (25%)
  let experienceScore = 0;
  if (jobRequirement.minExperienceYears) {
    if (experienceYears >= jobRequirement.minExperienceYears) {
      experienceScore = 25;
    } else {
      const ratio = experienceYears / jobRequirement.minExperienceYears;
      experienceScore = ratio * 25;
    }
  } else {
    experienceScore = 25;
  }

  // 3. Verificar idade (15%)
  const {
    compatible: ageCompatible,
    details: ageDetails,
  } = checkAgeCompatibility(
    resumeAge,
    jobRequirement.minAge,
    jobRequirement.maxAge,
  );
  const ageScore = ageCompatible ? 15 : 0;

  // 4. Verificar educação (10%)
  const educationMatch = checkEducationMatch(
    extractedData.education.map((e) => e.degree),
    jobRequirement.educationLevel,
  );
  const educationScore = educationMatch ? 10 : 5;

  // 5. Verificar idiomas (10%)
  let languageScore = 0;
  let languageMatch = true;
  if (jobRequirement.requiredLanguages && jobRequirement.requiredLanguages.length > 0) {
    const levelOrder = ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'];
    const matchedLanguages = jobRequirement.requiredLanguages.filter((req) => {
      const candidateLanguage = extractedData.languages.find(
        (l) => normalizeSkill(l.language) === normalizeSkill(req.language),
      );
      if (!candidateLanguage) return false;

      const reqLevelIdx = levelOrder.indexOf(req.minLevel);
      const candLevelIdx = levelOrder.indexOf(candidateLanguage.level);

      return candLevelIdx >= reqLevelIdx;
    });

    languageMatch = matchedLanguages.length === jobRequirement.requiredLanguages.length;
    languageScore =
      (matchedLanguages.length / jobRequirement.requiredLanguages.length) * 10;
  } else {
    languageScore = 10;
    languageMatch = true;
  }

  const matchPercentage = Math.round(
    skillsScore + experienceScore + ageScore + educationScore + languageScore,
  );

  // Gerar recomendações
  const recommendations: string[] = [];

  if (missing.length > 0) {
    recommendations.push(
      `Adquirir skills: ${missing.join(', ')}`,
    );
  }

  if (jobRequirement.minExperienceYears && experienceYears < jobRequirement.minExperienceYears) {
    recommendations.push(
      `Ganhar mais ${Math.round(jobRequirement.minExperienceYears - experienceYears)} anos de experiência`,
    );
  }

  if (!ageCompatible) {
    recommendations.push(`Revisão de idade: ${ageDetails}`);
  }

  if (!educationMatch && jobRequirement.educationLevel) {
    recommendations.push(
      `Completar/melhorar educação para ${jobRequirement.educationLevel}`,
    );
  }

  return {
    matchPercentage,
    matchedSkills: matched,
    missingSkills: missing,
    ageCompatible,
    ageDetails,
    experienceYears,
    educationMatch,
    languageMatch,
    recommendations,
  };
}
