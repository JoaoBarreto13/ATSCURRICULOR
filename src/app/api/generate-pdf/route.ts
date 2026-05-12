import { NextRequest, NextResponse } from 'next/server';
import { AnalysisResult } from '@/types/resume';

// Uso de Puppeteer para gerar PDF server-side
export async function POST(req: NextRequest) {
  try {
    const data: AnalysisResult = await req.json();
    const { extractedData, correctedResume } = data;

    const html = `<!DOCTYPE html>
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
        ${(exp.bulletPoints || []).map(bp => `<li>${bp.replace(/^•\\s*/, '')}</li>`).join('')}
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
</html>`;

    // Tenta gerar PDF com Puppeteer (server-side)
    let puppeteer: any;
    try {
      puppeteer = await import('puppeteer');
    } catch {
      return NextResponse.json(
        { error: 'Puppeteer não está disponível no servidor para gerar o PDF.' },
        { status: 500 }
      );
    }

    let browser: any;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    } catch {
      return NextResponse.json(
        { error: 'Falha ao iniciar o mecanismo de PDF (Chromium). Verifique dependências do sistema.' },
        { status: 500 }
      );
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' } });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="curriculo-ats.pdf"',
      },
    });
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    return NextResponse.json({ error: 'Erro ao gerar PDF.' }, { status: 500 });
  }
}
