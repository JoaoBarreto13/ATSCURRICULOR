import type { Education, ExtractedData } from '@/types/resume';

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeDegreeLabel(degree: string): string {
  const normalized = stripDiacritics(degree.trim().toLowerCase());

  if (!normalized) {
    return '';
  }

  const degreeLabels: Record<string, string> = {
    bachelor: 'Bacharelado',
    bachelerado: 'Bacharelado',
    bacharelado: 'Bacharelado',
    master: 'Mestrado',
    mestrado: 'Mestrado',
    phd: 'Doutorado',
    doutorado: 'Doutorado',
    tecnico: 'Técnico',
    tecnólogo: 'Tecnólogo',
    tecnologo: 'Tecnólogo',
    licenciatura: 'Licenciatura',
    'ensino medio': 'Ensino Médio',
    highschool: 'Ensino Médio',
  };

  return degreeLabels[normalized] || degree.trim();
}

export function formatGraduationLabel(graduationYear: string): string {
  const value = graduationYear.trim();

  if (!value) {
    return 'Em andamento';
  }

  const normalized = stripDiacritics(value.toLowerCase());

  if (['em andamento', 'andamento', 'in progress', 'ongoing'].includes(normalized)) {
    return 'Em andamento';
  }

  return value;
}

export function formatEducationLabel(education: Pick<Education, 'degree' | 'field' | 'institution' | 'graduationYear'>): string {
  const degreeLabel = normalizeDegreeLabel(education.degree);
  const fieldLabel = education.field.trim();
  const institutionLabel = education.institution.trim() || 'Instituição não informada';
  const graduationLabel = formatGraduationLabel(education.graduationYear);
  const credentialLabel = degreeLabel
    ? fieldLabel
      ? `${degreeLabel} em ${fieldLabel}`
      : degreeLabel
    : fieldLabel || 'Formação';

  return `${credentialLabel} — ${institutionLabel} (${graduationLabel})`;
}

export function formatContactLine(extractedData: Pick<ExtractedData, 'email' | 'phone' | 'location' | 'linkedin' | 'github' | 'age'>): string {
  const parts = [
    extractedData.email,
    extractedData.phone,
    extractedData.location,
    extractedData.linkedin,
    extractedData.github,
    extractedData.age ? `${extractedData.age} anos` : '',
  ]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());

  return parts.join(' | ');
}