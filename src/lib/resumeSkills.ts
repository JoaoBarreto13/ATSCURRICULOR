import { AnalysisResult } from '@/types/resume';

function normalizeSkill(value: string): string {
  return value.trim();
}

export function getResumeSkills(result: Pick<AnalysisResult, 'extractedData' | 'correctedResume'>): string[] {
  const primarySkills = result.extractedData.skills ?? [];
  const suggestedSkills = result.correctedResume.suggestedKeywords ?? [];

  return [...primarySkills, ...suggestedSkills]
    .map(normalizeSkill)
    .filter(Boolean)
    .filter((skill, index, array) => array.indexOf(skill) === index);
}
