import { describe, it, expect } from 'vitest';
import { buildAtsPrompt } from '@/lib/atsPrompt';

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

describe('buildAtsPrompt', () => {
  it('instructs AI to separate formal education from certifications/courses', () => {
    const prompt = stripDiacritics(buildAtsPrompt('Curriculo de teste'));

    expect(prompt).toContain('Educacao: APENAS ensino academico formal');
    expect(prompt).toContain('Certificacoes/Cursos');
    expect(prompt).toContain('NUNCA em educacao');
  });
});
