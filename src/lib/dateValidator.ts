/**
 * Validador centralizado de datas para o ATS
 * Garante uma regra única e consistente de interpretação de datas em todo o sistema
 */

const OPEN_ENDED_DATE_VALUES = new Set([
  'atual',
  'presente',
  'atualmente',
  'current',
  'present',
]);

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/**
 * Verifica se uma string é uma data aberta (cargo vigente)
 */
export function isOpenEndedDate(value: string | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return OPEN_ENDED_DATE_VALUES.has(value.trim().toLowerCase());
}

/**
 * Parseia uma data no formato MM/YYYY, YYYY-MM-DD ou YYYY
 * Retorna Date ou null se inválida
 */
function parseDateStrict(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const raw = dateStr.trim();

  // Formato MM/YYYY
  const mmyyyyMatch = raw.match(/^(\d{2})\/(\d{4})$/);
  if (mmyyyyMatch) {
    const [, month, year] = mmyyyyMatch;
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (m >= 1 && m <= 12) {
      return new Date(y, m - 1, 1);
    }
    return null;
  }

  // Formato YYYY-MM-DD
  const yyyymmddMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return new Date(y, m - 1, d);
    }
    return null;
  }

  // Formato YYYY
  const yyyyMatch = raw.match(/^(\d{4})$/);
  if (yyyyMatch) {
    const year = parseInt(yyyyMatch[1], 10);
    if (year >= 1900 && year <= 2100) {
      return new Date(year, 0, 1);
    }
    return null;
  }

  return null;
}

/**
 * Valida se uma data é realista (não futura, não muito antiga)
 * Retorna { isValid: boolean, issue?: string }
 */
export function validateDateRealism(
  dateStr: string | undefined,
  isEndDate = false,
): { isValid: boolean; issue?: string } {
  if (!dateStr) {
    return { isValid: true }; // Data vazia é permitida
  }

  // Se for "Atual" ou "Presente", é válido
  if (isOpenEndedDate(dateStr)) {
    return { isValid: true };
  }

  const parsed = parseDateStrict(dateStr);
  if (!parsed) {
    return { isValid: false, issue: `Data inválida: ${dateStr}` };
  }

  // Checar se é no futuro
  if (parsed > TODAY) {
    return {
      isValid: false,
      issue: `Data no futuro: ${dateStr} (hoje é ${TODAY.toLocaleDateString('pt-BR')})`,
    };
  }

  // Checar se é muito antiga (mais de 100 anos atrás)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 100);
  if (parsed < minDate) {
    return {
      isValid: false,
      issue: `Data muito antiga: ${dateStr}`,
    };
  }

  return { isValid: true };
}

/**
 * Normaliza um par de datas de experiência
 * Retorna { startDate, endDate, errors: [] }
 * Se houver erro, retorna o par original com descrição do erro
 */
export function normalizeExperienceDateRange(
  startDateStr: string | undefined,
  endDateStr: string | undefined,
): {
  startDate: Date | null;
  endDate: Date | null;
  errors: string[];
} {
  const errors: string[] = [];

  // Parse start date
  let startDate: Date | null = null;
  if (startDateStr) {
    const startValidation = validateDateRealism(startDateStr, false);
    startDate = parseDateStrict(startDateStr);
    if (!startValidation.isValid && startValidation.issue) {
      errors.push(`Início: ${startValidation.issue}`);
    }
  }

  // Parse end date
  let endDate: Date | null = null;
  if (endDateStr) {
    if (!isOpenEndedDate(endDateStr)) {
      const endValidation = validateDateRealism(endDateStr, true);
      endDate = parseDateStrict(endDateStr);
      if (!endValidation.isValid && endValidation.issue) {
        errors.push(`Término: ${endValidation.issue}`);
      }
    } else {
      endDate = TODAY; // Usar hoje como proxy para "Atual"
    }
  }

  // Validar se datas estão invertidas
  if (startDate && endDate && endDate < startDate) {
    errors.push(`Datas invertidas: ${startDateStr} → ${endDateStr}`);
  }

  return {
    startDate,
    endDate,
    errors,
  };
}

/**
 * Calcula anos de experiência entre duas datas (em meses, depois convertido)
 */
export function calculateMonthsDifference(startDate: Date, endDate: Date): number {
  const months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  return Math.max(0, months);
}

/**
 * Converte uma data para o formato MM/YYYY esperado pelo ATS
 */
export function formatDateAsMMYYYY(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
}

/**
 * Export constante para testes
 */
export function getTodayForValidation(): Date {
  return new Date(TODAY);
}
