import { AnalysisResult, JobRequirement } from '@/types/resume';
import { testAgainstMultipleJobs, validateATSCompatibility } from '@/lib/atsValidator';

const mockAnalysis: AnalysisResult = {
  atsScore: 78,
  issues: [],
  extractedData: {
    name: 'Camila Duarte',
    email: 'camila.duarte@email.com',
    phone: '+55 11 99999-0000',
    linkedin: 'https://linkedin.com/in/camila-duarte',
    github: 'https://github.com/camiladuarte',
    location: 'Sao Paulo, SP',
    birthDate: '1996-05-12',
    age: 28,
    summary:
      'Analista de ciberseguranca com 6 anos de experiencia em SOC, resposta a incidentes e automacao. Focada em deteccao, hardening e monitoramento continuo com SIEM e SOAR.',
    skills: [
      'SIEM',
      'SOAR',
      'Splunk',
      'Microsoft Sentinel',
      'Python',
      'Linux',
      'Incident Response',
      'Threat Hunting',
      'ISO 27001',
    ],
    experience: [
      {
        company: 'SafeNet Security',
        role: 'Analista de Ciberseguranca Senior',
        startDate: '01/2022',
        endDate: 'Presente',
        bulletPoints: [
          'Implantou regras de correlacao no SIEM reduzindo falsos positivos em 30%',
          'Automatizou resposta a incidentes com SOAR e Python',
        ],
      },
      {
        company: 'BlueWave Tech',
        role: 'Analista SOC',
        startDate: '02/2019',
        endDate: '12/2021',
        bulletPoints: [
          'Monitorou eventos e incidentes 24x7',
          'Conduziu investigacoes de phishing e malware',
        ],
      },
    ],
    education: [
      {
        institution: 'FIAP',
        degree: 'Tecnologo',
        field: 'Seguranca da Informacao',
        graduationYear: '2018',
      },
    ],
    certifications: ['Security+', 'ISO 27001 Foundation'],
    languages: [
      { language: 'Portuguese', level: 'Nativo' },
      { language: 'English', level: 'Intermediario' },
    ],
  },
  correctedResume: {
    summary:
      'Analista de ciberseguranca especializada em SOC, resposta a incidentes e automacao. Experiencia com SIEM/SOAR, threat hunting e melhoria continua de processos para reduzir riscos operacionais.',
    experienceRewritten: [],
    suggestedKeywords: [],
  },
  generalFeedback: 'Curriculo bem estruturado, com bom foco em resultados.',
};

const fictitiousJob: JobRequirement = {
  title: 'Analista de Ciberseguranca (SOC)',
  requiredSkills: ['SIEM', 'SOAR', 'Incident Response', 'Linux', 'Python'],
  preferredSkills: ['Threat Hunting', 'Microsoft Sentinel', 'Splunk'],
  minExperienceYears: 3,
  minAge: 21,
  maxAge: 55,
     educationLevel: 'Técnico',
  requiredLanguages: [
    { language: 'Portuguese', minLevel: 'Fluente' },
    { language: 'English', minLevel: 'Intermediario' },
  ],
};

// Simulacao de vaga "gerada por IA" (mock) a partir de uma descricao ficticia
const aiGeneratedJob: JobRequirement = {
  title: 'Cybersecurity Automation Specialist (IA)',
  requiredSkills: ['SOAR', 'Python', 'SIEM', 'Splunk', 'Automation'],
  preferredSkills: ['Threat Hunting', 'MITRE ATT&CK', 'Linux'],
  minExperienceYears: 4,
  minAge: 23,
  maxAge: 60,
  educationLevel: 'Bachelor',
  requiredLanguages: [
    { language: 'English', minLevel: 'Intermediario' },
  ],
};

const validation = validateATSCompatibility(mockAnalysis);
const matches = testAgainstMultipleJobs(mockAnalysis, [fictitiousJob, aiGeneratedJob]);

console.log('=== ATS Validation (Mock Resume) ===');
console.log(`Valid: ${validation.isValid ? 'YES' : 'NO'}`);
console.log(`Warnings: ${validation.warnings.length}`);
validation.warnings.forEach((w) => console.log(`- ${w}`));
console.log(`Recommendations: ${validation.recommendations.length}`);
validation.recommendations.forEach((r) => console.log(`- ${r}`));
console.log('');

console.log('=== Job Match Results ===');
matches.forEach((match) => {
  console.log(`\nJob: ${match.job}`);
  console.log(`Match: ${match.matchPercentage}%`);
  console.log(`Qualified: ${match.isQualified ? 'YES' : 'NO'}`);
  console.log(`Matched Skills: ${match.details.matchedSkills.join(', ') || 'none'}`);
  console.log(`Missing Skills: ${match.details.missingSkills.join(', ') || 'none'}`);
  console.log(`Experience Years: ${match.details.experienceYears}`);
  console.log(`Education Match: ${match.details.educationMatch ? 'YES' : 'NO'}`);
  console.log(`Language Match: ${match.details.languageMatch ? 'YES' : 'NO'}`);
  if (match.recommendations.length > 0) {
    console.log('Recommendations:');
    match.recommendations.forEach((rec) => console.log(`- ${rec}`));
  }
});
