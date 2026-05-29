import { expect, test } from 'vitest';
import { formatContactLine, formatEducationLabel, formatGraduationLabel } from '@/lib/resumeDisplay';

test('normalizes education labels without forcing em when only the field exists', () => {
  expect(
    formatEducationLabel({
      degree: '',
      field: 'Cybersecurity',
      institution: 'IFSP',
      graduationYear: '',
    }),
  ).toContain('Cybersecurity — IFSP (Em andamento)');
});

test('keeps partial education entries visible when only the graduation year exists', () => {
  expect(
    formatEducationLabel({
      degree: '',
      field: '',
      institution: 'UFPR',
      graduationYear: '2024',
    }),
  ).toContain('UFPR (2024)');
});

test('translates bachelor and keeps the graduation status readable', () => {
  expect(
    formatEducationLabel({
      degree: 'Bachelor',
      field: 'Cybersecurity',
      institution: 'UFPR',
      graduationYear: '',
    }),
  ).toContain('Bacharelado em Cybersecurity');
  expect(formatGraduationLabel('')).toBe('Em andamento');
});

test('includes github in the contact line when present', () => {
  expect(
    formatContactLine({
      email: 'a@b.com',
      phone: '123',
      location: 'Curitiba',
      linkedin: 'https://linkedin.com/in/teste',
      github: 'https://github.com/teste',
      age: 29,
    }),
  ).toContain('https://github.com/teste');
});