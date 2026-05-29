import { AnalysisResult } from '@/types/resume';
import { generateHtml } from '@/lib/generatePdf';

function buildBaseAnalysis(): AnalysisResult {
  return {
    atsScore: 72,
    issues: [],
    extractedData: {
      name: 'Joana Costa',
      email: 'joana.costa@email.com',
      phone: '+55 11 98888-1234',
      linkedin: 'https://linkedin.com/in/joana-costa',
      github: null,
      location: 'Sao Paulo, SP',
      birthDate: '1995-03-21',
      age: 29,
      summary: 'Analista de seguranca da informacao com foco em compliance e monitoramento.',
      skills: ['SIEM', 'ISO 27001', 'Linux'],
      experience: [
        {
          company: 'SecureNow',
          role: 'Analista de Seguranca',
          startDate: '02/2021',
          endDate: 'Presente',
          bulletPoints: ['Monitorou eventos de seguranca e incidentes.'],
        },
      ],
      education: [
        {
          institution: 'FIAP',
          degree: 'Tecnologo',
          field: 'Seguranca da Informacao',
          graduationYear: '2019',
        },
      ],
      certifications: [],
      languages: [{ language: 'Portuguese', level: 'Nativo' }],
    },
    correctedResume: {
      summary: 'Analista de seguranca com foco em conformidade e monitoramento continuo.',
      experienceRewritten: [],
      suggestedKeywords: [],
    },
    generalFeedback: 'Perfil aderente para vagas de seguranca junior/pleno.',
  };
}

const aiGeneratedCertificate: AnalysisResult = {
  ...buildBaseAnalysis(),
  extractedData: {
    ...buildBaseAnalysis().extractedData,
    certifications: ['Certificado de Curso de SOC Analyst (IA) - 30h'],
  },
};

const normalCertificate: AnalysisResult = {
  ...buildBaseAnalysis(),
  extractedData: {
    ...buildBaseAnalysis().extractedData,
    certifications: ['Certificacao ISO 27001 Foundation'],
  },
};

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const cases = [
  { label: 'Certificado gerado por IA', data: aiGeneratedCertificate },
  { label: 'Certificado normal', data: normalCertificate },
];

cases.forEach(({ label, data }) => {
  const html = stripDiacritics(generateHtml(data));
  const hasEducation = html.includes('Educacao') && html.includes('Tecnologo');
  const hasCertification = html.includes('Certificacoes') && data.extractedData.certifications[0];

  console.log(`\n=== ${label} ===`);
  console.log(`Education entries: ${data.extractedData.education.length}`);
  console.log(`Certification entries: ${data.extractedData.certifications.length}`);
  console.log(`HTML contains education section: ${hasEducation ? 'YES' : 'NO'}`);
  console.log(`HTML contains certification section: ${hasCertification ? 'YES' : 'NO'}`);
  console.log(`Certification value: ${data.extractedData.certifications[0]}`);
});
