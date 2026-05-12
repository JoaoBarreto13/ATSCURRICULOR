import { buildAtsPrompt } from './atsPrompt';
import { AnalysisResult, ResumeIssue, Experience, Education, Language } from '@/types/resume';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
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

      if (!institution && !degree && !field) {
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
      location: normalizeString(extractedData.location),
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

async function requestGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' +
      encodeURIComponent(apiKey),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.15,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              atsScore: { type: 'number' },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: {
                      type: 'string',
                      enum: ISSUE_CATEGORIES,
                    },
                    severity: {
                      type: 'string',
                      enum: ISSUE_SEVERITIES,
                    },
                    description: { type: 'string' },
                    suggestion: { type: 'string' },
                  },
                  required: ['category', 'severity', 'description', 'suggestion'],
                },
              },
              extractedData: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  linkedin: { type: 'string' },
                  location: { type: 'string' },
                  summary: { type: 'string' },
                  skills: { type: 'array', items: { type: 'string' } },
                  experience: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        company: { type: 'string' },
                        role: { type: 'string' },
                        startDate: { type: 'string' },
                        endDate: { type: 'string' },
                        description: { type: 'string' },
                        bulletPoints: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                  education: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        institution: { type: 'string' },
                        degree: { type: 'string' },
                        field: { type: 'string' },
                        graduationYear: { type: 'string' },
                      },
                    },
                  },
                  certifications: { type: 'array', items: { type: 'string' } },
                  languages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        language: { type: 'string' },
                        level: { type: 'string' },
                      },
                    },
                  },
                },
                required: [
                  'name',
                  'email',
                  'phone',
                  'linkedin',
                  'location',
                  'summary',
                  'skills',
                  'experience',
                  'education',
                  'certifications',
                  'languages',
                ],
              },
              correctedResume: {
                type: 'object',
                properties: {
                  summary: { type: 'string' },
                  experienceRewritten: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        company: { type: 'string' },
                        role: { type: 'string' },
                        startDate: { type: 'string' },
                        endDate: { type: 'string' },
                        bulletPoints: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                  suggestedKeywords: { type: 'array', items: { type: 'string' } },
                },
                required: ['summary', 'experienceRewritten', 'suggestedKeywords'],
              },
              generalFeedback: { type: 'string' },
            },
            required: ['atsScore', 'issues', 'extractedData', 'correctedResume', 'generalFeedback'],
          },
          },
        }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Falha ao consultar Gemini (${response.status}). ${errorBody || 'Sem detalhes adicionais.'}`
    );
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Resposta inesperada da API do Gemini.');
  }

  return text;
}

export async function analyzeWithGemini(resumeText: string): Promise<AnalysisResult> {
  let text = await requestGemini(buildAtsPrompt(resumeText));

  if (!text) {
    throw new Error('Resposta inesperada da API do Gemini.');
  }

  let cleanJson = extractJsonText(text);

  try {
    const parsed = JSON.parse(cleanJson) as PartialAnalysis;
    const normalized = normalizeAnalysis(parsed);

    if (!normalized.issues.length || !normalized.extractedData.summary || !normalized.correctedResume.summary) {
      text = await requestGemini(buildRepairPrompt(cleanJson));
      cleanJson = extractJsonText(text);
      return normalizeAnalysis(JSON.parse(cleanJson) as PartialAnalysis);
    }

    return normalized;
  } catch {
    try {
      text = await requestGemini(buildRepairPrompt(cleanJson));
      cleanJson = extractJsonText(text);
      return normalizeAnalysis(JSON.parse(cleanJson) as PartialAnalysis);
    } catch {
      throw new Error('Não foi possível interpretar a resposta da IA como JSON válido.');
    }
  }
}