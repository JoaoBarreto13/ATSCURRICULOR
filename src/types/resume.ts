export interface ResumeIssue {
  category: 'formatação' | 'palavras-chave' | 'estrutura' | 'contato' | 'experiência' | 'educação';
  severity: 'alta' | 'média' | 'baixa';
  description: string;
  suggestion: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description?: string;
  bulletPoints?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
}

export interface Language {
  language: string;
  level: string;
}

export interface ExtractedData {
  name: string;
  email: string;
  phone: string;
  linkedin: string | null;
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  certifications: string[];
  languages: Language[];
}

export interface CorrectedResume {
  summary: string;
  experienceRewritten: Experience[];
  suggestedKeywords: string[];
}

export interface AnalysisResult {
  atsScore: number;
  issues: ResumeIssue[];
  extractedData: ExtractedData;
  correctedResume: CorrectedResume;
  generalFeedback: string;
}
