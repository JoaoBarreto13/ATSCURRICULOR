import { describe, it, expect } from 'vitest';
import { getResumeSkills } from '@/lib/resumeSkills';

describe('getResumeSkills', () => {
  it('combines primary and suggested skills and removes duplicates', () => {
    const data = {
      extractedData: { skills: ['A', 'B'] },
      correctedResume: { suggestedKeywords: ['B', 'C'] },
    } as any;

    const skills = getResumeSkills(data);
    expect(skills.sort()).toEqual(['A', 'B', 'C'].sort());
  });
});
