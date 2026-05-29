import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TextRun,
} from 'docx';
import { AnalysisResult } from '@/types/resume';
import { formatContactLine, formatEducationLabel } from './resumeDisplay';

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: title, bold: true })],
    spacing: { before: 240, after: 120 },
  });
}

function createTextParagraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold })],
    spacing: { after: 80 },
  });
}

function createBullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun(text)],
    spacing: { after: 60 },
  });
}

function createSkillsParagraph(skills: string[]): Paragraph {
  return createTextParagraph(skills.join(', '));
}

export async function generateDocxBuffer(data: AnalysisResult): Promise<Buffer> {
  const { extractedData, correctedResume } = data;
  // Use the IA-generated summary when available (it's ATS-optimized),
  // but do NOT allow correctedResume to replace factual fields like role/company in experience.
  // We use the correctedResume bulletPoints since they are optimized for ATS.
  const summary = correctedResume.summary || extractedData.summary;
  const correctedExp = correctedResume.experienceRewritten || [];
  const experienceItems = extractedData.experience.map((exp, idx) => {
    const corrected = correctedExp[idx] || {};
    const bulletPoints = (corrected.bulletPoints && corrected.bulletPoints.length > 0)
      ? corrected.bulletPoints
      : (exp.bulletPoints || []);

    return {
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bulletPoints,
    };
  });
  const skills = extractedData.skills;

  const children: Array<Paragraph | Table> = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: extractedData.name || 'Currículo ATS',
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: formatContactLine(extractedData),
          size: 20,
        }),
      ],
    }),
    createSectionHeading('Resumo Profissional'),
    createTextParagraph(summary || 'Resumo não identificado na extração do currículo.'),
    createSectionHeading('Experiência Profissional'),
  ];

  if (experienceItems.length > 0) {
    experienceItems.forEach((experience) => {
      children.push(
        createTextParagraph(`${experience.role || 'Cargo não informado'} — ${experience.company || 'Empresa não informada'}`, true),
        createTextParagraph(`${experience.startDate || ''} — ${experience.endDate || ''}`),
      );

      (experience.bulletPoints || []).forEach((bulletPoint) => {
        children.push(createBullet(bulletPoint.replace(/^•\s*/, '')));
      });
    });
  } else {
    children.push(createTextParagraph('Experiência não identificada na extração do currículo.'));
  }

  children.push(createSectionHeading('Educação'));
  if (extractedData.education.length > 0) {
    extractedData.education.forEach((education) => {
      children.push(createTextParagraph(formatEducationLabel(education)));
    });
  } else {
    children.push(createTextParagraph('Educação não identificada na extração do currículo.'));
  }

  children.push(createSectionHeading('Habilidades'));
  if (skills.length > 0) {
    children.push(createSkillsParagraph(skills));
  } else {
    children.push(createTextParagraph('Habilidades não identificadas na extração do currículo.'));
  }

  if (extractedData.certifications.length > 0) {
    children.push(createSectionHeading('Certificações'));
    extractedData.certifications.forEach((certification) => {
      children.push(createTextParagraph(certification));
    });
  }

  if (extractedData.languages.length > 0) {
    children.push(createSectionHeading('Idiomas'));
    extractedData.languages.forEach((language) => {
      children.push(createTextParagraph(`${language.language}: ${language.level}`));
    });
  }

  const document = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(document);
  return Buffer.from(buffer);
}
