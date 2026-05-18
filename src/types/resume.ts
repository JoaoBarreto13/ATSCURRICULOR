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
  birthDate?: string; // YYYY-MM-DD
  age?: number;
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
  validationWarnings?: string[];
  validationRecommendations?: string[];
}

/**
 * Requisitos de uma vaga para matching
 */
export interface JobRequirement {
  title: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  minExperienceYears?: number;
  maxAge?: number;
  minAge?: number;
  educationLevel?: 'Técnico' | 'Bachelor' | 'Master' | 'PhD';
  requiredLanguages?: Array<{ language: string; minLevel: string }>;
}

/**
 * Resultado de compatibilidade entre currículo e vaga
 */
export interface JobMatchResult {
  matchPercentage: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  ageCompatible: boolean;
  ageDetails?: string;
  experienceYears: number;
  educationMatch: boolean;
  languageMatch: boolean;
  recommendations: string[];
}

export interface JobDescriptionAnalysis {
  summary: string;
  jobRequirement: JobRequirement;
}
