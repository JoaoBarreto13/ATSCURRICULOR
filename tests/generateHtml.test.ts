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
        github: 'https://github.com/teste',
        location: 'Nowhere',
        summary: 'x',
        skills: ['A'],
        experience: [],
        education: [
          { degree: 'Bachelor', field: 'Cybersecurity', institution: 'UFPR', graduationYear: '' },
          { degree: '', field: '', institution: 'USP', graduationYear: '2024' },
        ],
        certifications: [],
        languages: [],
      },
      correctedResume: { summary: '', experienceRewritten: [], suggestedKeywords: [] },
    } as AnalysisResult;

    const html = generateHtml(sample);
    expect(typeof html).toBe('string');
    expect(html).toContain('Resumo Profissional');
    expect(html).toContain('Habilidades');
    expect(html).toContain('skills-list');
    expect(html).toContain('Bacharelado em Cybersecurity');
    expect(html).toContain('USP (2024)');
    expect(html).toContain('https://github.com/teste');
  });

  it('does not add suggested keywords to the export when primary skills are empty', () => {
    const sample = {
      atsScore: 90,
      issues: [],
      generalFeedback: '',
      extractedData: {
        name: 'Test',
        email: 't@example.com',
        phone: '123',
        linkedin: null,
        github: null,
        location: 'Nowhere',
        summary: 'x',
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        languages: [],
      },
      correctedResume: { summary: '', experienceRewritten: [], suggestedKeywords: ['CI/CD'] },
    } as AnalysisResult;

    const html = generateHtml(sample);
    expect(html).not.toContain('CI/CD');
  });
});
