# 📄 ATS Resume Analyzer — Blueprint do Projeto

> **Como usar este arquivo:** Coloque este `BLUEPRINT.md` na raiz do seu projeto no VS Code.
> Abra o GitHub Copilot Chat (`Ctrl+I` ou `Ctrl+Shift+P → Copilot Chat`) e diga:
> *"Leia o BLUEPRINT.md e implemente o sistema conforme descrito."*

---

## 🎯 Visão Geral do Sistema

Sistema web que simula um **ATS (Applicant Tracking System)** no estilo da **Gupy**, com IA integrada via **API da Anthropic (Claude)**. O usuário faz upload de um currículo em PDF, o sistema analisa, corrige, pontua e gera um novo PDF estruturado e 100% legível por ATS.

### Funcionalidades Principais

- Upload de currículo em PDF
- Extração de texto do PDF via OCR/parser
- Análise com IA (Claude) simulando triagem ATS
- Score de compatibilidade ATS (0–100)
- Relatório de problemas encontrados (formatação, palavras-chave, estrutura)
- Geração de currículo corrigido em PDF formatado para ATS
- Download do novo currículo

---

## 🧱 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **Backend/API** | Next.js API Routes (Node.js) |
| **IA** | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| **Extração de PDF** | `pdf-parse` (Node.js) |
| **Geração de PDF** | `puppeteer` ou `@react-pdf/renderer` |
| **Upload de arquivos** | `formidable` ou `multer` |
| **Variáveis de ambiente** | `.env.local` |

---

## 📁 Estrutura de Pastas

```
ats-resume-analyzer/
├── BLUEPRINT.md                  ← Este arquivo
├── .env.local                    ← Chaves de API (não commitar)
├── .env.example                  ← Exemplo de variáveis
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
│
├── public/
│   └── logo.svg
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            ← Layout raiz
│   │   ├── page.tsx              ← Página principal (upload)
│   │   ├── result/
│   │   │   └── page.tsx          ← Página de resultado da análise
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts      ← POST: recebe PDF, extrai texto, chama Claude
│   │       └── generate-pdf/
│   │           └── route.ts      ← POST: gera PDF corrigido para download
│   │
│   ├── components/
│   │   ├── UploadZone.tsx        ← Drag & drop de PDF
│   │   ├── ScoreCard.tsx         ← Exibe pontuação ATS (0–100)
│   │   ├── IssuesList.tsx        ← Lista de problemas encontrados
│   │   ├── CorrectedResume.tsx   ← Preview do currículo corrigido
│   │   └── DownloadButton.tsx    ← Botão de download do PDF gerado
│   │
│   ├── lib/
│   │   ├── extractPdfText.ts     ← Extrai texto bruto do PDF
│   │   ├── analyzeWithClaude.ts  ← Lógica de chamada à API do Claude
│   │   ├── generatePdf.ts        ← Gera PDF ATS-friendly
│   │   └── atsPrompt.ts          ← Prompt completo para o Claude
│   │
│   └── types/
│       └── resume.ts             ← Tipos TypeScript do projeto
```

---

## 🔐 Variáveis de Ambiente

### `.env.example`
```env
# Anthropic Claude API Key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL base da aplicação (para geração de PDF via Puppeteer)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### `.env.local` (criar manualmente, não commitar)
```env
ANTHROPIC_API_KEY=sua_chave_aqui
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🧠 Prompt do Claude (ATS Analyzer)

**Arquivo:** `src/lib/atsPrompt.ts`

```typescript
export function buildAtsPrompt(resumeText: string): string {
  return `
Você é um sistema ATS (Applicant Tracking System) avançado, similar à Gupy.
Analise o currículo abaixo e retorne um JSON estruturado com a seguinte análise:

CURRÍCULO:
"""
${resumeText}
"""

Retorne APENAS um JSON válido, sem texto adicional, com esta estrutura:
{
  "atsScore": number (0-100),
  "issues": [
    {
      "category": "formatação" | "palavras-chave" | "estrutura" | "contato" | "experiência" | "educação",
      "severity": "alta" | "média" | "baixa",
      "description": "string com o problema encontrado",
      "suggestion": "string com a correção recomendada"
    }
  ],
  "extractedData": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "linkedin": "string ou null",
    "location": "string",
    "summary": "string (resumo profissional, 2-3 linhas)",
    "skills": ["array de habilidades técnicas e comportamentais"],
    "experience": [
      {
        "company": "string",
        "role": "string",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY ou Atual",
        "description": "string com responsabilidades em bullets"
      }
    ],
    "education": [
      {
        "institution": "string",
        "degree": "string",
        "field": "string",
        "graduationYear": "YYYY"
      }
    ],
    "certifications": ["array de certificações"],
    "languages": [
      { "language": "string", "level": "Básico | Intermediário | Avançado | Fluente | Nativo" }
    ]
  },
  "correctedResume": {
    "summary": "string (resumo reescrito de forma ATS-friendly)",
    "experienceRewritten": [
      {
        "company": "string",
        "role": "string",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY ou Atual",
        "bulletPoints": [
          "• Ação com verbo forte + resultado mensurável (ex: Aumentei vendas em 30%)",
          "• ..."
        ]
      }
    ],
    "suggestedKeywords": ["palavras-chave ATS recomendadas para o perfil deste profissional"]
  },
  "generalFeedback": "string com feedback geral sobre o currículo (2-4 linhas)"
}

CRITÉRIOS DE AVALIAÇÃO ATS:
- Presença de seções obrigatórias: contato, resumo, experiência, educação, habilidades
- Formatação limpa (sem tabelas complexas, colunas, gráficos, emojis em excesso)
- Palavras-chave relevantes para a área
- Datas consistentes e no formato correto
- Verbos de ação nas descrições de experiência
- Resultados quantificáveis
- Informações de contato completas (email, telefone, LinkedIn)
- Ausência de fotos, logotipos e elementos gráficos
- Tamanho adequado (1-2 páginas)
  `.trim();
}
```

---

## 🔄 Fluxo de Dados

```
[Usuário faz upload do PDF]
        ↓
[UploadZone.tsx] → POST /api/analyze
        ↓
[extractPdfText.ts] — pdf-parse extrai o texto bruto
        ↓
[analyzeWithClaude.ts] — envia texto ao Claude com o ATS Prompt
        ↓
[Claude API retorna JSON estruturado]
        ↓
[page result/page.tsx exibe: Score + Issues + Currículo Corrigido]
        ↓
[Usuário clica "Baixar PDF"] → POST /api/generate-pdf
        ↓
[generatePdf.ts] — gera PDF ATS-friendly com os dados corrigidos
        ↓
[Download do arquivo .pdf]
```

---

## 📦 Dependências — `package.json`

```json
{
  "name": "ats-resume-analyzer",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "@anthropic-ai/sdk": "^0.39.0",
    "pdf-parse": "^1.1.1",
    "@react-pdf/renderer": "^3.4.4",
    "formidable": "^3.5.1",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.383.0",
    "react-dropzone": "^14.2.3"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/pdf-parse": "^1.1.4",
    "@types/formidable": "^3",
    "eslint": "^8",
    "eslint-config-next": "14.2.0"
  }
}
```

---

## 🔧 Implementação dos Arquivos-Chave

### `src/types/resume.ts`
```typescript
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
```

---

### `src/lib/extractPdfText.ts`
```typescript
import pdfParse from 'pdf-parse';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}
```

---

### `src/lib/analyzeWithClaude.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { buildAtsPrompt } from './atsPrompt';
import { AnalysisResult } from '@/types/resume';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithClaude(resumeText: string): Promise<AnalysisResult> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: buildAtsPrompt(resumeText),
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Resposta inesperada da API do Claude');
  }

  // Remove possíveis backticks de markdown antes de parsear
  const cleanJson = content.text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  return JSON.parse(cleanJson) as AnalysisResult;
}
```

---

### `src/app/api/analyze/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/extractPdfText';
import { analyzeWithClaude } from '@/lib/analyzeWithClaude';

export const config = {
  api: { bodyParser: false },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Por favor, envie um arquivo PDF válido.' },
        { status: 400 }
      );
    }

    // Tamanho máximo: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'O arquivo deve ter no máximo 5MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const resumeText = await extractPdfText(buffer);

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF. O arquivo pode ser um PDF de imagem (escaneado). Use um PDF com texto selecionável.' },
        { status: 422 }
      );
    }

    const analysis = await analyzeWithClaude(resumeText);

    return NextResponse.json(analysis, { status: 200 });
  } catch (error) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar o currículo.' },
      { status: 500 }
    );
  }
}
```

---

### `src/app/page.tsx` (Página de Upload)
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadZone } from '@/components/UploadZone';

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(file: File) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao analisar o currículo.');
        return;
      }

      // Salva resultado no sessionStorage para acessar na página de resultado
      sessionStorage.setItem('atsResult', JSON.stringify(data));
      router.push('/result');
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          ATS Resume Analyzer
        </h1>
        <p className="text-gray-500 mb-8">
          Analise e corrija seu currículo com IA • Compatível com sistemas como Gupy, LinkedIn, Workday
        </p>

        <UploadZone onUpload={handleUpload} loading={loading} />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400">
          Seu currículo não é armazenado. O processamento ocorre em tempo real.
        </p>
      </div>
    </main>
  );
}
```

---

### `src/app/result/page.tsx` (Página de Resultado)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisResult } from '@/types/resume';
import { ScoreCard } from '@/components/ScoreCard';
import { IssuesList } from '@/components/IssuesList';
import { CorrectedResume } from '@/components/CorrectedResume';
import { DownloadButton } from '@/components/DownloadButton';

export default function ResultPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem('atsResult');
    if (!stored) {
      router.push('/');
      return;
    }
    setResult(JSON.parse(stored));
  }, []);

  if (!result) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Resultado da Análise ATS</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Analisar outro currículo
          </button>
        </div>

        {/* Score ATS */}
        <ScoreCard score={result.atsScore} feedback={result.generalFeedback} />

        {/* Problemas encontrados */}
        <IssuesList issues={result.issues} />

        {/* Currículo corrigido */}
        <CorrectedResume
          extractedData={result.extractedData}
          correctedResume={result.correctedResume}
        />

        {/* Download */}
        <DownloadButton analysisResult={result} />

      </div>
    </main>
  );
}
```

---

### `src/components/ScoreCard.tsx`
```typescript
interface ScoreCardProps {
  score: number;
  feedback: string;
}

export function ScoreCard({ score, feedback }: ScoreCardProps) {
  const color =
    score >= 80 ? 'text-green-600 bg-green-50 border-green-200' :
    score >= 60 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                  'text-red-600 bg-red-50 border-red-200';

  const label =
    score >= 80 ? 'Excelente para ATS' :
    score >= 60 ? 'Moderado — melhorias necessárias' :
                  'Baixo — currículo precisa de revisão';

  return (
    <div className={`p-6 rounded-xl border ${color}`}>
      <div className="flex items-center gap-4">
        <div className="text-5xl font-black">{score}</div>
        <div>
          <div className="text-lg font-semibold">{label}</div>
          <div className="text-sm mt-1 opacity-80">{feedback}</div>
        </div>
      </div>
      {/* Barra de progresso */}
      <div className="mt-4 bg-white/60 rounded-full h-3">
        <div
          className="h-3 rounded-full bg-current transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
```

---

### `src/components/IssuesList.tsx`
```typescript
import { ResumeIssue } from '@/types/resume';

const severityConfig = {
  alta: { label: 'Alta', className: 'bg-red-100 text-red-700' },
  média: { label: 'Média', className: 'bg-yellow-100 text-yellow-700' },
  baixa: { label: 'Baixa', className: 'bg-blue-100 text-blue-700' },
};

export function IssuesList({ issues }: { issues: ResumeIssue[] }) {
  if (!issues.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Problemas Encontrados ({issues.length})
      </h2>
      <div className="space-y-3">
        {issues.map((issue, i) => {
          const config = severityConfig[issue.severity];
          return (
            <div key={i} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.className}`}>
                  {config.label}
                </span>
                <span className="text-xs text-gray-400 capitalize">{issue.category}</span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{issue.description}</p>
              <p className="text-sm text-gray-500 mt-1">💡 {issue.suggestion}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### `src/components/DownloadButton.tsx`
```typescript
'use client';

import { AnalysisResult } from '@/types/resume';
import { useState } from 'react';

export function DownloadButton({ analysisResult }: { analysisResult: AnalysisResult }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisResult),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculo-ats-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-center py-6">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-lg transition-colors disabled:opacity-50"
      >
        {loading ? 'Gerando PDF...' : '⬇️ Baixar Currículo Corrigido (PDF)'}
      </button>
      <p className="mt-2 text-sm text-gray-400">
        O PDF gerado é formatado para ser 100% legível por sistemas ATS
      </p>
    </div>
  );
}
```

---

### `src/app/api/generate-pdf/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    const data: AnalysisResult = await req.json();
    const { extractedData, correctedResume } = data;

    // Gera HTML simples, limpo e ATS-friendly (sem colunas, tabelas complexas, imagens)
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #111;
      padding: 40px 50px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 20pt; margin-bottom: 4px; }
    .contact { font-size: 10pt; color: #333; margin-bottom: 16px; }
    h2 {
      font-size: 12pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1.5px solid #111;
      padding-bottom: 3px;
      margin: 18px 0 10px;
    }
    p { margin-bottom: 6px; line-height: 1.5; }
    .job { margin-bottom: 12px; }
    .job-title { font-weight: bold; }
    .job-meta { font-size: 10pt; color: #444; margin-bottom: 4px; }
    ul { padding-left: 18px; }
    li { margin-bottom: 3px; line-height: 1.5; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill { background: #f0f0f0; padding: 2px 8px; border-radius: 3px; font-size: 10pt; }
    .section-text { font-size: 10pt; color: #333; }
  </style>
</head>
<body>

  <h1>${extractedData.name}</h1>
  <div class="contact">
    ${extractedData.email} | ${extractedData.phone} | ${extractedData.location}
    ${extractedData.linkedin ? ` | ${extractedData.linkedin}` : ''}
  </div>

  <h2>Resumo Profissional</h2>
  <p>${correctedResume.summary || extractedData.summary}</p>

  <h2>Experiência Profissional</h2>
  ${correctedResume.experienceRewritten.map(exp => `
    <div class="job">
      <div class="job-title">${exp.role}</div>
      <div class="job-meta">${exp.company} | ${exp.startDate} – ${exp.endDate}</div>
      <ul>
        ${(exp.bulletPoints || []).map(bp => `<li>${bp.replace(/^•\s*/, '')}</li>`).join('')}
      </ul>
    </div>
  `).join('')}

  <h2>Educação</h2>
  ${extractedData.education.map(edu => `
    <p><strong>${edu.degree} em ${edu.field}</strong> — ${edu.institution} (${edu.graduationYear})</p>
  `).join('')}

  ${extractedData.skills.length > 0 ? `
    <h2>Habilidades</h2>
    <div class="skills-list">
      ${extractedData.skills.map(s => `<span class="skill">${s}</span>`).join('')}
    </div>
  ` : ''}

  ${extractedData.certifications.length > 0 ? `
    <h2>Certificações</h2>
    ${extractedData.certifications.map(c => `<p>${c}</p>`).join('')}
  ` : ''}

  ${extractedData.languages.length > 0 ? `
    <h2>Idiomas</h2>
    ${extractedData.languages.map(l => `<p>${l.language}: ${l.level}</p>`).join('')}
  ` : ''}

</body>
</html>
    `;

    // Retorna o HTML para download como PDF via navegador (print to PDF)
    // Para usar Puppeteer no servidor, instale-o e adapte conforme abaixo:
    // const puppeteer = require('puppeteer');
    // const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    // const page = await browser.newPage();
    // await page.setContent(html);
    // const pdf = await page.pdf({ format: 'A4', margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    // await browser.close();
    // return new NextResponse(pdf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="curriculo-ats.pdf"' }});

    // Versão simplificada: retorna HTML para que o navegador imprima como PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 });
  }
}
```

---

## 🚀 Passos para Iniciar o Projeto

```bash
# 1. Criar o projeto Next.js
npx create-next-app@14 ats-resume-analyzer --typescript --tailwind --app --src-dir --import-alias "@/*"

# 2. Entrar na pasta
cd ats-resume-analyzer

# 3. Instalar dependências
npm install @anthropic-ai/sdk pdf-parse @react-pdf/renderer formidable react-dropzone lucide-react clsx

# 4. Instalar tipos de desenvolvimento
npm install -D @types/pdf-parse @types/formidable

# 5. Criar o arquivo .env.local
echo "ANTHROPIC_API_KEY=sua_chave_aqui" > .env.local
echo "NEXT_PUBLIC_BASE_URL=http://localhost:3000" >> .env.local

# 6. Criar a estrutura de pastas
mkdir -p src/lib src/types src/components src/app/result src/app/api/analyze src/app/api/generate-pdf

# 7. Iniciar o servidor de desenvolvimento
npm run dev
```

---

## 🤖 Prompts para o GitHub Copilot Chat

Use estes prompts no Copilot Chat (`Ctrl+Shift+I`) para implementar cada parte:

```
Leia o BLUEPRINT.md e implemente todos os arquivos descritos nele, começando pelos tipos TypeScript e funções da pasta lib/.
```

```
Implemente o componente UploadZone.tsx com drag-and-drop usando react-dropzone, aceitando apenas PDFs de até 5MB.
```

```
Implemente o componente CorrectedResume.tsx que exibe o currículo corrigido com as seções: resumo, experiência (com bullet points), educação, habilidades e idiomas.
```

```
Adicione Puppeteer à rota /api/generate-pdf/route.ts para gerar um PDF server-side a partir do HTML do currículo corrigido.
```

```
Adicione tratamento de erros robusto em todas as rotas de API e loading states em todos os componentes.
```

---

## 🔒 Segurança e Boas Práticas

- `ANTHROPIC_API_KEY` **nunca** vai para o frontend — apenas chamada server-side
- PDFs não são persistidos em disco — processados em memória como `Buffer`
- Validação de tipo e tamanho de arquivo antes do processamento
- Adicionar `.env.local` ao `.gitignore`
- Rate limiting recomendado para produção (ex.: `upstash/ratelimit`)
- Para deploy em produção: usar **Vercel** (compatível com Next.js App Router e variáveis de ambiente seguras)

---

## 📊 Roadmap de Melhorias (Futuras Versões)

- [ ] Campo de "vaga alvo" para análise de compatibilidade com JD específica
- [ ] Histórico de currículos analisados (com banco de dados, ex.: Supabase)
- [ ] Versão multilíngue (EN/ES)
- [ ] Exportação em DOCX além de PDF
- [ ] Score por seção (contato, experiência, educação, habilidades)
- [ ] Integração com LinkedIn (importar perfil)
- [ ] Modo comparação: currículo original vs. currículo corrigido lado a lado

---

*Gerado por Claude • ATS Resume Analyzer Blueprint v1.0*
