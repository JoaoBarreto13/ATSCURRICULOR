import { buildAtsPrompt } from './atsPrompt';
import { AnalysisResult, ResumeIssue, Experience, Education, Language } from '@/types/resume';

type DeepSeekChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const ISSUE_CATEGORIES: ResumeIssue['category'][] = [
  'formatação',
  'palavras-chave',
  'estrutura',
  'contato',
  'experiência',
  'educação',
];

const ISSUE_SEVERITIES: ResumeIssue['severity'][] = ['alta', 'média', 'baixa'];

type PartialAnalysis = Partial<AnalysisResult> & {
  extractedData?: Partial<AnalysisResult['extractedData']> & {
    experience?: Array<Partial<Experience>>;
    education?: Array<Partial<Education>>;
    languages?: Array<Partial<Language>>;
  };
  correctedResume?: Partial<AnalysisResult['correctedResume']> & {
    experienceRewritten?: Array<Partial<Experience>>;
  };
};

function clampScore(score: unknown): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function normalizeIssues(value: unknown): ResumeIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): ResumeIssue | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const category = normalizeString(candidate.category);
      const severity = normalizeString(candidate.severity);

      if (!ISSUE_CATEGORIES.includes(category as ResumeIssue['category'])) {
        return null;
      }

      if (!ISSUE_SEVERITIES.includes(severity as ResumeIssue['severity'])) {
        return null;
      }

      const description = normalizeString(candidate.description);
      const suggestion = normalizeString(candidate.suggestion);

      if (!description || !suggestion) {
        return null;
      }

      return {
        category: category as ResumeIssue['category'],
        severity: severity as ResumeIssue['severity'],
        description,
        suggestion,
      };
    })
    .filter((item): item is ResumeIssue => Boolean(item))
    .slice(0, 8);
}

function normalizeExperience(value: unknown): Experience[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): Experience | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const company = normalizeString(candidate.company);
      const role = normalizeString(candidate.role);

      if (!company && !role) {
        return null;
      }

      return {
        company,
        role,
        startDate: normalizeString(candidate.startDate),
        endDate: normalizeString(candidate.endDate),
        description: normalizeString(candidate.description),
        bulletPoints: normalizeArrayOfStrings(candidate.bulletPoints),
      };
    })
    .filter((item): item is Experience => Boolean(item));
}

function normalizeEducation(value: unknown): Education[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): Education | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const institution = normalizeString(candidate.institution);
      const degree = normalizeString(candidate.degree);
      const field = normalizeString(candidate.field);
      const graduationYear = normalizeString(candidate.graduationYear);

      if (!institution && !degree && !field && !graduationYear) {
        return null;
      }

      return {
        institution,
        degree,
        field,
        graduationYear,
      };
    })
    .filter((item): item is Education => Boolean(item));
}

function normalizeLanguages(value: unknown): Language[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): Language | null => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;
      const language = normalizeString(candidate.language);
      const level = normalizeString(candidate.level);

      if (!language) {
        return null;
      }

      return { language, level };
    })
    .filter((item): item is Language => Boolean(item));
}

function normalizeAnalysis(raw: PartialAnalysis): AnalysisResult {
  const extractedData = (raw.extractedData ?? {}) as Record<string, unknown>;
  const correctedResume = (raw.correctedResume ?? {}) as Record<string, unknown>;

  return {
    atsScore: clampScore(raw.atsScore),
    issues: normalizeIssues(raw.issues),
    extractedData: {
      name: normalizeString(extractedData.name),
      email: normalizeString(extractedData.email),
      phone: normalizeString(extractedData.phone),
      linkedin: extractedData.linkedin === null ? null : normalizeString(extractedData.linkedin),
      github: extractedData.github === null ? null : normalizeString(extractedData.github),
      location: normalizeString(extractedData.location),
      birthDate: normalizeString(extractedData.birthDate),
      age: typeof extractedData.age === 'number' ? extractedData.age : undefined,
      summary: normalizeString(extractedData.summary),
      skills: normalizeArrayOfStrings(extractedData.skills),
      experience: normalizeExperience(extractedData.experience),
      education: normalizeEducation(extractedData.education),
      certifications: normalizeArrayOfStrings(extractedData.certifications),
      languages: normalizeLanguages(extractedData.languages),
    },
    correctedResume: {
      summary: normalizeString(correctedResume.summary),
      experienceRewritten: normalizeExperience(correctedResume.experienceRewritten),
      suggestedKeywords: normalizeArrayOfStrings(correctedResume.suggestedKeywords),
    },
    generalFeedback: normalizeString(raw.generalFeedback),
  };
}

function buildRepairPrompt(rawResponse: string): string {
  return `
Você recebeu uma resposta de IA que deveria ser um JSON ATS válido, mas ela veio fora do formato esperado.

Corrija apenas o JSON abaixo e devolva somente um JSON válido, sem explicações.

RESPOSTA BRUTA:
"""
${rawResponse}
"""

O JSON final precisa respeitar exatamente o schema ATS, com estes campos:
- atsScore
- issues
- extractedData
- correctedResume
- generalFeedback

Regras:
- Mantenha apenas dados presentes ou inferidos com segurança.
- Se algum campo estiver ausente, use string vazia, null ou array vazio.
- Garanta que issues seja no máximo 8 itens.
- Garanta que atsScore seja um número entre 0 e 100.
  `.trim();
}

function extractJsonText(responseText: string): string {
  const normalized = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const firstBrace = normalized.indexOf('{');
  const lastBrace = normalized.lastIndexOf('}');

  return firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
    ? normalized.slice(firstBrace, lastBrace + 1)
    : normalized;
}

async function requestDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY não configurada no ambiente.');
  }

  const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';
  // garantir intervalo mínimo entre requisições para evitar RPM (ex: 15 req/min -> ~4100ms)
  const MIN_INTERVAL_MS = 4100;
  // variável de módulo para rastrear última requisição
  const _reqRef = requestDeepSeek as unknown as { _lastRequestAt?: number };
  _reqRef._lastRequestAt = _reqRef._lastRequestAt || 0;
  const lastAt = (_reqRef._lastRequestAt || 0) as number;
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastAt));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  const response = await fetch(
    'https://api.deepseek.com/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.15,
        max_tokens: 4096,
        stream: false,
        }),
    }
  );

  // registrar hora da requisição
  (_reqRef._lastRequestAt as number) = Date.now();

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Falha ao consultar DeepSeek (${response.status}). ${errorBody || 'Sem detalhes adicionais.'}`
    );
  }

  const payload = (await response.json()) as DeepSeekChatCompletionResponse;
  const text = payload.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Resposta inesperada da API da DeepSeek.');
  }

  return text.trim();
}

export async function analyzeWithDeepSeek(resumeText: string): Promise<AnalysisResult> {
  let text = await requestDeepSeek(buildAtsPrompt(resumeText));

  if (!text) {
    throw new Error('Resposta inesperada da API da DeepSeek.');
  }

  let cleanJson = extractJsonText(text);

  try {
    const parsed = JSON.parse(cleanJson) as PartialAnalysis;
    const normalized = normalizeAnalysis(parsed);

    if (!normalized.issues.length || !normalized.extractedData.summary || !normalized.correctedResume.summary) {
      text = await requestDeepSeek(buildRepairPrompt(cleanJson));
      cleanJson = extractJsonText(text);
      return normalizeAnalysis(JSON.parse(cleanJson) as PartialAnalysis);
    }

    return normalized;
  } catch {
    try {
      text = await requestDeepSeek(buildRepairPrompt(cleanJson));
      cleanJson = extractJsonText(text);
      return normalizeAnalysis(JSON.parse(cleanJson) as PartialAnalysis);
    } catch {
      throw new Error('Não foi possível interpretar a resposta da IA como JSON válido.');
    }
  }
}