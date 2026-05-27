import { describe, it, expect } from 'vitest';
import { generateDocxBuffer } from '@/lib/generateDocx';
import { AnalysisResult } from '@/types/resume';

describe('generateDocxBuffer', () => {
  it('generates a non-empty buffer for a sample resume', async () => {
    const sample = {
      atsScore: 90,
      issues: [],
      generalFeedback: '',
      extractedData: {
        name: 'Test',
        email: 't@example.com',
        phone: '123',
        linkedin: null,
        location: 'Nowhere',
        summary: 'x',
        skills: ['A'],
        experience: [],
        education: [],
        certifications: [],
        languages: [],
      },
      correctedResume: {
        summary: '',
        experienceRewritten: [],
        suggestedKeywords: [],
      },
    } as AnalysisResult;

    const buf = await generateDocxBuffer(sample);
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);
  });
});
