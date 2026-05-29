import { AnalysisResult } from '@/types/resume';
import { formatContactLine, formatEducationLabel } from './resumeDisplay';

/**
 * Gera HTML ATS-friendly a partir dos dados do currículo corrigido
 */
export function generateHtml(data: AnalysisResult): string {
  const { extractedData, correctedResume } = data;
  // Use IA-generated summary when available for ATS optimization;
  // Combine extractedData metadata (role/company/date) with correctedResume bulletPoints
  // so that the generated ATS bullets are exported, but original positions aren't lost/changed.
  const summary = correctedResume.summary || extractedData.summary;
  const correctedExp = correctedResume.experienceRewritten || [];
  const experienceItems = (extractedData.experience || []).map((exp, idx) => {
    const corrected = correctedExp[idx] || {};
    const bulletPoints = (corrected.bulletPoints && corrected.bulletPoints.length > 0)
      ? corrected.bulletPoints
      : (exp.bulletPoints || []);

    return {
      ...exp,
      bulletPoints,
    };
  });
  const hasEducation = extractedData.education.length > 0;
  const skills = extractedData.skills;
  const hasSkills = skills.length > 0;
  const hasCertifications = extractedData.certifications.length > 0;
  const hasLanguages = extractedData.languages.length > 0;

  return `<!DOCTYPE html>
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
    .skills-list {
      font-size: 10pt;
      color: #111;
      line-height: 1.5;
    }
    .section-text { font-size: 10pt; color: #333; }
  </style>
</head>
<body>

  <h1>${escapeHtml(extractedData.name)}</h1>
  <div class="contact">
    ${escapeHtml(formatContactLine(extractedData))}
  </div>

  <h2>Resumo Profissional</h2>
  <p>${escapeHtml(summary || 'Resumo não identificado na extração do currículo.')}</p>

  <h2>Experiência Profissional</h2>
  ${experienceItems.length > 0
    ? experienceItems
    .map(
      (exp) => `
    <div class="job">
      <div class="job-title">${escapeHtml(exp.role)}</div>
      <div class="job-meta">${escapeHtml(exp.company)} | ${escapeHtml(exp.startDate)} – ${escapeHtml(exp.endDate)}</div>
      <ul>
        ${(exp.bulletPoints || []).map((bp) => `<li>${escapeHtml(bp.replace(/^•\s*/, ''))}</li>`).join('')}
      </ul>
    </div>
  `
    )
    .join('')
    : '<p class="section-text">Experiência não identificada na extração do currículo.</p>'}

  <h2>Educação</h2>
  ${hasEducation
    ? extractedData.education
    .map(
      (edu) =>
        `<p><strong>${escapeHtml(formatEducationLabel(edu))}</strong></p>`
    )
    .join('')
    : '<p class="section-text">Educação não identificada na extração do currículo.</p>'}

  ${hasSkills
    ? `
    <h2>Habilidades</h2>
    <p class="skills-list">${skills.map((s) => escapeHtml(s)).join(', ')}</p>
  `
    : '<h2>Habilidades</h2><p class="section-text">Habilidades não identificadas na extração do currículo.</p>'}

  ${hasCertifications
    ? `
    <h2>Certificações</h2>
    ${extractedData.certifications.map((c) => `<p>${escapeHtml(c)}</p>`).join('')}
  `
    : ''}

  ${hasLanguages
    ? `
    <h2>Idiomas</h2>
    ${extractedData.languages.map((l) => `<p>${escapeHtml(l.language)}: ${escapeHtml(l.level)}</p>`).join('')}
  `
    : ''}

</body>
</html>`;
}

/**
 * Escapa HTML para evitar XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Gera PDF buffer a partir de dados de análise usando Puppeteer
 * @throws Error se Puppeteer não estiver disponível ou falhar
 */
export async function generatePdfBuffer(data: AnalysisResult): Promise<Buffer> {
  const html = generateHtml(data);

  // Importa Puppeteer dinamicamente
  let puppeteer: any;
  try {
    puppeteer = await import('puppeteer');
  } catch {
    throw new Error('Puppeteer não está disponível para gerar o PDF.');
  }

  // Inicia o navegador
  let browser: any;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  } catch {
    throw new Error(
      'Falha ao iniciar o mecanismo de PDF (Chromium). Verifique se as dependências de sistema estão instaladas.'
    );
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
