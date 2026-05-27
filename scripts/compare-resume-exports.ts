import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';
import pdfParse from 'pdf-parse';
import { generatePdfBuffer } from '@/lib/generatePdf';
import { generateDocxBuffer } from '@/lib/generateDocx';
import { AnalysisResult } from '@/types/resume';

const outputDir = join(process.cwd(), 'tmp', 'resume-export-compare');
const pdfPath = join(outputDir, 'curriculo-teste.pdf');
const docxPath = join(outputDir, 'curriculo-teste.docx');

const sampleResume: AnalysisResult = {
  atsScore: 92,
  issues: [],
  generalFeedback: 'Currículo estruturado para validação de exportação.',
  extractedData: {
    name: 'João Barreto',
    email: 'joao.barreto@example.com',
    phone: '+55 71 99999-9999',
    linkedin: 'https://linkedin.com/in/joaobarreto',
    location: 'Salvador, BA',
    summary: 'Profissional de tecnologia com experiência em suporte, automação e análise de dados.',
    skills: ['Python', 'TypeScript', 'Excel', 'Comunicação', 'Resolução de problemas'],
    experience: [
      {
        company: 'Tech Soluções',
        role: 'Analista de Suporte',
        startDate: '2022',
        endDate: '2025',
        bulletPoints: [
          'Reduziu o tempo médio de atendimento em 35%.',
          'Padronizou documentação interna e onboarding.',
        ],
      },
    ],
    education: [
      {
        institution: 'Universidade Católica de Salvador',
        degree: 'Bachelor',
        field: 'Análise e Desenvolvimento de Sistemas',
        graduationYear: '2025',
      },
    ],
    certifications: ['Google IT Support Professional Certificate', 'Coursera Cybersecurity Certificate'],
    languages: [{ language: 'Português', level: 'Fluente' }],
  },
  correctedResume: {
    summary: 'Profissional de tecnologia com foco em suporte, automação e melhoria contínua.',
    experienceRewritten: [],
    suggestedKeywords: ['Suporte técnico', 'ITIL', 'Microsoft 365', 'Segurança da informação'],
  },
};

function ensureOutputDir() {
  mkdirSync(outputDir, { recursive: true });
}

function extractTextFromDocx(docxFilePath: string): string {
  const xml = execFileSync('unzip', ['-p', docxFilePath, 'word/document.xml'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  return xml
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

async function main() {
  ensureOutputDir();

  const pdfBuffer = await generatePdfBuffer(sampleResume);
  writeFileSync(pdfPath, pdfBuffer);

  const docxBuffer = await generateDocxBuffer(sampleResume);
  writeFileSync(docxPath, docxBuffer);

  const pdfExtracted = await pdfParse(pdfBuffer as any);
  const docxExtracted = extractTextFromDocx(docxPath);

  const expectedSections = [
    'Resumo Profissional',
    'Experiência Profissional',
    'Educação',
    'Habilidades',
    'Certificações',
    'Idiomas',
  ];

  const pdfText = pdfExtracted.text.replace(/\s+/g, ' ').trim();
  const docxText = docxExtracted.replace(/\s+/g, ' ').trim();

  const pdfSectionOrder = expectedSections.map((section) => pdfText.indexOf(section));
  const docxSectionOrder = expectedSections.map((section) => docxText.indexOf(section));

  console.log(JSON.stringify({
    outputDir,
    pdfPath,
    docxPath,
    pdfCharacters: pdfText.length,
    docxCharacters: docxText.length,
    pdfSectionOrder,
    docxSectionOrder,
    pdfSnippet: pdfText.slice(0, 500),
    docxSnippet: docxText.slice(0, 500),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
