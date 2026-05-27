import { describe, it, expect } from 'vitest';
import { generateHtml } from '@/lib/generatePdf';
import { AnalysisResult } from '@/types/resume';

describe('generateHtml', () => {
  it('produces HTML containing main sections', () => {
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
      correctedResume: { summary: '', experienceRewritten: [], suggestedKeywords: [] },
    } as AnalysisResult;

    const html = generateHtml(sample);
    expect(typeof html).toBe('string');
    expect(html).toContain('Resumo Profissional');
    expect(html).toContain('Habilidades');
  });
});
