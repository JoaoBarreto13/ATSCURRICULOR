import {
  ExtractedData,
  JobRequirement,
  JobMatchResult,
} from '@/types/resume';

const OPEN_ENDED_DATE_VALUES = new Set([
  'atual',
  'presente',
  'atualmente',
  'current',
  'present',
]);

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
    const normalized = normalizeExperienceRange(exp.startDate, exp.endDate, today);

    if (normalized.startDate && normalized.endDate) {
      const diffMonths = getMonthDifference(normalized.startDate, normalized.endDate);
      if (diffMonths > 0) {
        totalMonths += diffMonths;
      }
    }
  });

  return Math.round(totalMonths / 12 * 10) / 10; // Retorna anos com 1 decimal
}

/**
 * Calcula a idade baseada na data de nascimento
 */
export function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;

  const birth = parseDate(birthDate);
  if (!birth) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Converte strings de data em formato MM/YYYY ou YYYY-MM-DD para objeto Date
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const raw = dateStr.trim();
  const normalizedValue = raw.toLowerCase();
  if (OPEN_ENDED_DATE_VALUES.has(normalizedValue)) return new Date();

  // Remove prefix non-digit characters (ex: em dash, bullets)
  const cleaned = raw.replace(/^\D+/, '').trim();

  // Formato MM/YYYY
  const mmyyyyMatch = cleaned.match(/^(\d{2})\/(\d{4})$/);
  if (mmyyyyMatch) {
    const [, month, year] = mmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, 1);
  }

  // Formato YYYY-MM-DD
  const yyyymmddMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Formato AAAA (ano apenas)
  const yyyyMatch = cleaned.match(/^(\d{4})$/);
  if (yyyyMatch) {
    const year = parseInt(yyyyMatch[1]);
    return new Date(year, 0, 1);
  }

  // Tenta parse normal
  const parsed = new Date(cleaned);
  return !isNaN(parsed.getTime()) ? parsed : null;
}

function normalizeExperienceRange(
  startDate: string,
  endDate: string,
  today: Date,
): { startDate: Date | null; endDate: Date | null } {
  const start = parseDate(startDate);
  let end = parseDate(endDate);

  if (end && end > today) {
    end = today;
  }

  if (start && end && end < start) {
    return {
      startDate: end,
      endDate: start,
    };
  }

  return {
    startDate: start,
    endDate: end,
  };
}

function getMonthDifference(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();

  return Math.max(0, yearDiff * 12 + monthDiff + 1);
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
 * Verifica compatibilidade de educação
 */
function checkEducationMatch(
  education: string[],
  requiredLevel: string | undefined,
): boolean {
  if (!requiredLevel) return true;

  const educationLevels = ['Técnico', 'Bachelor', 'Master', 'PhD'];
  const requiredIndex = educationLevels.indexOf(requiredLevel);

  if (requiredIndex === -1) return true;

  const hasHigherOrEqual = education.some((edu) => {
    const eduNormalized = edu.toLowerCase();
    return educationLevels.some(
      (level, idx) =>
        idx >= requiredIndex &&
        eduNormalized.includes(level.toLowerCase()),
    );
  });

  return hasHigherOrEqual;
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
