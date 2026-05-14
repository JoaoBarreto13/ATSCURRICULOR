import { GoogleGenAI } from '@google/genai';
import { buildJobDescriptionPrompt } from './jobDescriptionPrompt';
import { JobDescriptionAnalysis, JobRequirement } from '@/types/resume';

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

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

function normalizeJobRequirement(value: unknown): JobRequirement {
  const candidate = (value ?? {}) as Record<string, unknown>;
  const requiredLanguages = Array.isArray(candidate.requiredLanguages)
    ? candidate.requiredLanguages
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const language = normalizeString((item as Record<string, unknown>).language);
          const minLevel = normalizeString((item as Record<string, unknown>).minLevel);

          if (!language) {
            return null;
          }

          return { language, minLevel };
        })
        .filter((item): item is { language: string; minLevel: string } => Boolean(item))
    : [];

  const educationLevel = normalizeString(candidate.educationLevel);

  return {
    title: normalizeString(candidate.title),
    requiredSkills: normalizeArrayOfStrings(candidate.requiredSkills),
    preferredSkills: normalizeArrayOfStrings(candidate.preferredSkills),
    minExperienceYears:
      typeof candidate.minExperienceYears === 'number' && Number.isFinite(candidate.minExperienceYears)
        ? Math.max(0, Math.floor(candidate.minExperienceYears))
        : undefined,
    minAge:
      typeof candidate.minAge === 'number' && Number.isFinite(candidate.minAge)
        ? Math.max(0, Math.floor(candidate.minAge))
        : undefined,
    maxAge:
      typeof candidate.maxAge === 'number' && Number.isFinite(candidate.maxAge)
        ? Math.max(0, Math.floor(candidate.maxAge))
        : undefined,
    educationLevel: ['Técnico', 'Bachelor', 'Master', 'PhD'].includes(educationLevel)
      ? (educationLevel as JobRequirement['educationLevel'])
      : undefined,
    requiredLanguages,
  };
}

function extractJsonText(responseText: string): string {
  const normalized = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const firstBrace = normalized.indexOf('{');
  const lastBrace = normalized.lastIndexOf('}');

  return firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace
    ? normalized.slice(firstBrace, lastBrace + 1)
    : normalized;
}

function buildRepairPrompt(rawResponse: string): string {
  return `Corrija apenas o JSON abaixo e devolva somente JSON válido.

RESPOSTA BRUTA:
"""
${rawResponse}
"""

Schema final:
{
  "summary": "string",
  "jobRequirement": {
    "title": "string",
    "requiredSkills": ["string"],
    "preferredSkills": ["string"],
    "minExperienceYears": number | null,
    "minAge": number | null,
    "maxAge": number | null,
    "educationLevel": "Técnico" | "Bachelor" | "Master" | "PhD" | "",
    "requiredLanguages": [{"language": "string", "minLevel": "Básico" | "Intermediário" | "Avançado" | "Fluente" | "Nativo"}]
  }
}`.trim();
}

async function requestGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }

  // garantir intervalo mínimo entre requisições para evitar RPM (ex: 15 req/min -> ~4100ms)
  const MIN_INTERVAL_MS = 4100;
  const _reqRef = requestGemini as unknown as { _lastRequestAt?: number };
  _reqRef._lastRequestAt = _reqRef._lastRequestAt || 0;
  const lastAt = (_reqRef._lastRequestAt || 0) as number;
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastAt));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }

  const client = new GoogleGenAI({ apiKey });
  const response = (await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  })) as GeminiGenerateContentResponse;

  (_reqRef._lastRequestAt as number) = Date.now();

  return response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

export async function analyzeJobDescriptionWithGemini(
  description: string,
): Promise<JobDescriptionAnalysis> {
  const prompt = buildJobDescriptionPrompt(description);
  const rawResponse = await requestGemini(prompt);

  if (!rawResponse) {
    throw new Error('A IA não retornou conteúdo para a vaga.');
  }

  try {
    const parsed = JSON.parse(extractJsonText(rawResponse)) as Record<string, unknown>;
    return {
      summary: normalizeString(parsed.summary),
      jobRequirement: normalizeJobRequirement(parsed.jobRequirement),
    };
  } catch {
    const repaired = await requestGemini(buildRepairPrompt(rawResponse));
    const parsed = JSON.parse(extractJsonText(repaired)) as Record<string, unknown>;

    return {
      summary: normalizeString(parsed.summary),
      jobRequirement: normalizeJobRequirement(parsed.jobRequirement),
    };
  }
}